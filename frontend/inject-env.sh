#!/bin/sh
# This script replaces the placeholder API URL with the actual one at runtime

echo "Injecting environment variables into built files..."
echo "VITE_API_URL: ${VITE_API_URL}"

# Find all JS files in the dist directory and replace the localhost URL
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|http://localhost:3000|${VITE_API_URL}|g" {} +

echo "Environment variables injected successfully!"
