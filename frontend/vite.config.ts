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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - changes rarely
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Animation library - large, stable
          'framer-vendor': ['framer-motion'],
          // Icons - many small modules
          'icons-vendor': ['lucide-react'],
          // State management + HTTP client
          'state-vendor': ['zustand', 'axios'],
          // Utilities
          'utils-vendor': ['clsx', 'tailwind-merge', 'dompurify'],
        },
      },
    },
    // Increase chunk size warning limit slightly (vendor chunks may exceed 500KB)
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', 'platonos.mooo.com'],
    proxy: {
      '/api': {
        // Use Docker service name - frontend runs in Docker alongside backend
        target: 'http://backend:8000',
        changeOrigin: true,
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
      ],
    },
  },
})
