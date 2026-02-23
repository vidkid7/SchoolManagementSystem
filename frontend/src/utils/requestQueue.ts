/**
 * Request Queue Manager
 * 
 * Limits concurrent API requests in lite mode
 * Queues requests and processes them sequentially
 */

type QueuedRequest<T> = {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

class RequestQueueManager {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private maxConcurrentRequests = 6; // Default for normal mode
  private liteModeMaxRequests = 2; // Limit for lite mode
  private isLiteModeEnabled = false;
  private requestIdCounter = 0;

  /**
   * Set lite mode status
   */
  setLiteMode(enabled: boolean): void {
    this.isLiteModeEnabled = enabled;
  }

  /**
   * Get current max concurrent requests based on mode
   */
  private getMaxConcurrentRequests(): number {
    return this.isLiteModeEnabled ? this.liteModeMaxRequests : this.maxConcurrentRequests;
  }

  /**
   * Set max concurrent requests for normal mode
   */
  setMaxConcurrentRequests(max: number): void {
    this.maxConcurrentRequests = max;
    this.processQueue();
  }

  /**
   * Set max concurrent requests for lite mode
   */
  setLiteModeMaxRequests(max: number): void {
    this.liteModeMaxRequests = max;
    if (this.isLiteModeEnabled) {
      this.processQueue();
    }
  }

  /**
   * Add request to queue
   */
  enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `req_${++this.requestIdCounter}`;
      this.queue.push({ id, execute, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    const maxConcurrent = this.getMaxConcurrentRequests();

    while (this.activeRequests < maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      } finally {
        this.activeRequests--;
        this.processQueue(); // Process next request
      }
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrentRequests: this.getMaxConcurrentRequests(),
      isLiteModeEnabled: this.isLiteModeEnabled,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach((request) => {
      request.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }
}

// Singleton instance
export const requestQueue = new RequestQueueManager();

/**
 * Wrap a request function to use the queue
 */
export function queuedRequest<T>(execute: () => Promise<T>): Promise<T> {
  return requestQueue.enqueue(execute);
}
