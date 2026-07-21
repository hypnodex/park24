import { BOX_MAP_IMAGE, BOX_POLYGONS } from './boxMapPolygons'
import { STATUS_LABEL, formatCzk, type Box } from './store'

/**
 * Generates a one-page A4 PDF "box card" and triggers a download.
 *
 * The whole card is drawn onto a canvas (Czech diacritics render correctly via
 * the system font — jsPDF's built-in fonts can't encode č/ř/ž…), then placed as
 * a single full-page image. Not selectable text, but pixel-perfect and reliable.
 */
export async function generateBoxPdf(box: Box): Promise<void> {
  const scale = 2
  const W = 1240 * scale
  const H = 1754 * scale // A4 portrait ratio
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  drawCard(ctx, box)
  await drawBanner(ctx, box) // async: waits for the aerial image

  const img = canvas.toDataURL('image/jpeg', 0.92)
  const { jsPDF } = await import('jspdf') // lazy: keeps jsPDF out of the initial bundle
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  pdf.addImage(img, 'JPEG', 0, 0, 210, 297)
  pdf.save(`Park24-Box-${box.id}.pdf`)
}

const ACCENT = '#16a34a'
const INK = '#0f1720'
const MUTED = '#6b7789'
const LINE = '#e3e8ef'
const STATUS_COLOR: Record<string, string> = {
  volny: '#16a34a',
  rezervovano: '#d97706',
  prodano: '#dc2626',
}

/** Static text layer (everything except the aerial banner). W=1240, H=1754 in unscaled px. */
function drawCard(ctx: CanvasRenderingContext2D, box: Box) {
  const W = 1240
  const M = 80

  // background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, 1754)

  // top wordmark
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK
  ctx.font = '800 40px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('PARK', M, 92)
  ctx.fillStyle = ACCENT
  ctx.fillText('24', M + ctx.measureText('PARK').width, 92)
  ctx.fillStyle = MUTED
  ctx.font = '600 20px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('KARTA BOXU', W - M, 88)

  // (banner is drawn later, occupies y≈120..560)
  const afterBanner = 620

  // title + status
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '800 66px system-ui, sans-serif'
  ctx.fillText(`Box ${box.id}`, M, afterBanner + 40)

  const label = STATUS_LABEL[box.status]
  ctx.font = '700 24px system-ui, sans-serif'
  const pw = ctx.measureText(label).width + 56
  const px = M
  const py = afterBanner + 74
  roundRect(ctx, px, py, pw, 46, 23)
  ctx.fillStyle = STATUS_COLOR[box.status]
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, px + 28, py + 31)

  // specs table
  const rows: [string, string][] = [
    ['Celková plocha', `${box.area} m²`],
    ['Cena', formatCzk(box.price)],
    ['Cena za m²', formatCzk(Math.round(box.price / box.area))],
    ['Dispozice', 'Dvoupodlažní — showroom + administrativa'],
    ['Výbava', 'Rekuperace a TČ · Klimatizace'],
    ['', 'Venkovní žaluzie · Zabezpečení'],
  ]
  let y = afterBanner + 170
  const rowH = 74
  for (const [k, v] of rows) {
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(M, y)
    ctx.lineTo(W - M, y)
    ctx.stroke()
    if (k) {
      ctx.fillStyle = MUTED
      ctx.font = '500 24px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(k, M, y + 47)
    }
    ctx.fillStyle = INK
    ctx.font = '600 26px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(v, W - M, y + 47)
    y += rowH
  }
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(M, y)
  ctx.lineTo(W - M, y)
  ctx.stroke()

  // contact block
  const cy = 1500
  ctx.fillStyle = '#f4f7fb'
  roundRect(ctx, M, cy, W - 2 * M, 150, 18)
  ctx.fill()
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '700 24px system-ui, sans-serif'
  ctx.fillText('Kontakt pro rezervaci', M + 34, cy + 46)
  ctx.fillStyle = MUTED
  ctx.font = '500 22px system-ui, sans-serif'
  ctx.fillText('Ing. Ondřej Menšík · Esprit living s.r.o.', M + 34, cy + 84)
  ctx.fillText('+420 737 889 777 · mensik@stemfire.cz', M + 34, cy + 118)

  // footer
  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED
  ctx.font = '500 20px system-ui, sans-serif'
  ctx.fillText('park24.vercel.app', W / 2, 1712)
}

/** Aerial banner with this box's polygon highlighted, cropped to focus the box. */
async function drawBanner(ctx: CanvasRenderingContext2D, box: Box) {
  const M = 80
  const W = 1240
  const bx = M, by = 120, bw = W - 2 * M, bh = 440
  const A = bw / bh

  const img = await loadImage(BOX_MAP_IMAGE.src).catch(() => null)

  // rounded clip for the banner
  ctx.save()
  roundRect(ctx, bx, by, bw, bh, 18)
  ctx.clip()
  ctx.fillStyle = '#dfe5ec'
  ctx.fillRect(bx, by, bw, bh)

  const poly = BOX_POLYGONS.find((p) => p.id === box.id)

  if (img) {
    const s = img.naturalWidth / BOX_MAP_IMAGE.width // polygon-space → image px
    let pts: { x: number; y: number }[] = []
    if (poly) {
      pts = poly.points.trim().split(/\s+/).map((pair) => {
        const [x, y] = pair.split(',').map(Number)
        return { x: x * s, y: y * s }
      })
    }
    // crop rectangle (image px) around the polygon bbox, matched to banner aspect
    let cropX = 0, cropY = 0, cropW = img.naturalWidth, cropH = img.naturalHeight
    if (pts.length) {
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const padX = (maxX - minX) * 0.9 + 60
      const padY = (maxY - minY) * 0.9 + 60
      let cw = maxX - minX + 2 * padX
      let ch = maxY - minY + 2 * padY
      if (cw / ch < A) cw = ch * A
      else ch = cw / A
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      cropW = Math.min(cw, img.naturalWidth)
      cropH = Math.min(ch, img.naturalHeight)
      cropX = Math.max(0, Math.min(cx - cropW / 2, img.naturalWidth - cropW))
      cropY = Math.max(0, Math.min(cy - cropH / 2, img.naturalHeight - cropH))
    }
    ctx.drawImage(img, cropX, cropY, cropW, cropH, bx, by, bw, bh)

    // highlight polygon
    if (pts.length) {
      const kx = bw / cropW, ky = bh / cropH
      ctx.beginPath()
      pts.forEach((p, i) => {
        const X = bx + (p.x - cropX) * kx
        const Y = by + (p.y - cropY) * ky
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(22,163,74,0.28)'
      ctx.fill()
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 4
      ctx.stroke()
    }
  }
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = src
  })
}
