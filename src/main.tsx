import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Admin from './Admin.tsx'

/**
 * Minimal pathname router. The site has two routes:
 *   /        → public marketing site (App)
 *   /admin   → password-gated admin (Admin)
 *
 * Pure SPA: no server needed beyond Vite's history-fallback (already on).
 */
function Root() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path.startsWith('/admin')) return <Admin />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
