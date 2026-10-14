import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

/**
 * Stores one box photo in Vercel Blob and returns its public URL. The admin
 * shrinks photos to ≤2000 px JPEG in the browser first, so a request stays far
 * below the 4.5 MB function body limit. The photo only appears on the site once
 * the box is saved (api/box-content.ts).
 */

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

const MAX_BYTES = 3 * 1024 * 1024

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })

  const { id, data } = req.body || {}
  if (typeof id !== 'string' || !BOX_IDS.has(id)) {
    return res.status(400).json({ error: 'Unknown box' })
  }
  if (typeof data !== 'string' || !data) {
    return res.status(400).json({ error: 'Missing image' })
  }

  const bytes = Buffer.from(data, 'base64')
  if (bytes.length > MAX_BYTES) return res.status(413).json({ error: 'Image too large' })
  // JPEG files start with FF D8 FF; the admin always sends JPEG.
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return res.status(400).json({ error: 'Not a JPEG' })
  }

  const blob = await put(`boxes/${id}/foto.jpg`, bytes, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: true,
  })
  return res.json({ url: blob.url })
}
