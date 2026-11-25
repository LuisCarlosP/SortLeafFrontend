import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { canonicalAppPath } from './services/app-path'

const path = canonicalAppPath(window.location.pathname, import.meta.env.BASE_URL)
if (path !== window.location.pathname) {
  window.history.replaceState(window.history.state, '', path + window.location.search + window.location.hash)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
