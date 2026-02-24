#!/bin/sh
# This script replaces the runtime config with actual environment variables

echo "Injecting environment variables..."

# Support both VITE_API_BASE_URL and VITE_API_URL for backwards compatibility
API_URL="${VITE_API_BASE_URL:-${VITE_API_URL}}"

echo "API_URL: ${API_URL}"

if [ -z "$API_URL" ]; then
  echo "WARNING: No API URL configured! Set VITE_API_BASE_URL or VITE_API_URL"
  exit 0
fi

# Replace the config.js file with actual values
printf 'window.ENV = {\n  API_BASE_URL: "%s"\n};\n' "$API_URL" > /usr/share/nginx/html/config.js

echo "Environment variables injected successfully!"
echo "Config file created with API_BASE_URL: ${API_URL}"
