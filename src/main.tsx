import { StrictMode, type ReactNode } from 'react'
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

  const box = path.match(/^\/box\/([^/]+)\/?$/)
  let page: ReactNode
  let key: string
  if (path.startsWith('/admin')) {
    page = <Admin />
    key = 'admin'
  } else if (box) {
    page = <BoxDetail id={decodeURIComponent(box[1])} />
    key = `box:${box[1]}`
  } else {
    page = <App />
    key = 'home'
  }

  // Fade-in on every page change (keyed wrapper remounts → animation replays).
  return (
    <div className="route-fade" key={key}>
      {page}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
