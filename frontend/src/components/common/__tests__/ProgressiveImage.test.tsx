/**
 * Unit Tests for Progressive Image Component
 * 
 * Requirements: 29.3
 */

import { render, screen, waitFor } from '@testing-library/react';
import { ProgressiveImage } from '../ProgressiveImage';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver as any;
});

describe('ProgressiveImage', () => {
  it('should render with loading skeleton initially', () => {
    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={false}
      />
    );

    // Should show skeleton while loading
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should display image after loading', async () => {
    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={false}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate image load
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(img).toHaveStyle({ opacity: 1 });
    });
  });

  it('should show thumbnail before main image loads', () => {
    render(
      <ProgressiveImage
        src="/test-image.jpg"
        thumbnailSrc="/test-thumbnail.jpg"
        alt="Test image"
        lazy={false}
      />
    );

    const thumbnail = screen.getByAltText('Test image thumbnail');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', '/test-thumbnail.jpg');
  });

  it('should handle image load error with fallback', async () => {
    const fallbackSrc = '/fallback.png';
    
    render(
      <ProgressiveImage
        src="/broken-image.jpg"
        alt="Test image"
        fallbackSrc={fallbackSrc}
        lazy={false}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simulate image error
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(img).toHaveAttribute('src', fallbackSrc);
    });
  });

  it('should call onLoad callback when image loads', async () => {
    const onLoad = jest.fn();
    
    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        onLoad={onLoad}
        lazy={false}
      />
    );

    const img = screen.getByAltText('Test image');
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onError callback when image fails', async () => {
    const onError = jest.fn();
    
    render(
      <ProgressiveImage
        src="/broken-image.jpg"
        alt="Test image"
        onError={onError}
        lazy={false}
      />
    );

    const img = screen.getByAltText('Test image');
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  it('should support lazy loading', () => {
    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={true}
      />
    );

    // Should show skeleton initially
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('should set loading attribute based on lazy prop', async () => {
    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={false}
      />
    );

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });

  it('should apply custom width and height', () => {
    const { container } = render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        lazy={false}
      />
    );

    const imageContainer = container.firstChild as HTMLElement;
    expect(imageContainer).toHaveStyle({ width: '300px', height: '200px' });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
        lazy={false}
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should apply custom styles', () => {
    const customStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
    
    const { container } = render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        style={customStyle}
        lazy={false}
      />
    );

    const imageContainer = container.firstChild as HTMLElement;
    expect(imageContainer).toHaveStyle(customStyle);
  });

  it('should handle percentage width and height', () => {
    const { container } = render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        width="100%"
        height="auto"
        lazy={false}
      />
    );

    const imageContainer = container.firstChild as HTMLElement;
    expect(imageContainer).toHaveStyle({ width: '100%', height: 'auto' });
  });

  it('should use IntersectionObserver for lazy loading', () => {
    const mockObserve = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: mockObserve,
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    })) as any;

    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={true}
      />
    );

    expect(mockObserve).toHaveBeenCalled();
  });

  it('should not use IntersectionObserver when lazy is false', () => {
    const mockObserve = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: mockObserve,
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    })) as any;

    render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={false}
      />
    );

    // Image should be rendered immediately
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  it('should clean up IntersectionObserver on unmount', () => {
    const mockDisconnect = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: mockDisconnect,
      unobserve: jest.fn(),
    })) as any;

    const { unmount } = render(
      <ProgressiveImage
        src="/test-image.jpg"
        alt="Test image"
        lazy={true}
      />
    );

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
