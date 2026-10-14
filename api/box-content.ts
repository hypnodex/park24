import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { del } from '@vercel/blob'

/**
 * Saves the admin's edits to one box's detail page: description, equipment,
 * photos, fixed price, parking and the room table. Stored in a hash keyed by
 * box id; api/boxes.ts merges it into each box on GET. Fields left out mean
 * "use the project default", so only real edits are stored.
 */

const CONTENT_KEY = 'park24:box-content'
const BOX_IDS = new Set([
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12',
  'B1', 'B2', 'B3', 'B4', 'B5',
])

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'park24-admin'

function checkAuth(req: VercelRequest): boolean {
  const auth = req.headers.authorization
  if (!auth) return false
  return auth.replace('Bearer ', '') === ADMIN_PASSWORD
}

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

// Only photos uploaded through api/upload.ts are accepted.
const BLOB_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/boxes\//i

type Room = { code: string; name: string; sv: string; area: number | null }
type Content = {
  description?: string
  equipment?: string[]
  photos?: { url: string }[]
  price?: number
  parking?: number
  rooms?: { np1: Room[]; np2: Room[] }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function sanitizeRooms(rows: unknown): Room[] {
  if (!Array.isArray(rows)) return []
  return rows.slice(0, 40).map((r) => {
    const o = (r ?? {}) as Record<string, unknown>
    const area = typeof o.area === 'number' && Number.isFinite(o.area) && o.area >= 0
      ? Math.round(o.area * 10) / 10
      : null
    return { code: text(o.code, 12), name: text(o.name, 80), sv: text(o.sv, 20), area }
  })
}

function sanitize(input: unknown): Content {
  const c = (input ?? {}) as Record<string, unknown>
  const out: Content = {}

  const description = text(c.description, 6000)
  if (description) out.description = description

  if (Array.isArray(c.equipment)) {
    const items = c.equipment.map((e) => text(e, 200)).filter(Boolean).slice(0, 30)
    if (items.length) out.equipment = items
  }

  if (Array.isArray(c.photos)) {
    const seen = new Set<string>()
    const photos = c.photos
      .map((p) => text((p as { url?: unknown })?.url, 500))
      .filter((url) => BLOB_URL.test(url) && !seen.has(url) && seen.add(url))
      .slice(0, 40)
      .map((url) => ({ url }))
    if (photos.length) out.photos = photos
  }

  if (typeof c.price === 'number' && Number.isFinite(c.price) && c.price > 0) {
    out.price = Math.round(c.price)
  }
  if (typeof c.parking === 'number' && Number.isInteger(c.parking) && c.parking >= 0 && c.parking <= 50) {
    out.parking = c.parking
  }

  const rooms = c.rooms as { np1?: unknown; np2?: unknown } | undefined
  if (rooms && Array.isArray(rooms.np1) && Array.isArray(rooms.np2)) {
    out.rooms = { np1: sanitizeRooms(rooms.np1), np2: sanitizeRooms(rooms.np2) }
  }

  return out
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })

  const { id, content } = req.body || {}
  if (typeof id !== 'string' || !BOX_IDS.has(id)) {
    return res.status(400).json({ error: 'Unknown box' })
  }

  const redis = getRedis()
  if (!redis) return res.status(503).json({ error: 'Storage not configured' })

  const clean = sanitize(content)
  const previous = await redis.hget<Content>(CONTENT_KEY, id)

  if (Object.keys(clean).length) await redis.hset(CONTENT_KEY, { [id]: clean })
  else await redis.hdel(CONTENT_KEY, id)

  // Photos removed in this save are deleted from storage too.
  const kept = new Set(clean.photos?.map((p) => p.url))
  const removed = (previous?.photos ?? []).map((p) => p.url).filter((u) => !kept.has(u))
  if (removed.length) await del(removed).catch(() => {})

  return res.json({ content: clean })
}
