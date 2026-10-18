import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initializeAppConfig } from './config/appConfig'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('The #root container is missing from index.html')
}

const root = createRoot(container)

/**
 * The configuration file is loaded and applied *before* the first render, so the
 * chosen language and visual settings are in place from the very first frame —
 * no flash of untranslated text and no visual pop-in. `initializeAppConfig`
 * never rejects: a missing or broken file just falls back to the defaults.
 */
void initializeAppConfig().finally(() => {
  // React replaces the static boot splash inside #root with the real interface.
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
