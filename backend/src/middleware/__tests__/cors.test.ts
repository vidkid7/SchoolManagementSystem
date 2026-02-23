import request from 'supertest';
import express, { Application } from 'express';
import { corsMiddleware } from '../security';
import { env } from '@config/env';

/**
 * CORS Configuration Tests
 * 
 * Tests CORS middleware configuration to ensure:
 * - Allowed origins are properly configured from environment variables
 * - Credentials are enabled for cookie-based authentication
 * - Appropriate CORS headers are set
 * 
 * Requirements: 36.1
 */

describe('CORS Middleware', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(corsMiddleware);
    
    // Test route
    app.get('/test', (_req, res) => {
      res.json({ success: true, message: 'Test endpoint' });
    });
  });

  describe('Allowed Origins Configuration', () => {
    it('should allow requests from configured origins', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .get('/test')
        .set('Origin', allowedOrigin);

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    });

    it('should reject requests from non-allowed origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'https://malicious-site.com')
        .expect(500); // CORS error results in 500

      expect(response.text).toContain('Not allowed by CORS');
    });

    it('should allow requests with no origin (mobile apps, Postman)', async () => {
      const response = await request(app)
        .get('/test');

      expect(response.status).toBe(200);
    });

    it('should handle multiple allowed origins', async () => {
      // Test each configured origin
      for (const origin of env.ALLOWED_ORIGINS) {
        const response = await request(app)
          .get('/test')
          .set('Origin', origin);

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }
    });
  });

  describe('Credentials Support', () => {
    it('should enable credentials for cookie-based auth', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .get('/test')
        .set('Origin', allowedOrigin);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should include credentials header in preflight response', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .options('/test')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('CORS Headers', () => {
    it('should set appropriate CORS headers for allowed origin', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .get('/test')
        .set('Origin', allowedOrigin);

      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .options('/test')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });

    it('should allow standard HTTP methods', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .options('/test')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'GET');

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('PATCH');
    });

    it('should allow required headers', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .options('/test')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization,X-CSRF-Token,X-School-Code');

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('X-CSRF-Token');
      expect(allowedHeaders).toContain('X-School-Code');
    });

    it('should set max-age for preflight cache', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .options('/test')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-max-age']).toBe('86400'); // 24 hours
    });
  });

  describe('Security Considerations', () => {
    it('should not reflect arbitrary origins', async () => {
      const maliciousOrigin = 'https://evil.com';

      const response = await request(app)
        .get('/test')
        .set('Origin', maliciousOrigin)
        .expect(500);

      expect(response.headers['access-control-allow-origin']).not.toBe(maliciousOrigin);
    });

    it('should not allow wildcard origin with credentials', async () => {
      // This test verifies that we're not using origin: '*' with credentials: true
      // which is a security vulnerability
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .get('/test')
        .set('Origin', allowedOrigin);

      // Should have specific origin, not wildcard
      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(response.headers['access-control-allow-origin']).not.toBe('*');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should validate origin against whitelist', async () => {
      const testOrigins = [
        'https://malicious.com',
        'http://localhost:3001', // Not in default allowed origins
        'https://evil-site.com',
        'http://phishing.com'
      ];

      for (const origin of testOrigins) {
        if (!env.ALLOWED_ORIGINS.includes(origin)) {
          const response = await request(app)
            .get('/test')
            .set('Origin', origin);

          expect(response.status).toBe(500);
          expect(response.text).toContain('Not allowed by CORS');
        }
      }
    });
  });

  describe('Environment Variable Configuration', () => {
    it('should read allowed origins from environment variables', () => {
      expect(env.ALLOWED_ORIGINS).toBeDefined();
      expect(Array.isArray(env.ALLOWED_ORIGINS)).toBe(true);
      expect(env.ALLOWED_ORIGINS.length).toBeGreaterThan(0);
    });

    it('should have default allowed origins for development', () => {
      // In development, should at least have localhost
      const hasLocalhost = env.ALLOWED_ORIGINS.some(origin => 
        origin.includes('localhost')
      );
      
      if (env.NODE_ENV === 'development') {
        expect(hasLocalhost).toBe(true);
      }
    });

    it('should parse comma-separated origins correctly', () => {
      // Verify that origins are properly parsed from comma-separated string
      env.ALLOWED_ORIGINS.forEach(origin => {
        expect(origin).not.toContain(',');
        expect(origin.trim()).toBe(origin); // No leading/trailing whitespace
      });
    });
  });

  describe('Cookie-Based Authentication Support', () => {
    it('should allow cookies to be sent with requests', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      const response = await request(app)
        .get('/test')
        .set('Origin', allowedOrigin)
        .set('Cookie', 'accessToken=test-token');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should support credentials in POST requests', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      // Add a POST route for testing
      app.post('/test-post', (_req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test-post')
        .set('Origin', allowedOrigin)
        .set('Cookie', 'accessToken=test-token')
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Integration with Frontend', () => {
    it('should support typical frontend request patterns', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      // Simulate a typical frontend API call
      const response = await request(app)
        .get('/test')
        .set('Origin', allowedOrigin)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
    });

    it('should handle preflight for complex requests', async () => {
      const allowedOrigin = env.ALLOWED_ORIGINS[0];

      // Preflight for a complex request (custom headers, non-simple method)
      const preflightResponse = await request(app)
        .options('/test')
        .set('Origin', allowedOrigin)
        .set('Access-Control-Request-Method', 'PUT')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization,X-CSRF-Token');

      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers['access-control-allow-methods']).toContain('PUT');

      // Actual request
      app.put('/test', (_req, res) => {
        res.json({ success: true });
      });

      const actualResponse = await request(app)
        .put('/test')
        .set('Origin', allowedOrigin)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer test-token')
        .set('X-CSRF-Token', 'csrf-token')
        .send({ data: 'test' });

      expect(actualResponse.status).toBe(200);
    });
  });
});
