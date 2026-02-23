/**
 * Progressive Image Component
 * 
 * Displays images with progressive loading for better UX on slow networks
 * 
 * Requirements: 29.3
 * 
 * Features:
 * - Blur-up technique with low-quality placeholder
 * - Lazy loading support
 * - Fade-in animation when loaded
 * - Error handling with fallback
 * - Loading skeleton
 */

import { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  thumbnailSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  lazy?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const ImageContainer = styled(Box)({
  position: 'relative',
  overflow: 'hidden',
  display: 'inline-block',
});

const StyledImage = styled('img')<{ loaded: boolean }>(({ loaded }) => ({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: loaded ? 1 : 0,
  transition: 'opacity 0.3s ease-in-out',
}));

const ThumbnailImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'blur(10px)',
  transform: 'scale(1.1)',
});

/**
 * Progressive Image Component
 * 
 * Loads images progressively with blur-up technique
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  thumbnailSrc,
  className,
  style,
  lazy = true,
  fallbackSrc = '/images/placeholder.png',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  const handleError = () => {
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <ImageContainer
      ref={containerRef}
      className={className}
      style={{ width, height, ...style }}
    >
      {!isInView && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
        />
      )}

      {isInView && (
        <>
          {/* Thumbnail/Placeholder */}
          {thumbnailSrc && !isLoaded && (
            <ThumbnailImage
              src={thumbnailSrc}
              alt={`${alt} thumbnail`}
              aria-hidden="true"
            />
          )}

          {/* Main Image */}
          <StyledImage
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            loaded={isLoaded}
            onLoad={handleLoad}
            onError={handleError}
            loading={lazy ? 'lazy' : 'eager'}
          />

          {/* Loading Skeleton */}
          {!isLoaded && !thumbnailSrc && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
              />
            </Box>
          )}
        </>
      )}
    </ImageContainer>
  );
};

export default ProgressiveImage;
