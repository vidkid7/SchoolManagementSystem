/**
 * Unit Tests for Image Upload Component
 * 
 * Requirements: 29.2, 29.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUpload } from '../ImageUpload';
import * as imageCompression from '../../../utils/imageCompression';

// Mock the image compression utility
jest.mock('../../../utils/imageCompression', () => ({
  ...jest.requireActual('../../../utils/imageCompression'),
  compressImage: jest.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageUpload', () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (imageCompression.compressImage as jest.Mock).mockResolvedValue({
      file: new File(['compressed'], 'test.jpg', { type: 'image/jpeg' }),
      originalSize: 500000,
      compressedSize: 150000,
      compressionRatio: 0.3,
      width: 800,
      height: 600,
    });
  });

  it('should render upload area', () => {
    render(<ImageUpload onUpload={mockOnUpload} />);

    expect(screen.getByText(/Click or drag images here to upload/i)).toBeInTheDocument();
  });

  it('should display custom label when provided', () => {
    render(
      <ImageUpload
        onUpload={mockOnUpload}
        label="Upload your photo"
      />
    );

    expect(screen.getByText('Upload your photo')).toBeInTheDocument();
  });

  it('should display custom helper text when provided', () => {
    render(
      <ImageUpload
        onUpload={mockOnUpload}
        helperText="Maximum 1MB per image"
      />
    );

    expect(screen.getByText('Maximum 1MB per image')).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(imageCompression.compressImage).toHaveBeenCalledWith(
        file,
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([expect.any(File)]);
    });
  });

  it('should compress images before upload', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(imageCompression.compressImage).toHaveBeenCalled();
    });
  });

  it('should show compression progress', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    // Should show progress indicator
    await waitFor(() => {
      expect(screen.getByText(/Compressing images/i)).toBeInTheDocument();
    });
  });

  it('should display image preview after upload', async () => {
    render(<ImageUpload onUpload={mockOnUpload} showPreview={true} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
    });
  });

  it('should show compression stats in preview', async () => {
    render(<ImageUpload onUpload={mockOnUpload} showPreview={true} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it('should allow removing uploaded images', async () => {
    render(<ImageUpload onUpload={mockOnUpload} showPreview={true} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: '' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByAltText('test.jpg')).not.toBeInTheDocument();
    });
  });

  it('should validate file type', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Only image files are allowed/i)).toBeInTheDocument();
    });

    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('should enforce max file count', async () => {
    render(<ImageUpload onUpload={mockOnUpload} maxFiles={2} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['image3'], 'test3.jpg', { type: 'image/jpeg' }),
    ];

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/Maximum 2 file\(s\) allowed/i)).toBeInTheDocument();
    });
  });

  it('should support multiple file upload', async () => {
    render(<ImageUpload onUpload={mockOnUpload} maxFiles={3} />);

    const files = [
      new File(['image1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['image2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(imageCompression.compressImage).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([expect.any(File), expect.any(File)]);
    });
  });

  it('should handle drag and drop', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const uploadArea = screen.getByText(/Click or drag images here to upload/i).closest('div');

    // Simulate drag over
    fireEvent.dragOver(uploadArea!);

    // Simulate drop
    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(imageCompression.compressImage).toHaveBeenCalled();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(<ImageUpload onUpload={mockOnUpload} disabled={true} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should not accept files when disabled', async () => {
    const mockOnUploadDisabled = jest.fn();
    render(<ImageUpload onUpload={mockOnUploadDisabled} disabled={true} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Input should be disabled
    expect(input).toBeDisabled();

    // Even if we try to change it, onUpload should not be called
    fireEvent.change(input, { target: { files: [file] } });

    // Wait a bit to ensure no processing happens
    await new Promise(resolve => setTimeout(resolve, 200));

    // onUpload should not be called when disabled
    expect(mockOnUploadDisabled).not.toHaveBeenCalled();
  });

  it('should handle compression errors', async () => {
    (imageCompression.compressImage as jest.Mock).mockRejectedValue(
      new Error('Compression failed')
    );

    render(<ImageUpload onUpload={mockOnUpload} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Compression failed/i)).toBeInTheDocument();
    });

    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('should use custom compression options', async () => {
    const customOptions = {
      maxSizeKB: 100,
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
    };

    render(
      <ImageUpload
        onUpload={mockOnUpload}
        compressionOptions={customOptions}
      />
    );

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(imageCompression.compressImage).toHaveBeenCalledWith(
        file,
        customOptions
      );
    });
  });

  it('should accept custom file types', () => {
    render(
      <ImageUpload
        onUpload={mockOnUpload}
        accept="image/png,image/gif"
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/png,image/gif');
  });

  it('should hide preview when showPreview is false', async () => {
    render(<ImageUpload onUpload={mockOnUpload} showPreview={false} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
    });

    expect(screen.queryByAltText('test.jpg')).not.toBeInTheDocument();
  });

  it('should revoke object URLs on cleanup', async () => {
    const { unmount } = render(<ImageUpload onUpload={mockOnUpload} showPreview={true} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    // Remove the image first
    const deleteButton = await screen.findByRole('button', { name: '' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      // URL should be revoked when image is removed
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
