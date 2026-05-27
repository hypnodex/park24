import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const KV_KEY = 'park24:boxes'

const DEFAULT_BOXES = [
  { id: 'P3',  status: 'volny',       area: 75,  price: 4500 },
  { id: 'P4',  status: 'rezervovano', area: 75,  price: 4500 },
  { id: 'P5',  status: 'prodano',     area: 75,  price: 4500 },
  { id: 'P6',  status: 'volny',       area: 75,  price: 4500 },
  { id: 'P7',  status: 'volny',       area: 75,  price: 4500 },
  { id: 'P8',  status: 'volny',       area: 75,  price: 4500 },
  { id: 'P9',  status: 'volny',       area: 75,  price: 4500 },
  { id: 'P10', status: 'volny',       area: 75,  price: 4500 },
  { id: 'P11', status: 'volny',       area: 75,  price: 4500 },
  { id: 'P12', status: 'volny',       area: 75,  price: 4500 },
  { id: 'P13', status: 'volny',       area: 75,  price: 4500 },
  { id: 'P14', status: 'volny',       area: 75,  price: 4500 },
  { id: 'P15', status: 'volny',       area: 150, price: 8900 },
  { id: 'P16', status: 'volny',       area: 150, price: 8900 },
  { id: 'P17', status: 'volny',       area: 150, price: 8900 },
  { id: 'P18', status: 'volny',       area: 150, price: 8900 },
  { id: 'P19', status: 'volny',       area: 150, price: 8900 },
  { id: 'P20', status: 'volny',       area: 150, price: 8900 },
]

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
      return res.json(boxes || DEFAULT_BOXES)
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

    if (redis) await redis.set(KV_KEY, JSON.stringify(boxes))
    return res.json(boxes)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
