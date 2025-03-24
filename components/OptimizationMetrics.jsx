// components/OptimizationMetrics.jsx
'use client';

import { useState } from 'react';
import { useVocatioStore } from '@/store';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

export default function OptimizationMetrics() {
  const { optimizationMetrics } = useVocatioStore();
  const [expandedSection, setExpandedSection] = useState('overview');
  
  if (!optimizationMetrics) {
    return null;
  }
  
  const { 
    overallScore, 
    categoryScores, 
    sectionScores, 
    modificationStats,
    textualSummary 
  } = optimizationMetrics;
  
  // Formatage du score global
  const overallScorePercent = Math.round(overallScore * 100);
  
  // Déterminer la couleur du score
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Déterminer la couleur de fond de la barre de progression
  const getProgressColor = (score) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-blue-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Gérer l'expansion des sections
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b flex items-center">
        <ChartBarIcon className="h-5 w-5 text-primary-500 mr-2" />
        <h2 className="text-lg font-semibold">Métriques d'optimisation</h2>
      </div>
      
      {/* Résumé textuel */}
      <div className="p-4 bg-primary-50 border-b">
        <p className="text-primary-800">{textualSummary}</p>
      </div>
      
      {/* Score global */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Score global de correspondance</h3>
          <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScorePercent}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${getProgressColor(overallScore)} h-2.5 rounded-full`}
            style={{ width: `${overallScorePercent}%` }}
          ></div>
        </div>
        
        {/* Statistiques de modification */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Sections modifiées</div>
            <div className="text-xl font-medium">{modificationStats.modifiedBlocks} / {modificationStats.totalBlocks}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Taux de modification</div>
            <div className="text-xl font-medium">{Math.round(modificationStats.modificationRate * 100)}%</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Caractères optimisés</div>
            <div className="text-xl font-medium">{modificationStats.optimizedChars}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Changement moyen</div>
            <div className="text-xl font-medium">{Math.round(modificationStats.averageChangePercentage)}%</div>
          </div>
        </div>
      </div>
      
      {/* Scores par catégorie */}
      <div 
        className={`border-b cursor-pointer ${expandedSection === 'categories' ? 'bg-gray-50' : ''}`}
        onClick={() => toggleSection('categories')}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Scores par catégorie</h3>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transition-transform ${
              expandedSection === 'categories' ? 'transform rotate-180' : ''
            }`} 
          />
        </div>
        
        {expandedSection === 'categories' && (
          <div className="p-4 pt-0">
            <div className="space-y-4">
              {/* Compétences */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-700">Compétences</div>
                  <div className="text-sm font-medium">
                    {categoryScores.skills.matched} / {categoryScores.skills.total}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${categoryScores.skills.score * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryScores.skills.items.map((skill, index) => (
                    <div key={index} className="inline-flex items-center bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mots-clés */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-700">Mots-clés</div>
                  <div className="text-sm font-medium">
                    {categoryScores.keywords.matched} / {categoryScores.keywords.total}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${categoryScores.keywords.score * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryScores.keywords.items.map((keyword, index) => (
                    <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      {keyword}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Responsabilités */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-700">Responsabilités</div>
                  <div className="text-sm font-medium">
                    {categoryScores.responsibilities.matched} / {categoryScores.responsibilities.total}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${categoryScores.responsibilities.score * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {categoryScores.responsibilities.items.slice(0, 3).map((resp, index) => (
                    <div key={index} className="inline-flex items-center bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      {resp.length > 40 ? resp.substring(0, 40) + '...' : resp}
                    </div>
                  ))}
                  
                  {categoryScores.responsibilities.items.length > 3 && (
                    <div className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      +{categoryScores.responsibilities.items.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Scores par section */}
      <div 
        className={`border-b cursor-pointer ${expandedSection === 'sections' ? 'bg-gray-50' : ''}`}
        onClick={() => toggleSection('sections')}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Scores par section</h3>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transition-transform ${
              expandedSection === 'sections' ? 'transform rotate-180' : ''
            }`} 
          />
        </div>
        
        {expandedSection === 'sections' && (
          <div className="p-4 pt-0">
            <div className="space-y-3">
              {sectionScores.map((section, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-gray-700 flex items-center">
                      {getSectionTypeIcon(section.type)}
                      <span className="ml-1">{section.name}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {Math.round(section.score * 100)}%
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${getProgressColor(section.score)} h-2 rounded-full`}
                      style={{ width: `${section.score * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fonction utilitaire pour obtenir l'icône du type de section
function getSectionTypeIcon(type) {
  switch (type) {
    case 'experience':
      return (
        <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'education':
      return (
        <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      );
    case 'skills':
      return (
        <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'languages':
      return (
        <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      );
    case 'profile':
      return (
        <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    default:
      return (
        <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      );
  }
}