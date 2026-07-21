import { useEffect, useState } from 'react'

/**
 * Tiny pathname router shared by main.tsx and the app.
 * SPA navigation without a library: pushState + a synthetic popstate so the
 * single <Root> listener re-renders. Vercel rewrites (vercel.json) + Vite
 * history-fallback serve index.html for every non-/api path, so deep links
 * like /box/P1 work on hard refresh too.
 */
export function navigate(to: string) {
  if (to === window.location.pathname + window.location.hash) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

/** Reactive current pathname. */
export function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}
