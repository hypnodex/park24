import { StrictMode, useEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { BoxDetail, ConstructionPage } from './App.tsx'
import Admin from './Admin.tsx'
import { navigate, usePath } from './router.ts'

/**
 * Minimal pathname router. Routes:
 *   /          → public marketing site (App)
 *   /homepage2 → test copy of the homepage for trying out design variants
 *   /homepage2/box/:id → box detail inside that test copy
 *   /prubeh-vystavby → construction progress photo galleries (ConstructionPage)
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

  // /box/:id on the real site, /homepage2/box/:id inside the test copy
  const box = path.match(/^(\/homepage2)?\/box\/([^/]+)\/?$/)
  const base = box?.[1] ?? ''
  const rawId = box ? decodeURIComponent(box[2]) : null
  const boxId = rawId === null ? null : currentBoxId(rawId)

  useEffect(() => {
    if (rawId !== null && boxId !== null && boxId !== rawId) navigate(`${base}/box/${boxId}`)
  }, [rawId, boxId, base])

  let page: ReactNode
  let key: string
  if (path.startsWith('/admin')) {
    page = <Admin />
    key = 'admin'
  } else if (/^\/prubeh-vystavby\/?$/.test(path)) {
    page = <ConstructionPage />
    key = 'construction'
  } else if (/^\/homepage2\/?$/.test(path)) {
    page = <App base="/homepage2" />
    key = 'homepage2'
  } else if (boxId !== null) {
    page = <BoxDetail id={boxId} base={base} />
    key = `box:${base}:${boxId}`
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
