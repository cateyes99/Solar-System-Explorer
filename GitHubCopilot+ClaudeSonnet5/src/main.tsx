import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is intentionally omitted. Its dev-only double-invoke of
// effects conflicts with @react-three/drei's <Html> DOM portals (used for
// planet labels), producing spurious "synchronously unmount a root" errors.
// StrictMode has no effect on production builds, so this only affects dev diagnostics.
createRoot(document.getElementById('root')!).render(<App />)
