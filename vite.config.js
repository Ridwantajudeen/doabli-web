import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  tailwindcss(),],
  server: {
    proxy: {
      '/api/escrow': 'http://localhost:5000',
      '/api/pay': 'http://localhost:5000',
      '/api/review': 'http://localhost:5000',
    },
  },
})
