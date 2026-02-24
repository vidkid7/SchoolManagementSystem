#!/bin/sh
# This script replaces the placeholder API URL with the actual one at runtime

echo "Injecting environment variables into built files..."
echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL}"

# Find all JS files in the dist directory and replace the localhost URL
# Replace the full API base URL (with /api/v1)
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|http://localhost:3000/api/v1|${VITE_API_BASE_URL}|g" {} +

echo "Environment variables injected successfully!"
