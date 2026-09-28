import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('The #root container is missing from index.html')
}

// React replaces the static boot splash inside #root with the real interface.
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)