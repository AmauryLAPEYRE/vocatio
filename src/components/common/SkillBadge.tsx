// src/components/common/SkillBadge.tsx
interface SkillBadgeProps {
    skill: string;
    inCV: boolean;
    inJob: boolean;
    relevant: boolean;
  }
  
  export function SkillBadge({ skill, inCV, inJob, relevant }: SkillBadgeProps) {
    // Déterminer la couleur du badge en fonction des correspondances
    const getBadgeColor = () => {
      if (inCV && inJob && relevant) {
        return 'bg-green-100 text-green-800 border-green-200'; // Match parfait
      } else if (inCV && inJob) {
        return 'bg-blue-100 text-blue-800 border-blue-200'; // Présent dans les deux
      } else if (inCV && !inJob) {
        return 'bg-gray-100 text-gray-800 border-gray-200'; // Uniquement dans le CV
      } else if (!inCV && inJob) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Manquant dans le CV
      } else {
        return 'bg-gray-100 text-gray-600 border-gray-200'; // Autre cas
      }
    };
    
    // Déterminer l'icône à afficher
    const getIcon = () => {
      if (inCV && inJob && relevant) {
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      } else if (inCV && inJob) {
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      } else if (!inCV && inJob) {
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      }
      return null;
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor()}`}>
        {getIcon()}
        {skill}
      </span>
    );
  }