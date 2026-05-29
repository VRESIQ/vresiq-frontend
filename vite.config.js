import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, /api calls go to Spring Boot on 8081
      // This avoids CORS issues during development
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  }
})
