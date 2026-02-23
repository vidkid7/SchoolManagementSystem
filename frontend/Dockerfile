# Multi-stage build for production optimization

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Accept build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Debug: Print environment variables
RUN echo "=== Build Environment ===" && \
    echo "VITE_API_URL: ${VITE_API_URL}" && \
    echo "========================="

# Create .env.production file with the API URL
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production && \
    cat .env.production

# Build application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
