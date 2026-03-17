#!/bin/sh
# inject-env.sh — Runs at container startup (via nginx docker-entrypoint.d)
# Replaces the build-time config.js with runtime environment values
# and generates nginx API proxy config.

CONFIG_FILE="/usr/share/nginx/html/config.js"
PROXY_CONF="/etc/nginx/api-proxy.conf"

# Determine backend URL
BACKEND="${BACKEND_URL:-https://schoolmanagementsystem-production-4bb7.up.railway.app}"

# API base URL for the frontend - use relative /api/v1 so nginx proxies it
API_URL="${VITE_API_BASE_URL:-/api/v1}"

cat > "$CONFIG_FILE" <<EOF
window.ENV = {
  API_BASE_URL: "$API_URL"
};
EOF

# Generate nginx proxy config for /api/ -> backend
cat > "$PROXY_CONF" <<EOF
location /api/ {
    proxy_pass ${BACKEND}/api/;
    proxy_http_version 1.1;
    proxy_set_header Host \$proxy_host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_connect_timeout 30s;
    proxy_read_timeout 60s;
}
EOF

echo "✅ Injected runtime config: API_BASE_URL=$API_URL, Backend=$BACKEND"
