export type Status = 'volny' | 'rezervovano' | 'prodano'

export interface Box {
  id: string
  status: Status
  area: number
  price: number
}

export const STATUS_LABEL: Record<Status, string> = {
  volny: 'Volný',
  rezervovano: 'Rezervovaný',
  prodano: 'Prodaný',
}

/* ─── Admin auth (password validated server-side) ───────────────────── */
const SESSION_KEY = 'park24.admin.session.v1'

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(SESSION_KEY)
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (res.ok) {
    localStorage.setItem(SESSION_KEY, password)
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

function getAuthHeader(): Record<string, string> {
  const pw = localStorage.getItem(SESSION_KEY)
  return pw ? { Authorization: `Bearer ${pw}` } : {}
}

/* ─── Box data (API-backed) ─────────────────────────────────────────── */
export const DEFAULT_BOXES: Box[] = [
  { id: 'P3',  status: 'volny',       area: 305, price: 20000000 },
  { id: 'P4',  status: 'rezervovano', area: 305, price: 20000000 },
  { id: 'P5',  status: 'prodano',     area: 305, price: 20000000 },
  { id: 'P6',  status: 'volny',       area: 305, price: 20000000 },
  { id: 'P7',  status: 'volny',       area: 305, price: 20000000 },
  { id: 'P8',  status: 'volny',       area: 305, price: 20000000 },
  { id: 'P9',  status: 'volny',       area: 305, price: 20000000 },
  { id: 'P10', status: 'volny',       area: 305, price: 20000000 },
  { id: 'P11', status: 'volny',       area: 305, price: 20000000 },
  { id: 'P12', status: 'volny',       area: 305, price: 20000000 },
  { id: 'P13', status: 'volny',       area: 305, price: 20000000 },
  { id: 'P14', status: 'volny',       area: 305, price: 20000000 },
]

export async function fetchBoxes(): Promise<Box[]> {
  try {
    const res = await fetch('/api/boxes')
    if (res.ok) return await res.json()
  } catch { /* fall through */ }
  return DEFAULT_BOXES
}

export async function saveBoxes(boxes: Box[]): Promise<boolean> {
  const res = await fetch('/api/boxes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ boxes }),
  })
  return res.ok
}

export async function resetBoxes(): Promise<Box[]> {
  const res = await fetch('/api/boxes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ reset: true }),
  })
  if (res.ok) return await res.json()
  return DEFAULT_BOXES
}

/* ─── React hook ─────────────────────────────────────────────────────── */
import { useCallback, useEffect, useState } from 'react'

export function useBoxes() {
  const [boxes, setBoxesLocal] = useState<Box[]>(DEFAULT_BOXES)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchBoxes()
    setBoxesLocal(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = useCallback(async (next: Box[]): Promise<boolean> => {
    const ok = await saveBoxes(next)
    if (ok) setBoxesLocal(next)
    return ok
  }, [])

  return { boxes, loading, update, refresh }
}

/* ─── Inquiries (API-backed) ─────────────────────────────────────────── */
export interface Inquiry {
  id: string
  box: string
  name: string
  phone: string
  email: string
  note: string
  at: string
}

export async function submitInquiry(data: {
  box: string; name: string; phone: string; email: string; note: string
}): Promise<boolean> {
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch { return false }
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  try {
    const res = await fetch('/api/inquiries', {
      headers: getAuthHeader(),
    })
    if (res.ok) return await res.json()
  } catch { /* fall through */ }
  return []
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const res = await fetch('/api/inquiries', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ id }),
  })
  return res.ok
}

export function useInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchInquiries()
    setInquiries(data)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteInquiry(id)
    if (ok) setInquiries((prev) => prev.filter((i) => i.id !== id))
    return ok
  }, [])

  return { inquiries, loading, refresh, remove }
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
export function formatCzk(n: number): string {
  return n.toLocaleString('cs-CZ') + ' Kč'
}
