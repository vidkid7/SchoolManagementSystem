import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LazyImage } from '../LazyImage';

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  elements: Set<Element> = new Set();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  triggerIntersection(isIntersecting: boolean) {
    const entries: IntersectionObserverEntry[] = Array.from(this.elements).map((element) => ({
      target: element,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    }));
    this.callback(entries, this as any);
  }
}

let mockObserver: MockIntersectionObserver;

beforeAll(() => {
  global.IntersectionObserver = jest.fn((callback) => {
    mockObserver = new MockIntersectionObserver(callback);
    return mockObserver as any;
  }) as any;
});

describe('LazyImage', () => {
  it('should render skeleton initially', () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    // Skeleton should be visible
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('should load image when in view', async () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/test-image.jpg');
    });
  });

  it('should apply width and height', () => {
    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '300px', height: '200px' });
  });

  it('should apply aspect ratio', () => {
    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        aspectRatio="16/9"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ aspectRatio: '16/9' });
  });

  it('should show fallback image on error', async () => {
    render(
      <LazyImage
        src="/invalid-image.jpg"
        alt="Test image"
        fallbackSrc="/fallback.jpg"
      />
    );

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
    });

    // Simulate image error
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/fallback.jpg');
    });
  });

  it('should call onLoad callback', async () => {
    const onLoad = jest.fn();

    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    );

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
    });

    // Simulate image load
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();

    render(
      <LazyImage
        src="/invalid-image.jpg"
        alt="Test image"
        onError={onError}
      />
    );

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
    });

    // Simulate image error
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should render custom skeleton', () => {
    const customSkeleton = <div data-testid="custom-skeleton">Loading...</div>;

    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        skeleton={customSkeleton}
      />
    );

    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
  });

  it('should apply custom styles', () => {
    const customStyle = {
      borderRadius: '8px',
      border: '1px solid #ccc',
    };

    const { container } = render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        style={customStyle}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle(customStyle);
  });

  it('should pass through additional img attributes', async () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
        data-testid="custom-image"
      />
    );

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByTestId('custom-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveClass('custom-class');
    });
  });

  it('should have loading="lazy" attribute', async () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  it('should fade in when loaded', async () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />);

    // Trigger intersection
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
    });

    // Initially should have opacity 0
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    expect(img).toHaveStyle({ opacity: 0 });

    // Simulate image load
    img.dispatchEvent(new Event('load'));

    await waitFor(() => {
      expect(img).toHaveStyle({ opacity: 1 });
    });
  });
});
