import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const KV_KEY = 'park24:inquiries'

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
    if (!checkAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!redis) return res.json([])
    try {
      const data = await redis.get(KV_KEY)
      return res.json(data || [])
    } catch {
      return res.json([])
    }
  }

  if (req.method === 'POST') {
    const { box, name, phone, email, note } = req.body || {}

    if (!name || (!phone && !email)) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const inquiry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      box: box || '',
      name,
      phone: phone || '',
      email: email || '',
      note: note || '',
      at: new Date().toISOString(),
    }

    if (redis) {
      const existing = (await redis.get<unknown[]>(KV_KEY)) || []
      existing.push(inquiry)
      await redis.set(KV_KEY, JSON.stringify(existing))
    }

    return res.json({ ok: true, inquiry })
  }

  if (req.method === 'DELETE') {
    if (!checkAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.body || {}
    if (!id) {
      return res.status(400).json({ error: 'Missing inquiry id' })
    }

    if (redis) {
      const existing = (await redis.get<Record<string, unknown>[]>(KV_KEY)) || []
      const filtered = existing.filter((i) => i.id !== id)
      await redis.set(KV_KEY, JSON.stringify(filtered))
    }

    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
