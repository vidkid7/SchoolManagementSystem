import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyList } from '../LazyList';

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

interface TestItem {
  id: number;
  name: string;
}

describe('LazyList', () => {
  const mockItems: TestItem[] = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  const mockFetchItems = jest.fn(async (page: number, pageSize: number) => {
    const start = page * pageSize;
    const end = start + pageSize;
    const items = mockItems.slice(start, end);
    return { items, total: mockItems.length };
  });

  const renderItem = (item: TestItem) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.name}
    </div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should load and display initial items', async () => {
    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
        pageSize={10}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    expect(mockFetchItems).toHaveBeenCalledWith(0, 10);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 10')).toBeInTheDocument();
  });

  it('should display empty state when no items', async () => {
    const emptyFetchItems = jest.fn(async () => ({ items: [], total: 0 }));

    render(
      <LazyList
        fetchItems={emptyFetchItems}
        renderItem={renderItem}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  it('should display custom empty component', async () => {
    const emptyFetchItems = jest.fn(async () => ({ items: [], total: 0 }));
    const emptyComponent = <div>Custom empty message</div>;

    render(
      <LazyList
        fetchItems={emptyFetchItems}
        renderItem={renderItem}
        emptyComponent={emptyComponent}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors', async () => {
    const errorFetchItems = jest.fn(async () => {
      throw new Error('Failed to fetch items');
    });

    render(
      <LazyList
        fetchItems={errorFetchItems}
        renderItem={renderItem}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch items')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should retry on error', async () => {
    const errorFetchItems = jest.fn()
      .mockRejectedValueOnce(new Error('Failed to fetch items'))
      .mockResolvedValueOnce({ items: mockItems.slice(0, 10), total: mockItems.length });

    render(
      <LazyList
        fetchItems={errorFetchItems}
        renderItem={renderItem}
        pageSize={10}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch items')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });
  });

  it('should load more items with infinite scroll', async () => {
    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
        pageSize={10}
        infiniteScroll={true}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    // Trigger infinite scroll
    mockObserver.triggerIntersection(true);

    await waitFor(() => {
      expect(mockFetchItems).toHaveBeenCalledTimes(2);
    });
  });

  it('should show "Load More" button when infinite scroll is disabled', async () => {
    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
        pageSize={10}
        infiniteScroll={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('should load more items when clicking "Load More" button', async () => {
    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
        pageSize={10}
        infiniteScroll={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    await userEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(mockFetchItems).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('item-11')).toBeInTheDocument();
    });
  });

  it('should show end of list message when all items loaded', async () => {
    const smallFetchItems = jest.fn(async (page: number, pageSize: number) => {
      const items = mockItems.slice(0, 15); // Only 15 items total
      const start = page * pageSize;
      const end = start + pageSize;
      return { items: items.slice(start, end), total: 15 };
    });

    render(
      <LazyList
        fetchItems={smallFetchItems}
        renderItem={renderItem}
        pageSize={10}
        infiniteScroll={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
    });

    // Load more
    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    await userEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText(/showing all 15 items/i)).toBeInTheDocument();
    });
  });

  it('should display custom loading component', () => {
    const loadingComponent = <div>Custom loading...</div>;

    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
        loadingComponent={loadingComponent}
      />
    );

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('should display custom error component', async () => {
    const errorFetchItems = jest.fn(async () => {
      throw new Error('Failed to fetch items');
    });

    const errorComponent = (error: Error, retry: () => void) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Try again</button>
      </div>
    );

    render(
      <LazyList
        fetchItems={errorFetchItems}
        renderItem={renderItem}
        errorComponent={errorComponent}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/custom error/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should apply custom container props', async () => {
    render(
      <LazyList
        fetchItems={mockFetchItems}
        renderItem={renderItem}
        containerProps={{
          'data-testid': 'custom-container',
          sx: { padding: 2 },
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-container')).toBeInTheDocument();
    });
  });
});
