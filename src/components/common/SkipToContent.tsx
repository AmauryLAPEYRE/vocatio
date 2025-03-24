
  // src/components/common/SkipToContent.tsx
  import React from 'react';
  
  interface SkipToContentProps {
    mainContentId?: string;
  }
  
  /**
   * Composant permettant aux utilisateurs de clavier de sauter directement au contenu principal
   */
  export function SkipToContent({ mainContentId = 'main-content' }: SkipToContentProps) {
    return (
      <a
        href={`#${mainContentId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600 focus:shadow-lg"
      >
        Aller au contenu principal
      </a>
    );
  }