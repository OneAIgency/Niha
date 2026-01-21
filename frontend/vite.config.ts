import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        // Use 'backend' service name for Docker networking
        // For local development outside Docker, change to 'http://localhost:8000'
        target: 'http://backend:8000',
        changeOrigin: true,
        // Enable WebSocket proxying for /api paths (e.g., /api/v1/prices/ws)
        ws: true,
        // Rewrite WebSocket Origin header for proper handshake
        rewriteWsOrigin: true,
      },
    },
  },
})
