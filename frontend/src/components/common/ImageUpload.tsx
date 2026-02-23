/**
 * Image Upload Component
 * 
 * Reusable image upload component with client-side compression
 * 
 * Requirements: 29.2, 29.3
 * 
 * Features:
 * - Drag and drop support
 * - Image preview with progressive loading
 * - Client-side compression before upload
 * - File validation
 * - Progress indicator
 * - Multiple file support
 */

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  compressImage,
  isImageFile,
  formatFileSize,
  CompressionOptions,
  CompressionResult,
  PHOTO_COMPRESSION_OPTIONS,
} from '../../utils/imageCompression';
import { ProgressiveImage } from './ProgressiveImage';

interface ImageUploadProps {
  onUpload: (files: File[]) => void | Promise<void>;
  maxFiles?: number;
  compressionOptions?: CompressionOptions;
  accept?: string;
  disabled?: boolean;
  showPreview?: boolean;
  label?: string;
  helperText?: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  compressionResult?: CompressionResult;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  maxFiles = 1,
  compressionOptions = PHOTO_COMPRESSION_OPTIONS,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  disabled = false,
  showPreview = true,
  label,
  helperText,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      setError(null);
      setIsCompressing(true);
      setCompressionProgress(0);

      try {
        const fileArray = Array.from(files);
        
        // Validate file count
        if (images.length + fileArray.length > maxFiles) {
          setError(t(`Maximum ${maxFiles} file(s) allowed`));
          setIsCompressing(false);
          return;
        }

        // Validate file types
        const invalidFiles = fileArray.filter(file => !isImageFile(file));
        if (invalidFiles.length > 0) {
          setError(t('Only image files are allowed'));
          setIsCompressing(false);
          return;
        }

        // Compress images
        const compressedImages: UploadedImage[] = [];
        
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          
          // Compress image
          const result = await compressImage(file, compressionOptions);
          
          // Create preview URL
          const preview = URL.createObjectURL(result.file);
          
          compressedImages.push({
            file: result.file,
            preview,
            compressionResult: result,
          });

          // Update progress
          setCompressionProgress(((i + 1) / fileArray.length) * 100);
        }

        // Update state
        setImages(prev => [...prev, ...compressedImages]);

        // Call onUpload callback
        const uploadFiles = compressedImages.map(img => img.file);
        await onUpload(uploadFiles);

      } catch (err: any) {
        setError(err.message || t('Failed to process images'));
      } finally {
        setIsCompressing(false);
        setCompressionProgress(0);
      }
    },
    [images, maxFiles, compressionOptions, onUpload, t, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!disabled) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      // Revoke object URL to free memory
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderWidth: 2,
          borderStyle: 'dashed',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: disabled ? 'background.paper' : 'action.hover',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />

        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        
        <Typography variant="body1" gutterBottom>
          {label || t('Click or drag images here to upload')}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {helperText || t(`Maximum ${compressionOptions.maxSizeKB}KB per image (auto-compressed)`)}
        </Typography>

        {maxFiles > 1 && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {t(`Up to ${maxFiles} files`)}
          </Typography>
        )}
      </Paper>

      {/* Compression Progress */}
      {isCompressing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={compressionProgress} />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {t('Compressing images...')} {Math.round(compressionProgress)}%
          </Typography>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Image Previews */}
      {showPreview && images.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper variant="outlined" sx={{ p: 1, position: 'relative' }}>
                <Box sx={{ position: 'relative', paddingTop: '100%' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <ProgressiveImage
                      src={image.preview}
                      alt={image.file.name}
                      width="100%"
                      height="100%"
                      lazy={false}
                    />
                  </Box>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" noWrap display="block">
                    {image.file.name}
                  </Typography>
                  
                  {image.compressionResult && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={formatFileSize(image.compressionResult.compressedSize)}
                        size="small"
                        color="success"
                      />
                      {image.compressionResult.compressionRatio < 1 && (
                        <Chip
                          label={`${Math.round((1 - image.compressionResult.compressionRatio) * 100)}% saved`}
                          size="small"
                          color="info"
                        />
                      )}
                    </Box>
                  )}
                </Box>

                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
                  }}
                  onClick={() => handleRemoveImage(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ImageUpload;
