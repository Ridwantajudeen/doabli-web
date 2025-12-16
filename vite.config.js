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
      '/escrow': 'http://localhost:5000',
      '/pay': 'http://localhost:5000',
      '/review': 'http://localhost:5000',
    },
  },
})
