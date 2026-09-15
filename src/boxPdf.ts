import { formatCzk, type Box } from './store'
import { boxRooms, boxPlans, boxTotalArea, boxComputedPrice, boxParking, type Room } from './boxRooms'

/**
 * Generates the one-page A4 landscape "box card" PDF and opens it in a new tab.
 *
 * Layout follows the Figma frame "A4 - 1" (node 223:3618), designed at
 * 1689×1194 — exactly A4 landscape. Left sidebar carries the logo, price and
 * both room legends over a navy contact block; the right side shows the two
 * floor plans and a photo strip.
 *
 * The card is painted onto a canvas and placed as a single full-page image:
 * jsPDF's built-in fonts can't encode Czech diacritics (č/ř/ž…), the system
 * font can. Not selectable text, but reliable and pixel-accurate.
 */
export async function generateBoxPdf(box: Box): Promise<void> {
  // Opened synchronously, while the click is still the "user gesture", so the
  // popup blocker lets it through — everything below this line is async.
  const win = window.open('', '_blank')
  if (win) win.document.write(LOADING_HTML)

  try {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = W * scale
    canvas.height = H * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)

    await ensureFonts()

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    await drawSidebar(ctx, box)
    await drawPlans(ctx, box)
    await drawPhotos(ctx)

    const img = canvas.toDataURL('image/jpeg', 0.92)
    const { jsPDF } = await import('jspdf') // lazy: keeps jsPDF out of the initial bundle
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
    pdf.addImage(img, 'JPEG', 0, 0, 297, 210)
    // Viewers show the document title in the tab, which a blob URL can't carry.
    pdf.setProperties({ title: `Park24 — Box ${box.id}`, subject: `Karta boxu ${box.id}` })

    // Free the previous card before minting a new one; the current blob has to
    // stay alive for as long as its tab is open, so it is not revoked here.
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl)
    lastBlobUrl = URL.createObjectURL(pdf.output('blob'))

    if (win) {
      win.location.href = lastBlobUrl
      return
    }
    // The pre-opened tab was blocked. Trying again outside a gesture usually
    // fails too, so fall back to saving the file rather than doing nothing.
    if (!window.open(lastBlobUrl, '_blank', 'noopener')) {
      const a = document.createElement('a')
      a.href = lastBlobUrl
      a.download = `Park24-Box-${box.id}.pdf`
      a.click()
    }
  } catch (err) {
    win?.close() // don't strand the tab on the loading placeholder
    throw err
  }
}

let lastBlobUrl: string | null = null

/** Placeholder shown in the new tab while the card is being drawn. */
const LOADING_HTML =
  '<!doctype html><meta charset="utf-8"><title>Park24 — karta boxu</title>' +
  '<body style="margin:0;display:grid;place-items:center;height:100vh;' +
  'font:500 15px Roboto,system-ui,sans-serif;color:#1f2b5e;background:#f2f3f6">' +
  'Připravuji kartu boxu…</body>'

/* ─── Design tokens (Figma frame 223:3618) ──────────────────────────────── */
const W = 1689
const H = 1194
const NAVY = '#1f2b5e'
const NAVY_60 = 'rgba(31, 43, 94, 0.6)'
const NAVY_72 = 'rgba(31, 43, 94, 0.72)'
const ROW_LINE = 'rgba(31, 43, 94, 0.08)'
const SIDEBAR_BG = '#f2f3f6'

const SIDEBAR_W = 504
const PAD = 43
const CARD_W = 421

const DISPLAY = "'Inter', system-ui, -apple-system, sans-serif"
const BODY = "'Roboto', system-ui, -apple-system, sans-serif"

/** Table row height. The design uses 28, but its 2. NP table is a copy of the
 *  1. NP one; the real 2. NP legend has 8 rows, which at 28px would run into
 *  the contact block. 25 keeps both tables identical and inside the sidebar. */
const ROW = 25

const fmtArea = (n: number) =>
  n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Waits for the webfonts so the canvas doesn't fall back to a system face. */
async function ensureFonts(): Promise<void> {
  if (!('fonts' in document)) return
  try {
    await Promise.all([
      document.fonts.load(`700 34px ${DISPLAY}`),
      document.fonts.load(`400 15px ${BODY}`),
      document.fonts.load(`500 12px ${BODY}`),
      document.fonts.load(`700 20px ${BODY}`),
    ])
    await document.fonts.ready
  } catch {
    /* fall back to whatever is available */
  }
}

/* ─── Left sidebar ──────────────────────────────────────────────────────── */
async function drawSidebar(ctx: CanvasRenderingContext2D, box: Box) {
  ctx.fillStyle = SIDEBAR_BG
  ctx.fillRect(0, 0, SIDEBAR_W, H)

  // wordmark
  const logo = await loadImage('/assets/logo_park24.svg').catch(() => null)
  if (logo) ctx.drawImage(logo, PAD, 45, 266, 83)

  // price card
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, PAD, 175, CARD_W, 110, 16)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = NAVY
  ctx.font = `700 34px ${DISPLAY}`
  ctx.fillText(formatCzk(boxComputedPrice(box.id) ?? box.price), PAD + 24, 199)

  const area = boxTotalArea(box.id) ?? box.area
  ctx.fillStyle = NAVY_72
  ctx.font = `400 15px ${BODY}`
  ctx.fillText(
    `${area.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} m² · ${boxParking(box.id)}× parkování`,
    PAD + 24,
    243,
  )

  // both room legends, stacked; the second one starts below whatever the first
  // one actually needs, so a longer 2. NP table can't collide with it
  const rooms = boxRooms(box.id)
  let y = 333.5
  y = drawLegendBlock(ctx, '1. NP', rooms?.np1 ?? [], y)
  drawLegendBlock(ctx, '2. NP', rooms?.np2 ?? [], y + 42)

  await drawContact(ctx)
}

/** Floor label + room table. Returns the y where the block ends. */
function drawLegendBlock(ctx: CanvasRenderingContext2D, label: string, rooms: Room[], y: number): number {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = NAVY
  ctx.font = `700 20px ${BODY}`
  ctx.fillText(label, PAD, y + 4)

  const tableY = y + 35.5
  const x = PAD
  const w = CARD_W
  const codeW = 85
  const nameX = x + codeW + 14
  const valX = x + w - 24

  const cell = (text: string, cx: number, cy: number, align: CanvasTextAlign) => {
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.fillText(text, cx, cy + ROW / 2)
  }

  // head — no fill in the design, just the type
  ctx.fillStyle = NAVY_60
  ctx.font = `600 12px ${BODY}`
  cell('č.', x + 24, tableY, 'left')
  cell('Místnost', nameX, tableY, 'left')
  cell('Plocha [m²]', valX, tableY, 'right')

  let ry = tableY + ROW
  const line = (ly: number) => {
    ctx.strokeStyle = ROW_LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, ly + 0.5)
    ctx.lineTo(x + w, ly + 0.5)
    ctx.stroke()
  }

  for (const r of rooms) {
    line(ry)
    ctx.font = `400 12px ${BODY}`
    ctx.fillStyle = NAVY_60
    cell(r.code, x + 24, ry, 'left')
    ctx.fillStyle = NAVY
    cell(r.name, nameX, ry, 'left')
    cell(r.area != null ? fmtArea(r.area) : '—', valX, ry, 'right')
    ry += ROW
  }

  const complete = rooms.length > 0 && rooms.every((r) => r.area != null)
  if (complete) {
    line(ry)
    const total = rooms.reduce((s, r) => s + (r.area ?? 0), 0)
    ctx.font = `700 12px ${BODY}`
    ctx.fillStyle = NAVY
    cell('Celkem', x + 24, ry, 'left')
    cell(fmtArea(total), valX, ry, 'right')
    ry += ROW
  }

  return ry
}

/** Navy contact block pinned to the bottom of the sidebar. */
async function drawContact(ctx: CanvasRenderingContext2D) {
  const top = 941
  ctx.fillStyle = NAVY
  ctx.fillRect(0, top, SIDEBAR_W, H - top)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 20px ${BODY}`
  ctx.fillText('Kontakt pro rezervaci', PAD, top + 39)

  ctx.font = `400 13.7px ${BODY}`
  ctx.fillText('Ing. Ondřej Menšík', PAD + 1, top + 92)
  ctx.fillText('Esprit Living s.r.o.', PAD + 1, top + 110)

  ctx.font = `700 15.9px ${BODY}`
  ctx.fillText('T.', PAD + 1, top + 141)
  ctx.fillText('+420 737 889 777', PAD + 27, top + 141)
  ctx.fillText('E.', PAD + 1, top + 160)
  ctx.fillText('mensik@stemfire.cz', PAD + 27, top + 160)

  const avatar = await loadImage('/assets/avatar.png').catch(() => null)
  if (avatar) {
    const size = 64
    const ax = 394
    const ay = top + 87
    ctx.save()
    ctx.beginPath()
    ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    drawCover(ctx, avatar, ax, ay, size, size)
    ctx.restore()
  }
}

/* ─── Right side: floor plans ───────────────────────────────────────────── */
async function drawPlans(ctx: CanvasRenderingContext2D, box: Box) {
  const plans = boxPlans(box.id)
  // Slots are anchored top-left like the design; each drawing keeps its own
  // aspect ratio, which differs between the standard, B1 and B2 layouts.
  await drawPlan(ctx, '1. NP', plans.np1, 617, 58, 934, 340)
  await drawPlan(ctx, '2. NP', plans.np2, 617, 498, 934, 302)
}

async function drawPlan(
  ctx: CanvasRenderingContext2D,
  label: string,
  src: string,
  x: number,
  tabY: number,
  slotW: number,
  slotH: number,
) {
  // floor pill
  ctx.font = `600 14px ${BODY}`
  const tw = 80
  const th = 31
  roundRect(ctx, x, tabY, tw, th, th / 2)
  ctx.fillStyle = NAVY
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + tw / 2, tabY + th / 2 + 1)

  const plan = await loadImage(src).catch(() => null)
  if (!plan) return
  const a = plan.naturalWidth / plan.naturalHeight
  let dw = slotW
  let dh = slotW / a
  if (dh > slotH) {
    dh = slotH
    dw = slotH * a
  }
  ctx.drawImage(plan, x, tabY + 52, dw, dh)
}

/* ─── Right side: photo strip ───────────────────────────────────────────── */
async function drawPhotos(ctx: CanvasRenderingContext2D) {
  const srcs = ['/assets/gallery/g1.jpg', '/assets/gallery/g2.jpg', '/assets/gallery/g5.jpg']
  const x0 = 620
  const y = 927
  const total = 961
  const gap = 18
  const w = (total - gap * (srcs.length - 1)) / srcs.length
  const h = 193

  for (let i = 0; i < srcs.length; i++) {
    const img = await loadImage(srcs[i]).catch(() => null)
    const x = x0 + i * (w + gap)
    ctx.save()
    roundRect(ctx, x, y, w, h, 16)
    ctx.clip()
    ctx.fillStyle = '#e3e8ef'
    ctx.fillRect(x, y, w, h)
    if (img) drawCover(ctx, img, x, y, w, h)
    ctx.restore()
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
/** Fills the box, cropping the overflow — the canvas equivalent of object-fit: cover. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
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
