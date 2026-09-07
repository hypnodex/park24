import { StrictMode, useEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { BoxDetail } from './App.tsx'
import Admin from './Admin.tsx'
import { navigate, usePath } from './router.ts'

/**
 * Minimal pathname router. Routes:
 *   /          → public marketing site (App)
 *   /box/:id   → single box detail page (BoxDetail)
 *   /admin     → password-gated admin (Admin)
 *
 * Pure SPA: no server needed beyond Vite history-fallback + vercel.json rewrites.
 */

/**
 * Boxes were renumbered to match the project drawings: P1–P12 became the long
 * row A1–A12 and P13–P17 the short row B1–B5. Old links keep working instead of
 * landing on "Box nenalezen". Safe to drop once those links are gone.
 */
function currentBoxId(id: string): string {
  const m = /^P(\d{1,2})$/.exec(id)
  if (!m) return id
  const n = Number(m[1])
  if (n < 1 || n > 17) return id
  return n <= 12 ? `A${n}` : `B${n - 12}`
}

function Root() {
  const path = usePath()

  const box = path.match(/^\/box\/([^/]+)\/?$/)
  const rawId = box ? decodeURIComponent(box[1]) : null
  const boxId = rawId === null ? null : currentBoxId(rawId)

  useEffect(() => {
    if (rawId !== null && boxId !== null && boxId !== rawId) navigate(`/box/${boxId}`)
  }, [rawId, boxId])

  let page: ReactNode
  let key: string
  if (path.startsWith('/admin')) {
    page = <Admin />
    key = 'admin'
  } else if (boxId !== null) {
    page = <BoxDetail id={boxId} />
    key = `box:${boxId}`
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
