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
        // Use localhost for local development (backend runs on host)
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Enable WebSocket proxying for /api paths (e.g., /api/v1/prices/ws)
        ws: true,
        // Rewrite WebSocket Origin header for proper handshake
        rewriteWsOrigin: true,
      },
    },
  },
})
