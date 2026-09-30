import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useSimStore } from './store/simulationStore'

// Respect the operating system's reduced-motion preference from the first frame
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

if (prefersReducedMotion) {
  useSimStore.setState({ reducedMotion: true, showLabels: true })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root is missing from index.html')
}

// NOTE: React StrictMode is deliberately not used here. StrictMode double-mounts
// components in development, and @react-three/fiber's Canvas creates and destroys
// its own render root, which triggers React's warning:
// "Attempted to synchronously unmount a root while React was already rendering."
// Safety is still provided by the scene error boundary and effect cleanups.
createRoot(rootElement).render(<App />)
