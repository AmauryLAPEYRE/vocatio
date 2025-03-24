// src/hooks/useImageLazyLoading.tsx
import { useEffect, useRef, useState } from 'react';
  
/**
 * Hook pour gérer le chargement paresseux (lazy loading) des images
 * @param rootMargin Marge autour de la racine (viewport par défaut)
 * @returns Référence à attacher à l'élément et état de chargement
 */
export function useImageLazyLoading(rootMargin: string = '200px 0px') {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            if (image.dataset.src) {
              image.src = image.dataset.src;
              image.onload = () => setIsLoaded(true);
              observer.unobserve(image);
            }
          }
        });
      },
      { rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [rootMargin]);

  return { imgRef, isLoaded };
}
