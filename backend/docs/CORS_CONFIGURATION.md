# CORS Configuration Documentation

## Overview

This document describes the Cross-Origin Resource Sharing (CORS) configuration for the School Management System API. The implementation ensures secure cross-origin requests while supporting cookie-based authentication.

**Requirements:** 36.1

## Implementation

### Location
- **Middleware:** `backend/src/middleware/security.ts`
- **Configuration:** `backend/src/config/env.ts`
- **Tests:** `backend/src/middleware/__tests__/cors.test.ts`

### Features

#### 1. Configurable Allowed Origins
- Origins are configured via the `ALLOWED_ORIGINS` environment variable
- Supports multiple origins (comma-separated list)
- Validates all incoming requests against the whitelist
- Rejects requests from non-allowed origins

**Environment Variable:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://school.example.com
```

#### 2. Credentials Support
- Enables `credentials: true` for cookie-based authentication
- Allows cookies, authorization headers, and TLS client certificates
- Required for JWT tokens stored in httpOnly cookies
- Supports session-based authentication

#### 3. Appropriate CORS Headers

**Response Headers:**
- `Access-Control-Allow-Origin`: Specific origin (not wildcard)
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, PATCH
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-CSRF-Token, X-School-Code
- `Access-Control-Max-Age`: 86400 (24 hours)

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Development:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
```

**Production:**
```env
ALLOWED_ORIGINS=https://admin.school.edu.np,https://student.school.edu.np,https://parent.school.edu.np
```

### Multiple Portals

For separate frontend portals (Admin, Teacher, Student, Parent):

```env
ALLOWED_ORIGINS=https://admin.school.edu.np,https://teacher.school.edu.np,https://student.school.edu.np,https://parent.school.edu.np
```

## Security Considerations

### 1. No Wildcard Origins
- Never uses `origin: '*'` with `credentials: true`
- Always validates against specific whitelist
- Prevents unauthorized cross-origin access

### 2. Origin Validation
- Validates every request origin
- Rejects requests from non-whitelisted origins
- Logs CORS violations for security monitoring

### 3. Credentials Security
- Credentials only allowed for whitelisted origins
- Prevents credential leakage to malicious sites
- Supports secure cookie transmission

### 4. Preflight Caching
- Preflight responses cached for 24 hours
- Reduces preflight request overhead
- Improves performance for complex requests

## Usage Examples

### Frontend API Calls

**Axios Configuration:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // Enable credentials
  headers: {
    'Content-Type': 'application/json'
  }
});

// Make authenticated request
const response = await api.get('/students', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Fetch API:**
```typescript
const response = await fetch('http://localhost:3000/api/v1/students', {
  method: 'GET',
  credentials: 'include', // Enable credentials
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Complex Requests (Preflight)

For requests with custom headers or non-simple methods:

```typescript
// Browser automatically sends preflight OPTIONS request
const response = await fetch('http://localhost:3000/api/v1/students', {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(studentData)
});
```

## Testing

### Run CORS Tests

```bash
cd backend
npm test -- cors.test.ts
```

### Test Coverage

The test suite includes 21 tests covering:
- ✅ Allowed origins configuration
- ✅ Credentials support
- ✅ CORS headers
- ✅ Security considerations
- ✅ Environment variable configuration
- ✅ Cookie-based authentication
- ✅ Frontend integration patterns

### Manual Testing

**Test Allowed Origin:**
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3000/api/v1/students
```

**Test Rejected Origin:**
```bash
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3000/api/v1/students
```

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Cause:** Request origin not in ALLOWED_ORIGINS

**Solution:**
1. Check your frontend URL
2. Add it to ALLOWED_ORIGINS in .env
3. Restart the backend server

### CORS Error: "Credentials flag is true, but Access-Control-Allow-Credentials is not"

**Cause:** Credentials not enabled or wildcard origin used

**Solution:**
- Verify `credentials: true` in CORS config
- Ensure specific origins (not wildcard)
- Check frontend uses `withCredentials: true` or `credentials: 'include'`

### Preflight Request Fails

**Cause:** Custom headers not allowed

**Solution:**
1. Check if header is in `allowedHeaders` list
2. Add custom header to CORS configuration
3. Restart backend server

### Cookies Not Sent

**Cause:** Credentials not enabled or SameSite policy

**Solution:**
1. Enable `withCredentials: true` in frontend
2. Verify `credentials: true` in CORS config
3. Check cookie SameSite attribute
4. Ensure HTTPS in production

## Best Practices

### 1. Development vs Production

**Development:**
- Allow localhost origins
- Enable multiple ports for different dev servers

**Production:**
- Use HTTPS origins only
- Limit to specific production domains
- Never use wildcard origins

### 2. Multiple Environments

Use different .env files:

```bash
# .env.development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# .env.staging
ALLOWED_ORIGINS=https://staging-admin.school.edu.np,https://staging-student.school.edu.np

# .env.production
ALLOWED_ORIGINS=https://admin.school.edu.np,https://student.school.edu.np
```

### 3. Security Checklist

- [ ] Never use wildcard (`*`) with credentials
- [ ] Always validate origins against whitelist
- [ ] Use HTTPS in production
- [ ] Enable credentials only when needed
- [ ] Set appropriate preflight cache duration
- [ ] Monitor CORS errors in logs
- [ ] Regularly review allowed origins list

### 4. Performance Optimization

- Cache preflight responses (24 hours)
- Minimize custom headers
- Use simple requests when possible
- Batch API calls to reduce preflight overhead

## Related Documentation

- [Security Middleware](../src/middleware/README.md#security-middleware)
- [Environment Configuration](../src/config/env.ts)
- [Authentication Guide](./AUTHENTICATION.md)

## References

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP: CORS Security](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny)
- [W3C: CORS Specification](https://www.w3.org/TR/cors/)

## Changelog

### Version 1.0.0 (Current)
- Initial CORS implementation
- Environment-based origin configuration
- Credentials support for cookie-based auth
- Comprehensive test coverage (21 tests)
- Security hardening (no wildcard origins)
