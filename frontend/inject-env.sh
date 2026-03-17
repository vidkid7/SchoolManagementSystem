#!/bin/sh
# inject-env.sh — Runs at container startup (via nginx docker-entrypoint.d)
# Replaces the build-time config.js with runtime environment values.

CONFIG_FILE="/usr/share/nginx/html/config.js"

# Use VITE_API_BASE_URL if set, otherwise fall back to the internal Railway URL
API_URL="${VITE_API_BASE_URL:-${RAILWAY_PUBLIC_DOMAIN:+https://$RAILWAY_PUBLIC_DOMAIN}/api/v1}"

if [ -z "$API_URL" ]; then
  API_URL="/api/v1"
fi

cat > "$CONFIG_FILE" <<EOF
window.ENV = {
  API_BASE_URL: "$API_URL"
};
EOF

echo "✅ Injected runtime config: API_BASE_URL=$API_URL"
