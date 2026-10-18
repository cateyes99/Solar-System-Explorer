import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// WebGL-heavy app: keep the build target modern, and give the Three.js bundle room.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
  },
})