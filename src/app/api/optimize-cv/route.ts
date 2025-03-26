// src/app/api/optimize-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI, PROMPTS } from '@/services/ai/claude';
import { CVData, JobData } from '@/store/appStore';
import { DataIntegrityVerifier } from '@/services/integrity/dataVerifier';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { originalCV, jobPosting } = await request.json() as {
      originalCV: CVData;
      jobPosting: JobData;
    };
    
    if (!originalCV || !jobPosting) {
      return NextResponse.json(
        { error: 'CV ou offre d\'emploi manquant' },
        { status: 400 }
      );
    }
    
    // Créer une copie profonde de l'original
    const optimizedCV: CVData = JSON.parse(JSON.stringify(originalCV));
    const verifier = new DataIntegrityVerifier();
    
    // 1. Optimiser le résumé
    if (originalCV.personalInfo.summary) {
      const summaryPrompt = PROMPTS.SUMMARY_OPTIMIZATION
        .replace('{{ORIGINAL_SUMMARY}}', originalCV.personalInfo.summary)
        .replace('{{JOB_TITLE}}', jobPosting.title)
        .replace('{{JOB_DESCRIPTION}}', jobPosting.description);
      
      const optimizedSummary = await callAI(summaryPrompt, { temperature: 0.3 });
      optimizedCV.personalInfo.summary = optimizedSummary;
    }
    
    // 2. Optimiser les compétences
    if (originalCV.skills && originalCV.skills.length > 0) {
      const skillsPrompt = PROMPTS.SKILLS_OPTIMIZATION
        .replace('{{ORIGINAL_SKILLS}}', JSON.stringify(originalCV.skills))
        .replace('{{REQUIRED_SKILLS}}', JSON.stringify(jobPosting.requiredSkills || []))
        .replace('{{PREFERRED_SKILLS}}', JSON.stringify(jobPosting.preferredSkills || []));
      
      const optimizedSkillsResponse = await callAI(skillsPrompt, { temperature: 0.2 });
      
      try {
        const optimizedSkills = JSON.parse(optimizedSkillsResponse);
        
        // Vérifier l'intégrité des compétences
        for (const skill of optimizedSkills) {
          if (!verifier.isSkillPresent(skill, originalCV.skills)) {
            console.warn(`Compétence potentiellement inventée détectée: ${skill}`);
            // Ne pas inclure cette compétence
            continue;
          }
        }
        
        optimizedCV.skills = optimizedSkills;
      } catch (error) {
        console.error('Erreur lors de l\'optimisation des compétences:', error);
        // Garder les compétences originales en cas d'erreur
      }
    }
    
    // 3. Optimiser les expériences (une par une)
    if (originalCV.experiences && originalCV.experiences.length > 0) {
      const optimizedExperiences = await Promise.all(
        originalCV.experiences.map(async (experience) => {
          const experiencePrompt = PROMPTS.EXPERIENCE_OPTIMIZATION
            .replace('{{ORIGINAL_EXPERIENCE}}', JSON.stringify(experience))
            .replace('{{JOB_REQUIREMENTS}}', JSON.stringify(jobPosting));
          
          const optimizedExperienceResponse = await callAI(experiencePrompt, { temperature: 0.3 });
          
          try {
            const optimizedExperience = JSON.parse(optimizedExperienceResponse);
            
            // Vérifier l'intégrité de l'expérience
            if (verifier.isExperienceValid(experience, optimizedExperience)) {
              return optimizedExperience;
            } else {
              console.warn(`Expérience potentiellement altérée: ${experience.company}`);
              return experience; // Utiliser l'original en cas de problème
            }
          } catch (error) {
            console.error(`Erreur lors de l'optimisation de l'expérience ${experience.company}:`, error);
            return experience; // Utiliser l'original en cas d'erreur
          }
        })
      );
      
      // Trier les expériences optimisées par pertinence
      optimizedCV.experiences = optimizedExperiences;
    }
    
    // 4. Calculer un score de correspondance
    optimizedCV.matchScore = calculateMatchScore(optimizedCV, jobPosting);
    
    return NextResponse.json({ data: optimizedCV });
  } catch (error) {
    console.error('Erreur lors de l\'optimisation du CV:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'optimisation du CV' },
      { status: 500 }
    );
  }
}

// Fonction pour calculer le score de correspondance
function calculateMatchScore(cv: CVData, job: JobData): number {
  let score = 0;
  const weights = {
    skills: 0.4,
    experience: 0.4,
    education: 0.2
  };
  
  // Score pour les compétences
  if (job.requiredSkills && job.requiredSkills.length > 0 && cv.skills && cv.skills.length > 0) {
    const requiredSkillsSet = new Set(job.requiredSkills.map(s => s.toLowerCase()));
    const userSkillsSet = new Set(cv.skills.map(s => s.toLowerCase()));
    
    let matchedSkills = 0;
    requiredSkillsSet.forEach(skill => {
      if ([...userSkillsSet].some(userSkill => 
        userSkill.includes(skill) || skill.includes(userSkill)
      )) {
        matchedSkills++;
      }
    });
    
    const skillScore = requiredSkillsSet.size > 0 ? matchedSkills / requiredSkillsSet.size : 0;
    score += skillScore * weights.skills;
  }
  
  // Score pour l'expérience (simplifié)
  if (job.title && cv.experiences && cv.experiences.length > 0) {
    const jobTitle = job.title.toLowerCase();
    
    // Vérifier si au moins une expérience a un titre similaire
    const hasRelevantExperience = cv.experiences.some(exp => {
      const expTitle = exp.title.toLowerCase();
      return calculateTextSimilarity(expTitle, jobTitle) > 0.3;
    });
    
    score += (hasRelevantExperience ? 1 : 0.5) * weights.experience;
  }
  
  // Score pour l'éducation (simplifié)
  if (job.educationLevel && cv.education && cv.education.length > 0) {
    const educationLevels: Record<string, number> = {
      'high school': 1,
      'associate': 2,
      'bachelor': 3,
      'master': 4,
      'phd': 5,
      'doctorate': 5
    };
    
    const requiredLevel = Object.keys(educationLevels).find(level => 
      job.educationLevel!.toLowerCase().includes(level)
    );
    
    if (requiredLevel) {
      const userHighestEducation = Math.max(...cv.education.map(edu => {
        const level = Object.keys(educationLevels).find(l => 
          edu.degree && edu.degree.toLowerCase().includes(l)
        );
        return level ? educationLevels[level] : 0;
      }));
      
      const educationScore = userHighestEducation >= educationLevels[requiredLevel] ? 1 : 
        userHighestEducation / educationLevels[requiredLevel];
      
      score += educationScore * weights.education;
    }
  }
  
  // Normaliser le score entre 0 et 100%
  return Math.round(score * 100);
}

// Calcule la similarité entre deux textes (simplifiée)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\W+/);
  const words2 = text2.toLowerCase().split(/\W+/);
  
  const words1Set = new Set(words1);
  const words2Set = new Set(words2);
  
  let commonWords = 0;
  words1Set.forEach(word => {
    if (words2Set.has(word) && word.length > 3) { // Ignorer les mots courts
      commonWords++;
    }
  });
  
  return commonWords / Math.max(words1Set.size, words2Set.size);
}