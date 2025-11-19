import React, { useState, useEffect } from 'react';

interface PhotoWithFallbacksProprs {
  src: string;
  fallbackSrc?: string; // URL for the default image
  alt: string;
  className?: string; // Allow passing Tailwind classes for styling
}

const PhotoWithFallbacks: React.FC<PhotoWithFallbacksProprs> = ({ 
  src, 
  fallbackSrc = '/img/profile/default192.webp', // Default fallback image path
  alt, 
  className = '' 
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset state when the primary `src` prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    // If the primary image failed and we have a fallback, try the fallback
    if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
      console.log(`ImageWithFallbacks: Error loading ${currentSrc}, trying fallback ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
    } else {
      // If fallback also fails, or there's no fallback, or it was already tried, show error/SVG
      console.log(`ImageWithFallbacks: Error loading image ${currentSrc}, showing fallback UI.`);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    // Image loaded successfully
    console.log(`ImageWithFallbacks: Successfully loaded ${currentSrc}`);
  };

  // If there was an error loading both primary and fallback, show SVG
  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <svg 
          className="w-16 h-16 text-gray-400" // Adjust size and color as needed
          fill="currentColor" 
          viewBox="0 0 24 24" 
          aria-hidden="true"
        >
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="sr-only">{alt}</span> {/* For accessibility */}
      </div>
    );
  }

  // Render the img tag with the current source (primary or fallback)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default PhotoWithFallbacks;
