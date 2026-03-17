#!/bin/sh
# inject-env.sh — Runs at container startup (via nginx docker-entrypoint.d)
# Replaces the build-time config.js with runtime environment values.

CONFIG_FILE="/usr/share/nginx/html/config.js"

# Backend API URL - use BACKEND_URL env var if set, otherwise hardcode the Railway backend
BACKEND="${BACKEND_URL:-https://schoolmanagementsystem-production-4bb7.up.railway.app}"
API_URL="${BACKEND}/api/v1"

cat > "$CONFIG_FILE" <<EOF
window.ENV = {
  API_BASE_URL: "$API_URL"
};
EOF

echo "✅ Injected runtime config: API_BASE_URL=$API_URL"
