import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { useLazyLoad } from '../../hooks/useLazyLoad';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Image source URL
   */
  src: string;
  
  /**
   * Alt text for accessibility
   */
  alt: string;
  
  /**
   * Width of the image (for skeleton loader)
   */
  width?: number | string;
  
  /**
   * Height of the image (for skeleton loader)
   */
  height?: number | string;
  
  /**
   * Aspect ratio (e.g., '16/9', '4/3')
   */
  aspectRatio?: string;
  
  /**
   * Fallback image URL if loading fails
   */
  fallbackSrc?: string;
  
  /**
   * Custom skeleton component
   */
  skeleton?: React.ReactNode;
  
  /**
   * Callback when image loads
   */
  onLoad?: () => void;
  
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

/**
 * LazyImage component with lazy loading support
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Skeleton loader while loading
 * - Fallback image on error
 * - Aspect ratio support
 * 
 * Requirements: 29.6
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  aspectRatio,
  fallbackSrc = '/images/placeholder.png',
  skeleton,
  onLoad,
  onError,
  style,
  ...props
}) => {
  const { ref, isInView } = useLazyLoad<HTMLDivElement>();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || 'auto',
    aspectRatio: aspectRatio,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
  };

  return (
    <Box ref={ref} style={containerStyle}>
      {/* Show skeleton while not in view or loading */}
      {(!isInView || !isLoaded) && !hasError && (
        skeleton || (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ position: 'absolute', top: 0, left: 0 }}
          />
        )
      )}

      {/* Load image only when in view */}
      {isInView && (
        <img
          src={hasError ? fallbackSrc : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          style={imageStyle}
          {...props}
        />
      )}
    </Box>
  );
};
