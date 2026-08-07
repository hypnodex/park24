import { BOX_MAP_IMAGE, BOX_POLYGONS } from './boxMapPolygons'
import { STATUS_LABEL, formatCzk, type Box } from './store'
import { boxRooms, boxPlans, type Room } from './boxRooms'

/**
 * Generates a one-page A4 PDF "box card" and triggers a download.
 *
 * The whole card is drawn onto a canvas (Czech diacritics render correctly via
 * the system font — jsPDF's built-in fonts can't encode č/ř/ž…), then placed as
 * a single full-page image. Not selectable text, but pixel-perfect and reliable.
 *
 * Layout: header → title/specs → 1.NP plan + room legend → 2.NP plan + legend →
 * small location aerial + contact.
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

  drawBase(ctx, box)
  await drawFloor(ctx, '1. NP', boxPlans(box.id).np1, boxRooms(box.id)?.np1 ?? [], 275)
  await drawFloor(ctx, '2. NP', boxPlans(box.id).np2, boxRooms(box.id)?.np2 ?? [], 640)
  await drawLocation(ctx, box, 1010)

  const img = canvas.toDataURL('image/jpeg', 0.92)
  const { jsPDF } = await import('jspdf') // lazy: keeps jsPDF out of the initial bundle
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  pdf.addImage(img, 'JPEG', 0, 0, 210, 297)
  pdf.save(`Park24-Box-${box.id}.pdf`)
}

const ACCENT = '#ff0066' // Park24 brand pink
const NAVY = '#1f2b5e'
const INK = '#0f1720'
const MUTED = '#6b7789'
const LINE = '#e3e8ef'
const STATUS_COLOR: Record<string, string> = {
  volny: '#ff0066',
  rezervovano: '#d97706',
  prodano: '#dc2626',
}
const W = 1240
const M = 80

const fmt = (n: number) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Header, title, specs, contact, footer. */
function drawBase(ctx: CanvasRenderingContext2D, box: Box) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, 1754)

  // wordmark
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '800 40px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Park', M, 88)
  ctx.fillStyle = ACCENT
  ctx.fillText('24', M + ctx.measureText('Park').width, 88)
  ctx.fillStyle = MUTED
  ctx.font = '600 20px system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('KARTA BOXU', W - M, 84)

  // title + status pill
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '800 56px system-ui, sans-serif'
  ctx.fillText(`Box ${box.id}`, M, 172)
  const titleW = ctx.measureText(`Box ${box.id}`).width

  const label = STATUS_LABEL[box.status]
  ctx.font = '700 22px system-ui, sans-serif'
  const pw = ctx.measureText(label).width + 44
  const px = M + titleW + 26
  roundRect(ctx, px, 138, pw, 40, 20)
  ctx.fillStyle = STATUS_COLOR[box.status]
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, px + 22, 165)

  // specs sublines
  const perM2 = formatCzk(Math.round(box.price / box.area))
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '600 24px system-ui, sans-serif'
  ctx.fillText(`${box.area} m²  ·  ${formatCzk(box.price)}  ·  ${perM2}/m²`, M, 214)
  ctx.fillStyle = MUTED
  ctx.font = '500 20px system-ui, sans-serif'
  ctx.fillText('Dvoupodlažní · showroom + administrativa · Energetická třída A · klimatizace', M, 244)

  // contact block (bottom)
  const cy = 1560
  ctx.fillStyle = '#f4f7fb'
  roundRect(ctx, M, cy, W - 2 * M, 120, 16)
  ctx.fill()
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.font = '700 22px system-ui, sans-serif'
  ctx.fillText('Kontakt pro rezervaci', M + 30, cy + 42)
  ctx.fillStyle = MUTED
  ctx.font = '500 20px system-ui, sans-serif'
  ctx.fillText('Ing. Ondřej Menšík · Esprit living s.r.o.', M + 30, cy + 76)
  ctx.textAlign = 'right'
  ctx.fillText('+420 737 889 777 · mensik@stemfire.cz', W - M - 30, cy + 76)

  // footer
  ctx.textAlign = 'center'
  ctx.fillStyle = MUTED
  ctx.font = '500 19px system-ui, sans-serif'
  ctx.fillText('park24.vercel.app', W / 2, 1716)
}

/** One floor: section label + plan drawing (left) + room legend table (right). */
async function drawFloor(
  ctx: CanvasRenderingContext2D,
  title: string,
  planSrc: string,
  rooms: Room[],
  y: number,
) {
  const planW = 560
  const planH = 300
  const gap = 30
  const legendX = M + planW + gap
  const legendW = W - M - legendX

  // section label
  ctx.textAlign = 'left'
  ctx.fillStyle = NAVY
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText(`${title} — půdorys a výměry`, M, y)

  // plan image (transparent — no fill; just a subtle framing border)
  const py = y + 18
  const plan = await loadImage(planSrc).catch(() => null)
  if (plan) {
    drawContain(ctx, plan, M + 16, py + 16, planW - 32, planH - 32)
  }
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  roundRect(ctx, M, py, planW, planH, 14)
  ctx.stroke()

  drawLegend(ctx, rooms, legendX, py, legendW)
}

/** Room legend table (č. / místnost / plocha m²), office row highlighted. */
function drawLegend(ctx: CanvasRenderingContext2D, rooms: Room[], x: number, y: number, w: number) {
  if (!rooms.length) return
  const headH = 30
  const rowH = 27
  const complete = rooms.every((r) => r.area != null)
  const totalH = headH + rooms.length * rowH + (complete ? rowH : 0)

  // header
  ctx.fillStyle = '#f4f7fb'
  ctx.fillRect(x, y, w, headH)
  ctx.fillStyle = MUTED
  ctx.font = '600 15px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('č.', x + 12, y + 20)
  ctx.fillText('Místnost', x + 66, y + 20)
  ctx.textAlign = 'right'
  ctx.fillText('Plocha [m²]', x + w - 12, y + 20)

  let ry = y + headH
  rooms.forEach((r) => {
    const office = r.name === 'Kancelář'
    ctx.textAlign = 'left'
    ctx.fillStyle = MUTED
    ctx.font = '500 15px system-ui, sans-serif'
    ctx.fillText(r.code, x + 12, ry + 19)
    ctx.fillStyle = INK
    ctx.font = `${office ? 700 : 500} 18px system-ui, sans-serif`
    ctx.fillText(r.name, x + 66, ry + 19)
    ctx.textAlign = 'right'
    ctx.fillText(r.area != null ? fmt(r.area) : '—', x + w - 12, ry + 19)
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, ry + rowH)
    ctx.lineTo(x + w, ry + rowH)
    ctx.stroke()
    ry += rowH
  })

  if (complete) {
    const total = rooms.reduce((s, r) => s + (r.area ?? 0), 0)
    ctx.fillStyle = '#eef2f7'
    ctx.fillRect(x, ry, w, rowH)
    ctx.fillStyle = INK
    ctx.font = '700 18px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Celkem', x + 12, ry + 19)
    ctx.textAlign = 'right'
    ctx.fillText(fmt(total), x + w - 12, ry + 19)
  }

  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, totalH)
}

/** Small location aerial with the box highlighted (bottom, left of contact). */
async function drawLocation(ctx: CanvasRenderingContext2D, box: Box, y: number) {
  ctx.textAlign = 'left'
  ctx.fillStyle = NAVY
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText('Poloha v areálu', M, y)

  const bx = M
  const by = y + 18
  const bw = W - 2 * M
  const bh = 300

  const img = await loadImage(BOX_MAP_IMAGE.src).catch(() => null)
  ctx.save()
  roundRect(ctx, bx, by, bw, bh, 14)
  ctx.clip()
  ctx.fillStyle = '#dfe5ec'
  ctx.fillRect(bx, by, bw, bh)

  const poly = BOX_POLYGONS.find((p) => p.id === box.id)
  if (img) {
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const s = iw / BOX_MAP_IMAGE.width // polygon-space → image px
    const pts = poly
      ? poly.points.trim().split(/\s+/).map((pair) => {
          const [px, py] = pair.split(',').map(Number)
          return { x: px * s, y: py * s }
        })
      : []

    // cover-fit (preserve aspect, no distortion), centered on the box
    const cover = Math.max(bw / iw, bh / ih)
    const dw = iw * cover
    const dh = ih * cover
    let fx = iw / 2
    let fy = ih / 2
    if (pts.length) {
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
      fx = (Math.min(...xs) + Math.max(...xs)) / 2
      fy = (Math.min(...ys) + Math.max(...ys)) / 2
    }
    let dx = bx + bw / 2 - fx * cover
    let dy = by + bh / 2 - fy * cover
    dx = Math.min(bx, Math.max(bx + bw - dw, dx)) // clamp so the banner stays covered
    dy = Math.min(by, Math.max(by + bh - dh, dy))
    ctx.drawImage(img, dx, dy, dw, dh)

    if (pts.length) {
      ctx.beginPath()
      pts.forEach((p, i) => {
        const X = dx + p.x * cover
        const Y = dy + p.y * cover
        if (i === 0) ctx.moveTo(X, Y)
        else ctx.lineTo(X, Y)
      })
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,0,102,0.26)'
      ctx.fill()
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 4
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const a = img.naturalWidth / img.naturalHeight
  let dw = w
  let dh = w / a
  if (dh > h) {
    dh = h
    dw = h * a
  }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
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
