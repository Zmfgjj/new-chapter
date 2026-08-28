import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://NewChapter.cloud',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://NewChapter.cloud',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'https://NewChapter.cloud',
        ws: true
      }
    }
  }
})
