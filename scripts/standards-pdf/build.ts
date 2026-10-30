/**
 * Builds public/assets/Park24-standardy-boxu.pdf — the box-standards brochure
 * linked from the homepage and every box detail ("Standardy boxu" panel).
 *
 *   npm run pdf:standards
 *
 * Layout follows the Figma draft (Park24 — Smeczka, section 248:805): a photo
 * cover with the frosted Park24 mark, a contents page, then one page per
 * chapter of the spec, in the site's navy / pink / Inter + Roboto language.
 * Pages are A4 landscape and the text stays real, selectable vector text.
 *
 * Rendering runs in headless Chrome. The cover's frosted mark needs
 * backdrop-filter, which print-to-PDF does not keep, so the cover art is
 * screenshotted to an image first and the text is laid over it.
 *
 * Chrome: set CHROME_PATH, otherwise the Playwright-cached Chromium or a
 * regular Google Chrome install is used.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  CONSTRUCTION,
  CONTACT,
  DISPOSITION,
  INTRO,
  LAYOUT,
  PARAMS,
  ROOMS_NP1,
  ROOMS_NP2,
  TECHNICAL,
  UTILITIES,
  type Group,
  type Room,
} from './content.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const HERE = import.meta.dirname
const OUT = join(ROOT, 'public/assets/Park24-standardy-boxu.pdf')
const asset = (p: string) => pathToFileURL(join(ROOT, 'public/assets', p)).href

/* ─── Chrome ─────────────────────────────────────────────────────────────── */
function findChrome(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const pw = join(process.env.HOME ?? '', 'Library/Caches/ms-playwright')
  if (existsSync(pw)) {
    const builds = readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()
    for (const b of builds) {
      const bin = join(
        pw,
        b,
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      )
      if (existsSync(bin)) return bin
    }
  }
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(mac)) return mac
  throw new Error('Chrome not found — set CHROME_PATH.')
}

const chrome = findChrome()
const run = (...args: string[]) =>
  execFileSync(
    chrome,
    ['--headless', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars', ...args],
    { stdio: 'pipe' },
  )

/* ─── Shared bits ────────────────────────────────────────────────────────── */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Czech typography: no one-letter preposition at a line end, units glued to numbers. */
const nb = (s: string) =>
  esc(s)
    .replace(/(^|[\s(])([ksvzouaiKSVZOUAI]) /g, '$1$2&nbsp;')
    .replace(/(\d) (mm|m²|m|kg|A|V|%|×)/g, '$1&nbsp;$2')
    .replace(/(\d)× /g, '$1×&nbsp;')

const FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=block">'

/* The frosted Park24 mark from the Figma cover (node 248:681): drawn upright
   at 754×1195, rotated 90° into a 1195×754 slot at (349, 129) — i.e. about
   the slot's centre (946.5, 506). evenodd keeps the round window clear. */
const MARK_PATH =
  'M266.537 487.216C205.558 426.268 205.558 327.473 266.537 266.525C327.516 205.577 426.361 205.577 487.34 266.525C548.319 327.473 548.319 426.268 487.34 487.216C426.361 548.164 327.516 548.164 266.537 487.216ZM708.266 266.402C769.245 205.454 769.245 106.659 708.266 45.7111C647.287 -15.237 548.442 -15.237 487.463 45.7111C426.484 106.659 327.639 106.659 266.66 45.7111C205.681 -15.237 106.713 -15.237 45.7342 45.7111C-15.2447 106.659 -15.2447 205.454 45.7342 266.402C106.713 327.35 106.713 426.145 45.7342 487.093C-15.2447 548.041 -15.2447 646.836 45.7342 707.784C106.713 768.732 106.713 867.65 45.7342 928.475C-15.2447 989.423 -15.2447 1088.34 45.7342 1149.29C106.713 1210.24 205.558 1210.24 266.537 1149.29C327.516 1088.34 327.516 989.423 266.537 928.475C205.558 867.527 205.558 768.732 266.537 707.784C327.516 646.836 426.361 646.836 487.34 707.784C548.319 768.732 647.164 768.732 708.143 707.784C769.122 646.836 769.122 548.041 708.143 487.093C647.164 426.145 647.164 327.35 708.143 266.402Z'

/** Cover art at the Figma frame's own size (1689×1194 = A4 landscape). The
 *  frost is a blurred copy of the photo clipped to the mark — headless Chrome
 *  doesn't composite backdrop-filter, a plain filter it does. */
const coverHtml = `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; width: 1689px; height: 1194px; overflow: hidden; background: #000; }
  .layer { position: absolute; inset: 0; }
  .photo { position: absolute; left: 0; top: -21px; width: 1728px; height: 1295px;
    background: url('${pathToFileURL(join(HERE, 'cover-photo.png')).href}') center / cover; }
  .shade { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.2); }
  .frost { clip-path: url(#mark); }
  .frost .photo { filter: blur(39.25px); }
  .frost .tint { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.2); }
</style>
<svg width="0" height="0" style="position:absolute"><clipPath id="mark" clipPathUnits="userSpaceOnUse">
  <path clip-rule="evenodd" transform="translate(946.5 506) rotate(90) translate(-377 -597.5)" d="${MARK_PATH}"/>
</clipPath></svg>
<div class="layer"><div class="photo"></div><div class="shade"></div></div>
<div class="layer frost"><div class="photo"></div><div class="shade"></div><div class="tint"></div></div>`

/* ─── Page pieces ────────────────────────────────────────────────────────── */
const TOC = [
  { key: 'A', title: 'Úvod', page: 3 },
  { key: 'B', title: 'Dispoziční členění objektu', page: 3 },
  { key: 'C', title: 'Popis boxu', page: 4 },
  { key: 'D', title: 'Konstrukce a systémy objektu', page: 5 },
  { key: 'E', title: 'Technické vybavení, instalace', page: 6 },
  { key: 'F', title: 'Interiérové provedení místností', page: 7 },
  { key: 'G', title: 'Napojení na inženýrské sítě', page: 8 },
]
const PAGES = 8

const pageChrome = (n: number) => `
  <img class="pg-logo" src="${asset('logo_park24.svg')}" alt="Park24">
  <div class="pg-label">Standardy boxu</div>
  <div class="pg-foot">
    <span>Park 24 Lelekovice — Technická specifikace a standardy boxů</span>
    <span>${String(n).padStart(2, '0')} / ${String(PAGES).padStart(2, '0')}</span>
  </div>`

const head = (key: string, title: string) =>
  `<div class="eyebrow">${key}</div><h2>${nb(title)}</h2>`

const bullets = (items: string[]) =>
  `<ul>${items.map((i) => `<li>${nb(i)}</li>`).join('')}</ul>`

const groupCard = (g: Group, i: number) => `
  <div class="card">
    <div class="card-no">${String(i + 1).padStart(2, '0')}</div>
    <h3>${nb(g.title)}</h3>
    ${bullets(g.items)}
  </div>`

const roomTable = (rows: Room[]) => `
  <table class="rooms">
    <thead><tr><th>č.</th><th>Místnost</th><th>Provedení</th></tr></thead>
    <tbody>${rows
      .map(
        (r) =>
          `<tr><td class="no">${r.no}</td><td class="name">${nb(r.name)}</td><td>${nb(r.finish)}</td></tr>`,
      )
      .join('')}</tbody>
  </table>`

const photo = (src: string, cls = '') =>
  `<div class="photo ${cls}" style="background-image:url('${asset(src)}')"></div>`

/* ─── Pages ──────────────────────────────────────────────────────────────── */
const pages = (coverSrc: string) => [
  // 1 — cover
  `<section class="page cover" style="background-image:url('${coverSrc}')">
    <img class="cover-logo" src="${pathToFileURL(join(HERE, 'logo-white.svg')).href}" alt="Park24">
    <div class="cover-sub">Technická specifikace<br>a standardy boxů</div>
    <h1 class="cover-title">Standardy</h1>
  </section>`,

  // 2 — contents
  `<section class="page">${pageChrome(2)}
    <div class="toc-wrap">
      <div class="toc-left">
        <h1 class="big">Obsah</h1>
        <p class="lead">${nb('Co všechno je v ceně boxu a z čeho je hala postavena — od základů a nosné konstrukce přes technické vybavení až po provedení jednotlivých místností.')}</p>
        ${photo('gallery/g4.jpg', 'toc-photo')}
      </div>
      <ol class="toc">${TOC.map(
        (t) =>
          `<li><span class="toc-key">${t.key}</span><span class="toc-title">${nb(t.title)}</span><span class="toc-page">${String(t.page).padStart(2, '0')}</span></li>`,
      ).join('')}</ol>
    </div>
  </section>`,

  // 3 — A + B
  `<section class="page">${pageChrome(3)}
    <div class="split">
      <div class="col-text">
        ${head('A', 'Úvod')}
        ${INTRO.map((p) => `<p>${nb(p)}</p>`).join('')}
        <div class="gap"></div>
        ${head('B', 'Dispoziční členění objektu')}
        ${LAYOUT.map((p) => `<p>${nb(p)}</p>`).join('')}
      </div>
      <div class="col-media stack">
        ${photo('gallery/g3.jpg', 'grow')}
        ${photo('gallery/g2.jpg', 'grow')}
      </div>
    </div>
  </section>`,

  // 4 — C
  `<section class="page">${pageChrome(4)}
    <div class="body">
      ${head('C', 'Popis boxu')}
      <div class="split c-split">
        <div class="col-text">
          <h4>Dispozice boxu</h4>
          <div class="dispo">${DISPOSITION.map(
            (d) => `<div class="dispo-item"><div class="k">${nb(d.label)}</div><div class="v">${nb(d.value)}</div></div>`,
          ).join('')}</div>
          <div class="params">${PARAMS.map(
            (p) => `<div class="param"><div class="k">${nb(p.label)}</div><div class="v">${nb(p.value)}</div>${p.note ? `<div class="n">${nb(p.note)}</div>` : ''}</div>`,
          ).join('')}</div>
        </div>
        <div class="col-media">
          <div class="drawing"><span class="pill">Řez</span><img src="${asset('drawings/rez.png')}" alt="Řez boxem"></div>
          ${photo('gallery/g10.jpg', 'grow')}
        </div>
      </div>
    </div>
  </section>`,

  // 5 — D
  `<section class="page">${pageChrome(5)}
    <div class="body">
      ${head('D', 'Konstrukce a systémy objektu')}
      <div class="cards cols-3">${CONSTRUCTION.map(groupCard).join('')}</div>
    </div>
  </section>`,

  // 6 — E
  `<section class="page">${pageChrome(6)}
    <div class="body">
      ${head('E', 'Technické vybavení, instalace')}
      <div class="split e-split">
        <div class="cards cols-2">${TECHNICAL.map(groupCard).join('')}</div>
        <div class="col-media stack">
          ${photo('gallery/g7.jpg', 'grow')}
          ${photo('gallery/g6.jpg', 'grow')}
        </div>
      </div>
    </div>
  </section>`,

  // 7 — F
  `<section class="page">${pageChrome(7)}
    <div class="body">
      ${head('F', 'Interiérové provedení místností — standard')}
      <div class="split f-split">
        <div><h4 class="floor">1. NP</h4>${roomTable(ROOMS_NP1)}</div>
        <div class="f-right">
          <h4 class="floor">2. NP</h4>${roomTable(ROOMS_NP2)}
          ${photo('gallery/g5.jpg', 'grow')}
        </div>
      </div>
    </div>
  </section>`,

  // 8 — G + contact
  `<section class="page">${pageChrome(8)}
    <div class="split g-split">
      <div class="col-text">
        ${head('G', 'Napojení na inženýrské sítě')}
        ${bullets(UTILITIES)}
        <p class="fine">${nb('Vizualizace v tomto dokumentu jsou ilustrativní.')}</p>
      </div>
      <div class="col-media">
        ${photo('gallery/g1.jpg', 'grow')}
        <div class="contact">
          <div>
            <div class="contact-h">${CONTACT.heading}</div>
            <div class="contact-p">${CONTACT.name}<br>${CONTACT.company}</div>
            <div class="contact-l"><b>T.</b> ${CONTACT.phone}<br><b>E.</b> ${CONTACT.email}</div>
          </div>
          <img class="avatar" src="${asset('avatar.png')}" alt="">
        </div>
      </div>
    </div>
  </section>`,
]

const CSS = `
  @page { size: 297mm 210mm; margin: 0; }
  :root { --navy: #1f2b5e; --navy-72: rgba(31,43,94,.72); --navy-60: rgba(31,43,94,.6);
    --line: rgba(31,43,94,.08); --pink: #ff0066; --gray: #f2f4f8;
    --display: 'Inter', 'Helvetica Neue', Arial, sans-serif; --body: 'Roboto', system-ui, sans-serif; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { color: var(--navy); font-family: var(--body); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: 297mm; height: 210mm; overflow: hidden; break-after: page; background: #fff; }
  .page:last-child { break-after: auto; }

  /* cover */
  .cover { background-size: cover; background-position: center; color: #fff; }
  .cover-logo { position: absolute; left: 79px; top: 86px; width: 143px; }
  .cover-sub { position: absolute; right: 79px; top: 92px; text-align: right; font-size: 13px;
    line-height: 1.5; color: rgba(255,255,255,.82); letter-spacing: .01em; }
  .cover-title { position: absolute; left: 74px; bottom: 54px; margin: 0; font-family: var(--display);
    font-weight: 600; font-size: 121px; line-height: 1; letter-spacing: -0.025em; }

  /* page chrome */
  .pg-logo { position: absolute; left: 40px; top: 30px; width: 96px; }
  .pg-label { position: absolute; right: 40px; top: 36px; font-size: 10px; color: var(--navy-72); }
  .pg-foot { position: absolute; left: 40px; right: 40px; bottom: 24px; display: flex;
    justify-content: space-between; font-size: 9px; color: var(--navy-60); letter-spacing: .01em; }

  .body { position: absolute; left: 40px; right: 40px; top: 96px; bottom: 56px; display: flex; flex-direction: column; }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; min-height: 0; }
  .page > .split { position: absolute; left: 40px; right: 40px; top: 96px; bottom: 56px; }
  .body > .split { flex: 1; margin-top: 22px; }
  .col-media { display: flex; flex-direction: column; gap: 14px; min-height: 0; }
  .stack .grow, .col-media .grow { flex: 1; }

  .eyebrow { font-weight: 500; font-size: 12px; color: var(--pink); opacity: .7; letter-spacing: .02em; margin-bottom: 6px; }
  h2 { margin: 0; font-family: var(--display); font-weight: 600; font-size: 32px; line-height: 1.08; letter-spacing: -0.01em; }
  h3 { margin: 0 0 8px; font-family: var(--body); font-weight: 700; font-size: 13px; line-height: 1.35; }
  h4 { margin: 0 0 10px; font-family: var(--body); font-weight: 700; font-size: 14px; }
  p { margin: 14px 0 0; font-size: 12px; line-height: 1.62; color: var(--navy-72); }
  .gap { height: 34px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
  li { position: relative; padding-left: 14px; font-size: 10.5px; line-height: 1.5; color: var(--navy-72); }
  li::before { content: ''; position: absolute; left: 2px; top: 6px; width: 4px; height: 4px; border-radius: 50%; background: var(--pink); }

  .photo { border-radius: 12px; background-size: cover; background-position: center; min-height: 0; }

  /* contents */
  .toc-wrap { position: absolute; left: 40px; right: 40px; top: 96px; bottom: 56px; display: grid;
    grid-template-columns: 1fr 1fr; gap: 56px; }
  .toc-left { display: flex; flex-direction: column; }
  .big { margin: 0; font-family: var(--display); font-weight: 700; font-size: 72px; line-height: 1; letter-spacing: -0.02em; }
  .lead { max-width: 380px; margin-top: 18px; font-size: 13px; }
  .toc-photo { flex: 1; margin-top: 28px; }
  .toc { list-style: none; margin: 0; padding: 0; align-self: center; }
  .toc li { display: flex; align-items: baseline; gap: 18px; padding: 15px 4px; font-size: 16px; color: var(--navy);
    border-top: 1px solid var(--line); }
  .toc li:last-child { border-bottom: 1px solid var(--line); }
  .toc li::before { display: none; }
  .toc-key { width: 22px; font-weight: 700; color: var(--pink); }
  .toc-title { flex: 1; font-weight: 500; }
  .toc-page { font-size: 12px; color: var(--navy-60); font-variant-numeric: tabular-nums; }

  /* C */
  .c-split { grid-template-columns: 1.1fr 1fr; }
  .dispo { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .dispo-item { background: var(--gray); border-radius: 12px; padding: 14px 16px; }
  .dispo-item .k { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
  .dispo-item .v { font-size: 11px; line-height: 1.5; color: var(--navy-72); }
  .params { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .param { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
  .param .k { font-size: 10.5px; color: var(--navy-60); }
  .param .v { margin-top: 4px; font-family: var(--display); font-weight: 700; font-size: 22px; letter-spacing: -0.01em; }
  .param .n { margin-top: 2px; font-size: 10px; color: var(--navy-60); }
  .drawing { position: relative; background: var(--gray); border-radius: 12px; padding: 40px 18px 14px; }
  .drawing img { display: block; width: 100%; mix-blend-mode: multiply; }
  .pill { position: absolute; left: 14px; top: 12px; padding: 3px 10px; border-radius: 99px; background: #fff;
    font-size: 10px; font-weight: 500; }

  /* D / E cards */
  .cards { margin-top: 22px; }
  .cols-3 { columns: 3; column-gap: 14px; }
  .cols-2 { margin-top: 0; columns: 2; column-gap: 14px; }
  .card { break-inside: avoid; background: var(--gray); border-radius: 12px; padding: 14px 16px 15px; margin-bottom: 14px; }
  .cols-3 h3 { font-size: 14px; margin-bottom: 10px; }
  .cols-3 li { font-size: 11.5px; }
  .cols-3 li::before { top: 7px; }
  .cols-3 .card { padding: 16px 18px 18px; }
  .card-no { font-size: 10px; font-weight: 500; color: var(--pink); margin-bottom: 4px; }
  .e-split { grid-template-columns: 1.6fr 1fr; }

  /* F tables — the room-legend style of the box card */
  .f-split { grid-template-columns: 1.35fr 1fr; gap: 28px; }
  .f-right { display: flex; flex-direction: column; min-height: 0; }
  .f-right .grow { flex: 1; margin-top: 16px; }
  h4.floor { font-size: 15px; margin-bottom: 6px; }
  .rooms { width: 100%; border-collapse: collapse; font-size: 10.5px; line-height: 1.45; }
  .rooms th { text-align: left; font-weight: 500; font-size: 9.5px; color: var(--navy-60); padding: 6px 8px; }
  .rooms td { padding: 7px 8px; border-top: 1px solid var(--line); vertical-align: top; color: var(--navy-72); }
  .rooms td.no { color: var(--navy-60); width: 38px; }
  .rooms td.name { color: var(--navy); font-weight: 500; width: 96px; }
  .rooms th:first-child, .rooms td:first-child { padding-left: 0; }

  /* G + contact */
  .g-split { grid-template-columns: 1fr 1fr; }
  .g-split ul { margin-top: 20px; gap: 9px; }
  .g-split li { font-size: 12px; }
  .g-split li::before { top: 7px; }
  .fine { margin-top: 26px; font-size: 10px; color: var(--navy-60); }
  .contact { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;
    background: var(--navy); color: #fff; border-radius: 12px; padding: 22px 26px; }
  .contact-h { font-weight: 700; font-size: 15px; margin-bottom: 12px; }
  .contact-p { font-size: 11px; line-height: 1.5; margin-bottom: 10px; }
  .contact-l { font-size: 12px; line-height: 1.6; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
`

/* ─── Build ──────────────────────────────────────────────────────────────── */
const tmp = mkdtempSync(join(tmpdir(), 'park24-standards-'))
try {
  // 1) cover art → PNG (2×), then JPEG to keep the PDF light
  const coverHtmlPath = join(tmp, 'cover.html')
  const coverPng = join(tmp, 'cover.png')
  writeFileSync(coverHtmlPath, coverHtml)
  run('--window-size=1689,1194', '--force-device-scale-factor=2', `--screenshot=${coverPng}`, pathToFileURL(coverHtmlPath).href)
  let coverImg = coverPng
  try {
    const jpg = join(tmp, 'cover.jpg')
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', coverPng, '--out', jpg], { stdio: 'pipe' })
    coverImg = jpg
  } catch {
    /* no sips (not macOS) — the PNG works, just heavier */
  }

  // 2) the document
  const docPath = join(tmp, 'standardy.html')
  writeFileSync(
    docPath,
    `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>Park24 — Standardy boxu</title>${FONTS}<style>${CSS}</style></head><body>${pages(pathToFileURL(coverImg).href).join('')}</body></html>`,
  )
  if (process.argv.includes('--html')) {
    const keep = join(HERE, 'preview.html')
    writeFileSync(keep, `<!doctype html><html lang="cs"><head><meta charset="utf-8">${FONTS}<style>${CSS} body{background:#ccc} .page{margin:20px auto}</style></head><body>${pages(pathToFileURL(coverImg).href).join('')}</body></html>`)
    console.log('preview →', keep)
  }
  run('--no-pdf-header-footer', '--virtual-time-budget=20000', `--print-to-pdf=${OUT}`, pathToFileURL(docPath).href)
  console.log('PDF →', OUT)
} finally {
  if (!process.argv.includes('--html')) rmSync(tmp, { recursive: true, force: true })
}
