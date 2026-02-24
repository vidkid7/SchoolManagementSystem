#!/bin/sh
# This script replaces the placeholder API URL with the actual one at runtime

echo "Injecting environment variables into built files..."

# Support both VITE_API_BASE_URL and VITE_API_URL for backwards compatibility
API_URL="${VITE_API_BASE_URL:-${VITE_API_URL}}"

echo "API_URL: ${API_URL}"

if [ -z "$API_URL" ]; then
  echo "WARNING: No API URL configured! Set VITE_API_BASE_URL or VITE_API_URL"
  exit 0
fi

# Find all JS files in the dist directory and replace the localhost URL
# Replace the full API base URL (with /api/v1)
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|http://localhost:3000/api/v1|${API_URL}|g" {} +

echo "Environment variables injected successfully!"
