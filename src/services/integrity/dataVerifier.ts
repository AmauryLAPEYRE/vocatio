// src/services/integrity/dataVerifier.ts
import { CVData } from '@/store/appStore';

/**
 * Classe responsable de vérifier l'intégrité des données
 * pour s'assurer qu'aucune information n'est inventée pendant l'optimisation
 */
export class DataIntegrityVerifier {
  /**
   * Vérifie si une compétence est présente dans la liste de compétences
   */
  isSkillPresent(skill: string, skillsList: string[]): boolean {
    const skillLower = skill.toLowerCase();
    const skillsSet = new Set(skillsList.map(s => s.toLowerCase()));
    
    // Vérification directe
    if (skillsSet.has(skillLower)) {
      return true;
    }
    
    // Vérification partielle (sous-chaîne)
    for (const originalSkill of skillsSet) {
      if (originalSkill.includes(skillLower) || skillLower.includes(originalSkill)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Vérifie si une expérience optimisée est valide par rapport à l'originale
   */
  isExperienceValid(originalExp: any, optimizedExp: any): boolean {
    // Vérifier les champs critiques qui ne doivent pas être modifiés
    if (originalExp.company !== optimizedExp.company ||
        originalExp.title !== optimizedExp.title ||
        originalExp.startDate !== optimizedExp.startDate ||
        originalExp.endDate !== optimizedExp.endDate) {
      return false;
    }
    
    return true;
  }
}