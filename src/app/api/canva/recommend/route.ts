// src/app/api/canva/recommend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/services/ai/claude';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { jobTitle, jobDescription } = await request.json();
    
    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Titre du poste manquant' },
        { status: 400 }
      );
    }
    
    // Récupérer tous les templates
    const templatesResponse = await fetch(new URL('/api/canva/templates', request.url).toString());
    
    if (!templatesResponse.ok) {
      const errorData = await templatesResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de la récupération des templates' },
        { status: templatesResponse.status }
      );
    }
    
    const templatesData = await templatesResponse.json();
    
    // Si Canva renvoie une erreur ou un format inattendu, utiliser des templates par défaut
    if (!templatesData.templates || !Array.isArray(templatesData.templates)) {
      const defaultTemplates = [
        {
          id: 'template-minimal',
          name: 'Minimal',
          thumbnailUrl: '/placeholders/minimal-cv.png',
          category: 'resume',
          tags: ['simple', 'clean', 'modern'],
          description: 'Design épuré et professionnel, idéal pour tout secteur.'
        },
        {
          id: 'template-professional',
          name: 'Professionnel',
          thumbnailUrl: '/placeholders/professional-cv.png',
          category: 'resume',
          tags: ['corporate', 'formal', 'traditional'],
          description: 'Design formel et traditionnel, parfait pour les secteurs conservateurs.'
        },
        {
          id: 'template-creative',
          name: 'Créatif',
          thumbnailUrl: '/placeholders/creative-cv.png',
          category: 'resume',
          tags: ['modern', 'colorful', 'unique'],
          description: 'Design moderne et coloré pour les profils créatifs.'
        }
      ];
      
      return NextResponse.json({ templates: defaultTemplates });
    }
    
    // Utiliser Claude pour recommander les meilleurs templates
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        // Si pas d'API key, retourner simplement les 3 premiers templates
        return NextResponse.json({ 
          templates: templatesData.templates.slice(0, 3),
          note: "Recommandations basiques (API Claude non configurée)" 
        });
      }
      
      const prompt = `
      Basé sur cette offre d'emploi et cette liste de templates CV, identifie les 3 templates les plus appropriés.
      
      Offre d'emploi:
      Titre: ${jobTitle}
      Description: ${jobDescription || "Pas de description fournie"}
      
      Templates disponibles:
      ${JSON.stringify(templatesData.templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        tags: t.tags || [],
        category: t.category || "",
        description: t.description || ""
      })))}
      
      Réponds uniquement avec un tableau JSON des 3 IDs des templates les plus pertinents, sans commentaire additionnel.
      Exemple: ["template-id-1", "template-id-2", "template-id-3"]
      `;
      
      const aiResponse = await callAI(prompt, {
        temperature: 0.2,
        max_tokens: 1000
      });
      
      try {
        // Tenter de parser la réponse de Claude comme un tableau d'IDs
        const recommendedIds = JSON.parse(aiResponse);
        
        if (Array.isArray(recommendedIds)) {
          // Filtrer les templates pour obtenir les recommandés
          const recommendedTemplates = templatesData.templates.filter(
            (t: any) => recommendedIds.includes(t.id)
          );
          
          // Compléter jusqu'à 3 templates si nécessaire
          if (recommendedTemplates.length < 3) {
            const otherTemplates = templatesData.templates.filter(
              (t: any) => !recommendedIds.includes(t.id)
            );
            
            return NextResponse.json({
              templates: [
                ...recommendedTemplates,
                ...otherTemplates.slice(0, 3 - recommendedTemplates.length)
              ]
            });
          }
          
          return NextResponse.json({ templates: recommendedTemplates });
        }
      } catch (parseError) {
        console.error('Erreur lors du parsing de la réponse Claude:', parseError);
        // En cas d'erreur, utiliser les 3 premiers templates
      }
    } catch (aiError) {
      console.error('Erreur lors de l\'appel à Claude:', aiError);
      // Continuer avec les templates par défaut
    }
    
    // Fallback: retourner les 3 premiers templates
    return NextResponse.json({ 
      templates: templatesData.templates.slice(0, 3),
      note: "Recommandations par défaut" 
    });
  } catch (error) {
    console.error('Erreur lors de la recommandation de templates:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la recommandation de templates' },
      { status: 500 }
    );
  }
}