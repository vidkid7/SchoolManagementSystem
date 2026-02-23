/**
 * Request Queue Tests
 * 
 * Tests for request queue manager
 */

import { requestQueue, queuedRequest } from '../requestQueue';

describe('RequestQueueManager', () => {
  beforeEach(() => {
    requestQueue.clear();
    requestQueue.setLiteMode(false);
  });

  describe('enqueue', () => {
    it('should execute requests immediately when under limit', async () => {
      const mockExecute = jest.fn().mockResolvedValue('result');
      
      const result = await requestQueue.enqueue(mockExecute);
      
      expect(result).toBe('result');
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should queue requests when at limit', async () => {
      requestQueue.setLiteMode(true); // Max 2 concurrent
      
      const slowRequest1 = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('1'), 100)));
      const slowRequest2 = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('2'), 100)));
      const fastRequest = jest.fn().mockResolvedValue('3');
      
      const promise1 = requestQueue.enqueue(slowRequest1);
      const promise2 = requestQueue.enqueue(slowRequest2);
      const promise3 = requestQueue.enqueue(fastRequest);
      
      // First two should start immediately
      expect(slowRequest1).toHaveBeenCalled();
      expect(slowRequest2).toHaveBeenCalled();
      
      // Third should be queued
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(fastRequest).not.toHaveBeenCalled();
      
      // Wait for first two to complete
      await Promise.all([promise1, promise2]);
      
      // Third should now execute
      const result3 = await promise3;
      expect(result3).toBe('3');
      expect(fastRequest).toHaveBeenCalled();
    });

    it('should handle request errors', async () => {
      const mockExecute = jest.fn().mockRejectedValue(new Error('Request failed'));
      
      await expect(requestQueue.enqueue(mockExecute)).rejects.toThrow('Request failed');
    });
  });

  describe('setLiteMode', () => {
    it('should change max concurrent requests in lite mode', () => {
      requestQueue.setLiteMode(false);
      let status = requestQueue.getStatus();
      expect(status.maxConcurrentRequests).toBe(6);
      
      requestQueue.setLiteMode(true);
      status = requestQueue.getStatus();
      expect(status.maxConcurrentRequests).toBe(2);
    });
  });

  describe('getStatus', () => {
    it('should return queue status', () => {
      const status = requestQueue.getStatus();
      
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('activeRequests');
      expect(status).toHaveProperty('maxConcurrentRequests');
      expect(status).toHaveProperty('isLiteModeEnabled');
    });
  });

  describe('clear', () => {
    it('should clear all queued requests', async () => {
      requestQueue.setLiteMode(true);
      
      const slowRequest1 = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('1'), 100)));
      const slowRequest2 = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('2'), 100)));
      const queuedRequest1 = jest.fn().mockResolvedValue('3');
      
      requestQueue.enqueue(slowRequest1);
      requestQueue.enqueue(slowRequest2);
      const promise3 = requestQueue.enqueue(queuedRequest1);
      
      // Clear queue
      requestQueue.clear();
      
      // Queued request should be rejected
      await expect(promise3).rejects.toThrow('Request queue cleared');
    });
  });

  describe('queuedRequest helper', () => {
    it('should wrap request execution', async () => {
      const mockExecute = jest.fn().mockResolvedValue('result');
      
      const result = await queuedRequest(mockExecute);
      
      expect(result).toBe('result');
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });
});
