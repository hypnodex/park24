/* ════════════════════════════════════════════════════════════════════════
   Park24 — localStorage-backed box store

   Used by both the public marketing site (read-only) and the admin
   (read + write at /admin). 12 boxes total.

   Change the admin password by editing ADMIN_PASSWORD below.
   ════════════════════════════════════════════════════════════════════════ */

export type Status = 'volny' | 'rezervovano' | 'prodano'

export interface Box {
  id: string
  status: Status
  area: number   // m²
  price: number  // Kč / měs.
}

export const STATUS_LABEL: Record<Status, string> = {
  volny: 'Volný',
  rezervovano: 'Rezervovaný',
  prodano: 'Prodaný',
}

/* ─── Single-password admin auth ─────────────────────────────────────── */
export const ADMIN_PASSWORD = 'park24-admin'
const AUTH_KEY = 'park24.admin.session.v1'

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'ok'
}
export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'ok')
    return true
  }
  return false
}
export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

/* ─── Box data ───────────────────────────────────────────────────────── */
const STORAGE_KEY = 'park24.boxes.v1'

export const DEFAULT_BOXES: Box[] = [
  { id: 'A01', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A02', status: 'rezervovano', area: 75,  price: 4500 },
  { id: 'A03', status: 'prodano',     area: 75,  price: 4500 },
  { id: 'A04', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A05', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A06', status: 'volny',       area: 150, price: 8900 },
  { id: 'A07', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A08', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A09', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A10', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A11', status: 'volny',       area: 75,  price: 4500 },
  { id: 'A12', status: 'volny',       area: 150, price: 8900 },
]

export function loadBoxes(): Box[] {
  if (typeof window === 'undefined') return DEFAULT_BOXES
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_BOXES
  try {
    const parsed = JSON.parse(raw) as Box[]
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_BOXES.length) {
      return DEFAULT_BOXES
    }
    return parsed
  } catch {
    return DEFAULT_BOXES
  }
}

export function saveBoxes(boxes: Box[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boxes))
  // Notify the same-window listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent('park24:boxes-changed'))
}

export function resetBoxes() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('park24:boxes-changed'))
}

/* ─── React hook ─────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react'

export function useBoxes(): [Box[], (next: Box[]) => void] {
  const [boxes, setBoxes] = useState<Box[]>(() => loadBoxes())

  useEffect(() => {
    const onChange = () => setBoxes(loadBoxes())
    window.addEventListener('park24:boxes-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('park24:boxes-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return [boxes, (next) => { saveBoxes(next); setBoxes(next) }]
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
export function formatCzk(n: number): string {
  return n.toLocaleString('cs-CZ') + ' Kč/měs.'
}
