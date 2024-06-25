import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sws/view': 'http://localhost:8092'
    }
  },
  build: {
    outDir: '../../src/main/resources/static',
    rollupOptions: {
      external: ['@mui/material']
    }
  }
})
