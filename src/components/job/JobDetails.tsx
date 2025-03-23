// src/components/job/JobDetails.tsx
import { useStore } from 'src/store';

export function JobDetails() {
  const jobData = useStore((state) => state.job);
  
  if (!jobData.content) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">Aucune offre d'emploi à afficher. Veuillez d'abord importer une offre.</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 border-b">
        <h3 className="font-medium">Détails de l'offre d'emploi</h3>
      </div>
      
      <div className="p-4">
        {jobData.jobTitle && (
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-800">{jobData.jobTitle}</h4>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              {jobData.companyName && <span className="mr-3">{jobData.companyName}</span>}
              {jobData.jobLocation && <span>{jobData.jobLocation}</span>}
            </div>
          </div>
        )}
        
        {jobData.skills && jobData.skills.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-700 mb-2">Compétences requises</h5>
            <div className="flex flex-wrap gap-2">
              {jobData.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {jobData.requirements && jobData.requirements.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-gray-700 mb-2">Exigences</h5>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
              {jobData.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h5 className="font-medium text-gray-700 mb-2">Description complète</h5>
          <div className="text-sm text-gray-600 whitespace-pre-line max-h-60 overflow-y-auto border p-3 rounded">
            {jobData.content.text}
          </div>
        </div>
      </div>
    </div>
  );
}