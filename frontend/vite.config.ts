import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'School Management System',
        short_name: 'SMS',
        description: 'School Management System - Optimized for Nepal Education System',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache all static assets during build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
        
        // Maximum cache size
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        
        // Runtime caching strategies
        runtimeCaching: [
          // API endpoints - NetworkFirst for fresh data with offline fallback
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/(students|staff|classes|subjects|timetable).*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-core-data',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          
          // Attendance API - CacheFirst for offline marking, sync later
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/attendance.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-attendance',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 3 // 3 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          
          // Grades and exams - NetworkFirst with longer cache
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/(exams|grades).*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-exams-grades',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          
          // Static reference data - CacheFirst for better performance
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/(academic\/years|academic\/terms|calendar).*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-reference-data',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // User profile and auth - NetworkFirst with short cache
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/(auth\/me|profile).*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-user-data',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          
          // Images and avatars - CacheFirst with long expiration
          {
            urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Fonts - CacheFirst with very long expiration
          {
            urlPattern: /^https?:\/\/.*\.(woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // Google Fonts - StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        
        // Clean up old caches
        cleanupOutdatedCaches: true,
        
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true
      },
      
      // Development options
      devOptions: {
        enabled: false, // Disable in dev for easier debugging
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux']
        }
      }
    }
  }
});
