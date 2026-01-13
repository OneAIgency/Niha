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
        // Use Docker service name for container-to-container communication
        target: 'http://backend:8000',
        changeOrigin: true,
        // Enable WebSocket proxying for /api paths (e.g., /api/v1/prices/ws)
        ws: true,
      },
    },
  },
})
