import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const KV_KEY = 'park24:boxes'

const DEFAULT_BOXES = [
  { id: 'A1',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A2',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A3',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A4',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A5',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A6',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A7',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A8',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A9',  status: 'volny', area: 305, price: 20000000 },
  { id: 'A10', status: 'volny', area: 305, price: 20000000 },
  { id: 'A11', status: 'volny', area: 305, price: 20000000 },
  { id: 'A12', status: 'volny', area: 305, price: 20000000 },
  { id: 'B1',  status: 'volny', area: 305, price: 20000000 },
  { id: 'B2',  status: 'volny', area: 305, price: 20000000 },
  { id: 'B3',  status: 'volny', area: 305, price: 20000000 },
  { id: 'B4',  status: 'volny', area: 305, price: 20000000 },
  { id: 'B5',  status: 'volny', area: 305, price: 20000000 },
]

/**
 * Boxes used to be numbered P1–P17. They now follow the project drawings:
 * the long row is A1–A12 and the short row B1–B5 (so P13 → B1 … P17 → B5).
 * Anything already saved in KV still carries the old ids, so normalise on the
 * way out and on the way in. Safe to drop once no stored record uses P-ids.
 */
function currentId(id: unknown): unknown {
  if (typeof id !== 'string') return id
  const m = /^P(\d{1,2})$/.exec(id)
  if (!m) return id
  const n = Number(m[1])
  return n <= 12 ? `A${n}` : `B${n - 12}`
}

function withCurrentIds(boxes: unknown): unknown {
  if (!Array.isArray(boxes)) return boxes
  return boxes.map((b) =>
    b && typeof b === 'object' ? { ...(b as object), id: currentId((b as { id?: unknown }).id) } : b,
  )
}

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'park24-admin'

function checkAuth(req: VercelRequest): boolean {
  const auth = req.headers.authorization
  if (!auth) return false
  return auth.replace('Bearer ', '') === ADMIN_PASSWORD
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const redis = getRedis()

  if (req.method === 'GET') {
    if (!redis) return res.json(DEFAULT_BOXES)
    try {
      const boxes = await redis.get(KV_KEY)
      return res.json(boxes ? withCurrentIds(boxes) : DEFAULT_BOXES)
    } catch {
      return res.json(DEFAULT_BOXES)
    }
  }

  if (req.method === 'POST') {
    if (!checkAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { boxes, reset } = req.body

    if (reset) {
      if (redis) await redis.del(KV_KEY)
      return res.json(DEFAULT_BOXES)
    }

    if (!Array.isArray(boxes) || boxes.length !== DEFAULT_BOXES.length) {
      return res.status(400).json({ error: 'Invalid boxes data' })
    }

    const normalised = withCurrentIds(boxes)
    if (redis) await redis.set(KV_KEY, JSON.stringify(normalised))
    return res.json(normalised)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
