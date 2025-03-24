// src/components/common/LazyImage.tsx
import React from 'react';
import { useImageLazyLoading } from '../../hooks/useImageLazyLoading';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  className?: string;
}

export function LazyImage({ src, alt, width, height, fallbackSrc, className, ...props }: LazyImageProps) {
  const { imgRef, isLoaded } = useImageLazyLoading();

  return (
    <div className={`relative ${width ? `w-[${width}px]` : 'w-full'} ${height ? `h-[${height}px]` : 'h-auto'} overflow-hidden ${className || ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          {fallbackSrc ? (
            <img
              src={fallbackSrc}
              alt={alt}
              className="w-full h-full object-cover opacity-30"
            />
          ) : (
            <div className="text-gray-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      )}
      <img
        ref={imgRef}
        data-src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 w-full h-full object-cover`}
        {...props}
      />
    </div>
  );
}