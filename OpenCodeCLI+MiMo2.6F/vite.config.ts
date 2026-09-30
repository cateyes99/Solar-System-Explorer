import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three/')) return 'three'
          if (
            id.includes('node_modules/@react-three/') ||
            id.includes('node_modules/three-stdlib/') ||
            id.includes('node_modules/postprocessing/')
          ) {
            return 'r3f'
          }
          if (id.includes('node_modules/framer-motion/')) return 'motion'
          return undefined
        },
      },
    },
  },
})
