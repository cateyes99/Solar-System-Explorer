import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2022',
    // Three.js is by far the heaviest dependency; splitting it out keeps the
    // app shell cacheable across deploys.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three') || id.includes('node_modules/three-stdlib')) {
            return 'three'
          }
          if (
            id.includes('@react-three') ||
            id.includes('node_modules/postprocessing') ||
            id.includes('node_modules/troika')
          ) {
            return 'r3f'
          }
          return undefined
        },
      },
    },
  },
})