import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No path aliases are used anywhere in the codebase, so no extra config is needed.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    target: 'es2020',
  },
})
