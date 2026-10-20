import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// StrictMode is intentionally omitted: double-mounting the WebGL canvas in dev
// would double-generate procedural textures for no benefit.
const rootEl = document.getElementById('root')
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />)
}
