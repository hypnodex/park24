import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { BoxDetail } from './App.tsx'
import Admin from './Admin.tsx'
import { usePath } from './router.ts'

/**
 * Minimal pathname router. Routes:
 *   /          → public marketing site (App)
 *   /box/:id   → single box detail page (BoxDetail)
 *   /admin     → password-gated admin (Admin)
 *
 * Pure SPA: no server needed beyond Vite history-fallback + vercel.json rewrites.
 */
function Root() {
  const path = usePath()

  if (path.startsWith('/admin')) return <Admin />
  const box = path.match(/^\/box\/([^/]+)\/?$/)
  if (box) return <BoxDetail id={decodeURIComponent(box[1])} />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
