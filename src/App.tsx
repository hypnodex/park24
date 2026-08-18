import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'
import { STATUS_LABEL, formatCzk, submitInquiry, useBoxes, type Box } from './store'
import { BOX_MAP_IMAGE, BOX_POLYGONS } from './boxMapPolygons'
import { boxRooms, boxPlans, boxTotalArea, boxComputedPrice, boxParking, type Room } from './boxRooms'
import { navigate } from './router'
import { generateBoxPdf } from './boxPdf'

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main App                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export default function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Header scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <Intro />
      <CarouselSection />
      <Features />
      <BoxSelection />
      <BoxMap />
      <Gallery />
      <InteractiveMapContact />
      <Ticker />
      <Footer />
    </>
  )
}

/** Navigate to a box's detail page. */
function openBox(id: string) {
  navigate(`/box/${encodeURIComponent(id)}`)
}

/** Public display area/price — real summed area + computed price (parking incl.),
 *  falling back to the stored values if room data is unavailable. */
function displayArea(b: Box): number {
  return boxTotalArea(b.id) ?? b.area
}
function displayPrice(b: Box): number {
  return boxComputedPrice(b.id) ?? b.price
}
const fmtM2 = (n: number) => n.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })

/* ────────────────────────────────────────────────────────────────────────── */
/*  Header (fixed, with menu)                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Header({
  scrolled,
  menuOpen,
  setMenuOpen,
  linkBase = '',
}: {
  scrolled: boolean
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  /** Prefix for nav anchors; '/' on subpages so links jump back to the home sections. */
  linkBase?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [setMenuOpen])

  return (
    <header className={`header-fixed${scrolled ? ' scrolled' : ''}`} id="header-fixed">
      <a href={`${linkBase}#top`} className="logo" aria-label="Park24">
        <img src="/assets/logo_park24.svg" alt="Park24" />
      </a>
      <div className="menu-wrap" ref={wrapRef}>
        <button
          className="menu-btn"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
        >
          <span className="menu-label">Menu</span>
          {!menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          )}
        </button>
        <nav className={`menu-panel${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
          {[
            ['01', 'Úvod', 'top'],
            ['02', 'O Boxech', 'about'],
            ['03', 'Parametry & výbava', 'features'],
            ['04', 'Nabídka boxů', 'box-map'],
            ['05', 'Galerie', 'gallery'],
            ['06', 'Lokalita & Kontakt', 'contact'],
          ].map(([num, text, anchor]) => (
            <a key={anchor} href={`${linkBase}#${anchor}`} onClick={() => setMenuOpen(false)}>
              <span className="mp-num">{num}</span>
              <span className="mp-text">{text}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Hero                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden />
      <h1 className="hero-title">
        Obchodně skladovací
        <br />
        boxy
      </h1>
      <div className="hero-boxes">
        <div className="glass-card">
          <img className="glass-icon" src="/assets/grid-02.svg" alt="" aria-hidden />
          <div>
            <div className="glass-num">od 297 m²</div>
            <div className="glass-label">Užitná plocha</div>
          </div>
        </div>
        <div className="glass-card">
          <img className="glass-icon" src="/assets/car-01.svg" alt="" aria-hidden />
          <div>
            <div className="glass-num glass-num-wrap">4× parkování</div>
            <div className="glass-label">pro každý box</div>
          </div>
        </div>
        <a className="glass-card dark" href="#box-map">
          <span>Výběr boxu</span>
          <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <polyline points="14 5 21 12 14 19" />
          </svg>
        </a>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Intro                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function Intro() {
  return (
    <section className="intro" id="about">
      <div className="eyebrow">O Boxech Park24</div>
      <h2>
        <b>Moderní business boxy</b> v Lelekovicích u Brna — 17 jednotek se zázemím, kanceláří, skladem a <b>vlastním parkováním.</b>
      </h2>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Carousel                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function CarouselSection() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [lbAt, setLbAt] = useState<number | null>(null)

  const slide = (dir: 1 | -1) => {
    if (!trackRef.current) return
    const w = trackRef.current.clientWidth
    trackRef.current.scrollBy({ left: dir * w * 0.6, behavior: 'smooth' })
  }

  const openAt = (src: string) => {
    const i = GALLERY_IMAGES.findIndex((g) => g.src === src)
    setLbAt(i >= 0 ? i : 0)
  }
  const cImg = (cls: string, src: string) => (
    <button
      type="button"
      className={`${cls} c-img-btn`}
      style={{ '--bg': `url(${src})` } as React.CSSProperties}
      onClick={() => openAt(src)}
      aria-label="Zvětšit fotku"
    />
  )

  return (
    <section className="carousel-section" id="carousel">
      <div className="carousel" ref={trackRef}>
        <div className="carousel-track">
          {cImg('c-side-img', '/assets/gallery/g1.jpg')}
          <div className="c-card-lite">
            <svg className="glass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8V5a2 2 0 0 1 2-2h3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
            </svg>
            <div>
              <div className="glass-num">od 297 m²</div>
              <div className="glass-label">Užitná plocha</div>
            </div>
          </div>
          {cImg('c-main-img', '/assets/gallery/g5.jpg')}
          <div className="c-card-dark">
            <div className="c-card-dark-text">
              <h3>Na výběr {BOX_POLYGONS.length} boxů</h3>
              <p>
                Jednotlivé boxy lze propojit do většího celku a přizpůsobit tak dispozici
                přesně vašemu provozu — od jedné jednotky až po celé křídlo.
              </p>
            </div>
            <div className="c-avatar" aria-hidden />
          </div>
          {cImg('c-wide-img', '/assets/gallery/g4.jpg')}
          {cImg('c-side-img', '/assets/gallery/g6.jpg')}
          {cImg('c-tall-img', '/assets/gallery/g2.jpg')}
        </div>
      </div>

      <div className="carousel-controls">
        <button className="nav-btn flip" onClick={() => slide(-1)} aria-label="Předchozí">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button className="nav-btn" onClick={() => slide(1)} aria-label="Další">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {lbAt !== null && (
        <GalleryModal images={GALLERY_IMAGES} start={lbAt} onClose={() => setLbAt(null)} />
      )}
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Features (blueprint slider + pills)                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function Features() {
  const [slideIdx, setSlideIdx] = useState(0)
  const slides = [
    { label: '1. NP', src: '/assets/plan-1np.png' },
    { label: '2. NP', src: '/assets/plan-2np.png' },
    { label: 'Čelní pohled', src: '/assets/plan-front.png' },
    { label: 'Řez', src: '/assets/plan-bok.png' },
  ]

  useEffect(() => {
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % slides.length), 4500)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <section className="features" id="features">
      <div className="features-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            Parametry a výbava
          </div>
          <h2>
            Na velikosti
            <br />a výbavě záleží
          </h2>
        </div>
        <div className="features-head-right">
          <p>
            Projekt 17 moderních business boxů v Lelekovicích u Brna nabízí skvělé zázemí pro Váš
            business. Každá jednotka je dvoupodlažní — v přízemí sklad či výroba s vlastním
            showroomem a v patře reprezentativní kancelář a administrativní zázemí. Ke každému
            boxu patří vlastní parkovací stání a celá hala je postavena v pasivním energetickém
            standardu.
          </p>
          <StandardsDownload />
        </div>
      </div>

      <div className="features-slider">
        <button
          className="nav-btn flip"
          onClick={() => setSlideIdx((i) => (i - 1 + slides.length) % slides.length)}
          aria-label="Předchozí"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <div className="blueprint">
          <div
            className="blueprint-track"
            style={{ transform: `translateX(-${100 * slideIdx}%)` }}
          >
            {slides.map((s, i) => (
              <div className="blueprint-slide" key={i}>
                <span className="blueprint-caption">{s.label}</span>
                <img src={s.src} alt={`Půdorys boxu — ${s.label}`} />
              </div>
            ))}
          </div>
          <div className="blueprint-dots">
            {slides.map((_, i) => (
              <span
                key={i}
                className={i === slideIdx ? 'active' : ''}
                onClick={() => setSlideIdx(i)}
              />
            ))}
          </div>
        </div>
        <button
          className="nav-btn"
          onClick={() => setSlideIdx((i) => (i + 1) % slides.length)}
          aria-label="Další"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="feature-pills">
        {[
          ['Energetická třída A', <FpIcon1 key="i1" />],
          ['Klimatizace', <FpIcon2 key="i2" />],
          ['Příprava na venkovní žaluzie', <FpIcon3 key="i3" />],
          ['Denní světlo ve skladu ze světlíku', <FpIcon4 key="i4" />],
        ].map(([label, icon], i) => (
          <div className="pill" key={i}>
            <div className="pill-icon">{icon}</div>
            <div className="pill-label">{label as string}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Download panel for the box-standards PDF (used on box detail pages). */
function StandardsDownload() {
  return (
    <a
      className="std-download"
      href="/assets/Park24-standardy-boxu.pdf"
      download
      target="_blank"
      rel="noopener"
    >
      <div className="std-download-icon">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 18 15 15" />
        </svg>
      </div>
      <div className="std-download-text">
        <div className="std-download-title">Standardy boxu ke stažení</div>
        <div className="std-download-sub">
          Co všechno je v ceně a z čeho je hala postavena — kompletní přehled v PDF.
        </div>
      </div>
      <span className="std-download-cta">
        Stáhnout PDF
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <polyline points="14 5 21 12 14 19" />
        </svg>
      </span>
    </a>
  )
}

const FpIcon1 = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="24" r="14" />
    <path d="M24 14v20M14 24h20" />
  </svg>
)
const FpIcon2 = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 6v36M6 24h36M11 11l26 26M37 11L11 37" />
  </svg>
)
const FpIcon3 = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="8" width="28" height="32" rx="2" />
    <line x1="10" y1="16" x2="38" y2="16" />
    <line x1="10" y1="24" x2="38" y2="24" />
    <line x1="10" y1="32" x2="38" y2="32" />
  </svg>
)
const FpIcon4 = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="24" r="8" />
    <path d="M24 4v5M24 39v5M4 24h5M39 24h5M10.5 10.5l3.5 3.5M33.9 33.9l3.6 3.6M37.5 10.5l-3.6 3.6M14.1 33.9l-3.6 3.6" />
  </svg>
)

/* ────────────────────────────────────────────────────────────────────────── */
/*  Box Selection — aerial image (left) + clickable status list (right)        */
/* ────────────────────────────────────────────────────────────────────────── */

const PdfIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v5" />
    <path d="M4 19v-7" style={{ display: 'none' }} />
  </svg>
)

function BoxList({ boxes }: { boxes: Box[] }) {
  return (
    <ul className="bs-list">
      {boxes.map((b) => {
        return (
          <li
            key={b.id}
            className={`bs-row bs-row-${b.status}`}
            tabIndex={0}
            role="button"
            title={`Box ${b.id} — zobrazit detail`}
            onClick={() => openBox(b.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openBox(b.id)
              }
            }}
          >
            <span className="bs-row-id">{b.id}</span>
            <span className="bs-row-area">{fmtM2(displayArea(b))} m²</span>
            <span className="bs-row-price">{formatCzk(displayPrice(b))}</span>
            <span className={`bs-status bs-status-${b.status}`}>
              {b.status === 'volny' && <span className="dot" />}
              {STATUS_LABEL[b.status]}
            </span>
            <button
              type="button"
              className="bs-pdf"
              aria-label={`Stáhnout kartu boxu ${b.id} v PDF`}
              title="Stáhnout kartu (PDF)"
              onClick={(e) => {
                e.stopPropagation()
                generateBoxPdf(b)
              }}
            >
              <PdfIcon />
            </button>
            <span className="bs-chevron" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function BoxSelection() {
  const { boxes } = useBoxes()

  return (
    <section className="box-selection" id="choose">
      <div className="bs-head">
        <div className="eyebrow">Nabídka boxů</div>
        <h2>Vyberte si svůj box</h2>
      </div>

      <div className="bs-body">
        {/* LEFT — static aerial image (numbers baked in) */}
        <div className="bs-aerial">
          <img src="/assets/aerial-numbered.png" alt="Letecký pohled na areál Park24" />
        </div>

        {/* RIGHT — clickable rows (data from localStorage / admin) */}
        <BoxList boxes={boxes} />
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Box Map — aerial visualization with clickable polygon overlays             */
/* ────────────────────────────────────────────────────────────────────────── */

function polygonTopCenter(points: string): { x: number; y: number } {
  const coords = points.trim().split(/\s+/).map((pair) => {
    const [x, y] = pair.split(',').map(Number)
    return { x, y }
  })
  const x = coords.reduce((sum, p) => sum + p.x, 0) / coords.length
  const y = Math.min(...coords.map((p) => p.y))
  return { x, y }
}

function BoxMap() {
  const { boxes } = useBoxes()
  const byId = useMemo(() => new Map(boxes.map((b) => [b.id, b])), [boxes])

  return (
    <section className="box-map" id="box-map">
      <div className="bm-head">
        <div className="eyebrow">Interaktivní plán</div>
        <h2>Vyberte box přímo z mapy</h2>
      </div>

      <div className="bm-wrap">
        <img
          src={BOX_MAP_IMAGE.src}
          alt={BOX_MAP_IMAGE.alt}
          className="bm-img"
          draggable={false}
        />

        <svg
          className="bm-svg"
          viewBox={`0 0 ${BOX_MAP_IMAGE.width} ${BOX_MAP_IMAGE.height}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Klikatelný plán boxů"
        >
          {BOX_POLYGONS.length === 0 ? (
            <text
              x={BOX_MAP_IMAGE.width / 2}
              y={BOX_MAP_IMAGE.height / 2}
              className="bm-empty"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              Polygony ještě nejsou nadefinovány – upravte src/boxMapPolygons.ts
            </text>
          ) : (
            BOX_POLYGONS.map((poly) => {
              const box = byId.get(poly.id)
              const status = box?.status ?? 'volny'
              const tooltip = box
                ? `Box ${poly.id} – ${STATUS_LABEL[status]} · ${fmtM2(displayArea(box))} m² · ${formatCzk(displayPrice(box))}`
                : `Box ${poly.id}`
              const anchor = polygonTopCenter(poly.points)
              return (
                <g
                  key={poly.id}
                  className={`bm-box bm-box-${status} is-clickable`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${tooltip} – zobrazit detail`}
                  onClick={() => openBox(poly.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openBox(poly.id)
                    }
                  }}
                >
                  <polygon points={poly.points} />
                  <g transform={`translate(${anchor.x}, ${anchor.y})`}>
                    <g className="bm-pill" aria-hidden>
                      <foreignObject x="0" y="0" width="1" height="1" overflow="visible">
                        <div className={`bm-pill-badge bm-pill-${status}`}>
                          {status === 'volny' && <span className="dot" />}
                          <span className="bm-pill-id">{poly.id}</span>
                          <span className="bm-pill-sep">·</span>
                          <span>{STATUS_LABEL[status]}</span>
                        </div>
                      </foreignObject>
                    </g>
                  </g>
                  <title>{tooltip}</title>
                </g>
              )
            })
          )}
        </svg>
      </div>

      <div className="bm-legend" aria-hidden>
        <span className="bm-legend-item bm-box-volny">Volný</span>
        <span className="bm-legend-item bm-box-rezervovano">Rezervovaný</span>
        <span className="bm-legend-item bm-box-prodano">Prodaný</span>
      </div>

      <div className="bm-list">
        <BoxList boxes={boxes} />
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Gallery                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const GALLERY_IMAGES = [
  { src: '/assets/gallery/g9.jpg', alt: 'Kancelářské zázemí s jednacím stolem' },
  { src: '/assets/gallery/g3.jpg', alt: 'Letecký pohled na areál Park24 v Lelekovicích' },
  { src: '/assets/gallery/g1.jpg', alt: 'Areál business boxů Park24 za soumraku' },
  { src: '/assets/gallery/g2.jpg', alt: 'Čelní pohled na boxy s vjezdovými vraty' },
  { src: '/assets/gallery/g4.jpg', alt: 'Řada komerčních boxů s vlastním parkováním' },
  { src: '/assets/gallery/g5.jpg', alt: 'Reprezentativní showroom s prosklenou stěnou' },
  { src: '/assets/gallery/g7.jpg', alt: 'Prosvětlená kancelář v patře boxu' },
  { src: '/assets/gallery/g6.jpg', alt: 'Skladová hala s regály a mezaninem' },
  { src: '/assets/gallery/g8.jpg', alt: 'Skladová a expediční část boxu' },
  { src: '/assets/gallery/g10.jpg', alt: 'Sklad s ocelovým mezaninem a schodištěm' },
]

function Gallery() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <section className="gallery" id="gallery" aria-label="Galerie">
        <div className="gallery-overlay">
          <button className="gallery-btn" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Zobrazit galerii
          </button>
        </div>
      </section>
      {open && <GalleryModal images={GALLERY_IMAGES} onClose={() => setOpen(false)} />}
    </>
  )
}

function GalleryModal({ images, onClose, start = 0 }: { images: { src: string; alt: string; render?: React.ReactNode }[]; onClose: () => void; start?: number }) {
  const [idx, setIdx] = useState(start)
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length)
  const next = () => setIdx((i) => (i + 1) % images.length)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [images.length, onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <button className="lb-close" onClick={onClose} aria-label="Zavřít galerii">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>

      <div className="lb-viewer">
        <button className="lb-nav lb-prev" onClick={prev} aria-label="Předchozí fotka">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <figure className="lb-stage" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
          {images[idx].render ?? <img src={images[idx].src} alt={images[idx].alt} />}
        </figure>

        <button className="lb-nav lb-next" onClick={next} aria-label="Další fotka">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="lb-desc">{images[idx].alt}</div>

      <div className="lb-thumbs">
        {images.map((im, i) => (
          <button
            key={im.src}
            className={`lb-thumb${i === idx ? ' active' : ''}`}
            style={{ backgroundImage: `url(${im.src})` }}
            onClick={() => setIdx(i)}
            aria-label={`Zobrazit fotku ${i + 1}`}
          />
        ))}
      </div>

      <div className="lb-countbar">
        <span className="lb-count">{idx + 1} / {images.length}</span>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Interactive Map + Contact                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function InteractiveMapContact() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return
    let cancelled = false

    ;(async () => {
      const maplibregl = await import('maplibre-gl')
      if (cancelled || !mapContainer.current) return

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/019e69bd-eb9a-7483-b967-25f3d93f8fdb/style.json?key=2YLradS2EtzJ9hnY3xOT',
        center: [16.567102862812007, 49.2874580362336],
        zoom: 15,
        cooperativeGestures: true,
      })

      const markerEl = document.createElement('div')
      markerEl.className = 'map-marker-custom'
      markerEl.innerHTML = `
        <div class="map-pointer" style="position:relative;left:0;top:0">
          <div class="label">Park24</div>
          <div class="ring"></div>
          <div class="dot"></div>
        </div>
      `

      new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([16.567102862812007, 49.2874580362336])
        .addTo(map)

      mapInstance.current = map
    })()

    return () => { cancelled = true }
  }, [])

  return (
    <section className="map-section map-section-live" id="live-map">
      <div className="map-gl-container" ref={mapContainer} />

      <div className="contact-card">
        <div>
          <div className="eyebrow">Kde nás najdete?</div>
          <h3>Lokalita</h3>
          <p className="contact-lead">
            Komerční jednotky se nachází v průmyslové zóně v obci Lelekovice na ulici
            Chmelníky, s dobrým dopravním napojením na R43.
          </p>
        </div>

        <div className="contact-icons">
          <div className="stat">
            <div className="stat-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18l4-12h10l4 12" />
                <path d="M3 18h18" />
                <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 3" />
              </svg>
            </div>
            <div>
              <div className="stat-num">1 min</div>
              <div className="stat-sub">R43</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21V9l9-6 9 6v12" />
                <rect x="9" y="13" width="6" height="8" />
                <rect x="6" y="11" width="3" height="3" />
                <rect x="15" y="11" width="3" height="3" />
              </svg>
            </div>
            <div>
              <div className="stat-num">10 min</div>
              <div className="stat-sub">centrum Brna</div>
            </div>
          </div>
          <div className="stat">
            <div className="stat-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="12" rx="2" />
                <line x1="4" y1="11" x2="20" y2="11" />
                <circle cx="8" cy="13.5" r="1" />
                <circle cx="16" cy="13.5" r="1" />
                <path d="M8 16l-2 3" />
                <path d="M16 16l2 3" />
              </svg>
            </div>
            <div>
              <div className="stat-num">5 min</div>
              <div className="stat-sub">Vlaková zastávka</div>
            </div>
          </div>
        </div>

        <button className="contact-btn">
          <span>Kontaktujte nás</span>
          <span className="chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Pink Ticker                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function Ticker() {
  const items = Array.from({ length: 8 }).flatMap((_, i) => [
    <span className="t-logo" key={`l${i}`}>
      Park24
    </span>,
    <span className="t-text" key={`t${i}`}>
      Obchodně skladovací boxy
    </span>,
  ])
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">{items}</div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Footer                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <a href="#top" className="logo" aria-label="Park24">
          <img src="/assets/logo_park24.svg" alt="Park24" width={179} height={56} />
        </a>
        <div className="footer-social">
          <span>Sledujte aktuality na</span>
          <div className="socials">
            <a href="#" aria-label="Facebook">
              <svg width="22.8" height="22.8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="22.8" height="22.8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-address">
        <div className="footer-addr-col">
          <span className="footer-addr-label">Developer projektu</span>
          <span>ESPRIT living s.r.o.</span>
          <span>Ing. Ondřej Menšík</span>
          <span>Tel.: <a href="tel:+420737889777">+420 737 889 777</a></span>
          <span><a href="mailto:mensik@stemfire.cz">mensik@stemfire.cz</a></span>
          <span className="footer-addr-reg">
            Sídlo dle rejstříku: Šámalova 1537/60a, 615 00 Brno – Židenice · IČO: 18824137
          </span>
        </div>

        <div className="footer-addr-col">
          <span className="footer-addr-label">Doručovací adresa / klientské centrum</span>
          <span>ESPRIT living s.r.o.</span>
          <span>Cejl 29/76, 602 00 Brno – Židenice</span>
        </div>
      </div>

      <div className="footer-meta">
        <span>© 2026</span>
        <span>Vytvořila Smeczka</span>
      </div>
    </footer>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Inquiry Modal — name / phone / email / note + Rezervovat                   */
/* ────────────────────────────────────────────────────────────────────────── */

function InquiryModal({ box, onClose }: { box: Box; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Vyplňte jméno'
    if (!form.phone.trim() && !form.email.trim()) {
      next.phone = 'Vyplňte telefon nebo e-mail'
      next.email = 'Vyplňte telefon nebo e-mail'
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Neplatný e-mail'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    await submitInquiry({ box: box.id, ...form })
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div
      className="modal-backdrop open"
      role="dialog"
      aria-modal
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal inquiry-modal">
        <button className="modal-close" onClick={onClose} aria-label="Zavřít">
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {submitted ? (
          <div className="inquiry-success">
            <div className="inquiry-success-icon" aria-hidden>
              <svg viewBox="0 0 48 48" width={44} height={44} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="24" cy="24" r="20" />
                <polyline points="15 24 22 31 33 18" />
              </svg>
            </div>
            <h3>Děkujeme!</h3>
            <p>
              Vaše poptávka pro box <strong>{box.id}</strong> byla odeslána.
              Ozveme se vám co nejdříve.
            </p>
            <button className="modal-btn primary" onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div className="modal-eyebrow">Poptávka boxu</div>
            <h3>{box.id}</h3>
            <p className="inquiry-meta">
              {fmtM2(displayArea(box))} m² · {formatCzk(displayPrice(box))}
            </p>

            <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
              <Field
                label="Jméno a příjmení"
                required
                value={form.name}
                onChange={(v) => update('name', v)}
                error={errors.name}
                autoFocus
              />
              <Field
                label="Telefon"
                type="tel"
                placeholder="+420"
                value={form.phone}
                onChange={(v) => update('phone', v)}
                error={errors.phone}
              />
              <Field
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(v) => update('email', v)}
                error={errors.email}
              />
              <Field
                label="Poznámka"
                value={form.note}
                onChange={(v) => update('note', v)}
                error={errors.note}
                multiline
                placeholder="Volitelně — termín, otázky, požadavky…"
              />

              <div className="modal-actions">
                <button type="button" className="modal-btn ghost" onClick={onClose}>
                  Zrušit
                </button>
                <button type="submit" className="modal-btn primary" disabled={submitting}>
                  {submitting ? 'Odesílám…' : 'Rezervovat'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <polyline points="14 5 21 12 14 19" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* Reusable form field */
function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  required,
  placeholder,
  autoFocus,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  required?: boolean
  placeholder?: string
  autoFocus?: boolean
  multiline?: boolean
}) {
  return (
    <label className={`field${error ? ' field-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <span aria-hidden> *</span>}
      </span>
      {multiline ? (
        <textarea
          className="field-input"
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="field-input"
          type={type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <span className="field-msg">{error}</span>}
    </label>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Box detail page — /box/:id                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const fmtArea = (n: number) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function RoomLegend({ rows }: { rows: Room[] }) {
  const complete = rows.every((r) => r.area != null)
  const total = rows.reduce((s, r) => s + (r.area ?? 0), 0)
  return (
    <div className="bd-room-table">
      <table>
        <thead>
          <tr>
            <th>č.</th>
            <th>Místnost</th>
            <th className="num">s.v. [m]</th>
            <th className="num">Plocha [m²]</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code}>
              <td className="code">{r.code}</td>
              <td>{r.name}</td>
              <td className="num">{r.sv}</td>
              <td className="num">{r.area != null ? fmtArea(r.area) : '—'}</td>
            </tr>
          ))}
        </tbody>
        {complete && (
          <tfoot>
            <tr>
              <td colSpan={3}>Celkem</td>
              <td className="num">{fmtArea(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export function BoxDetail({ id }: { id: string }) {
  const { boxes, loading } = useBoxes()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [floorTab, setFloorTab] = useState<'np1' | 'np2'>('np1')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const box = boxes.find((b) => b.id === id)

  useEffect(() => {
    document.title = `Box ${id} — Park24`
    return () => { document.title = 'Park24' }
  }, [id])

  // Always open the box page at the top, before paint and without smooth
  // animation (scroll-behavior:smooth would otherwise animate the jump).
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [id])

  const goHome = (e: React.MouseEvent) => { e.preventDefault(); navigate('/') }

  if (loading && !box) {
    return (
      <div className="box-detail-page">
        <Header scrolled menuOpen={menuOpen} setMenuOpen={setMenuOpen} linkBase="/" />
        <main className="bd bd-loading">Načítám box…</main>
        <Footer />
      </div>
    )
  }

  if (!box) {
    return (
      <div className="box-detail-page">
        <Header scrolled menuOpen={menuOpen} setMenuOpen={setMenuOpen} linkBase="/" />
        <main className="bd bd-notfound">
          <h1>Box nenalezen</h1>
          <p>Box „{id}" v nabídce neexistuje.</p>
          <a href="/" className="bd-btn primary" onClick={goHome}>Zpět na nabídku boxů</a>
        </main>
        <Footer />
      </div>
    )
  }

  const available = box.status === 'volny'
  const area = displayArea(box)
  const price = displayPrice(box)

  const specs: [string, string][] = [
    ['Celková plocha', `${fmtM2(area)} m²`],
    ['Cena', formatCzk(price)],
    ['Dispozice', 'Dvoupodlažní — přízemí showroom, patro administrativa'],
    ['Vhodné pro', 'Sklad · výroba · showroom · obchod'],
    ['Stav', STATUS_LABEL[box.status]],
  ]

  const equipment = ['Energetická třída A', 'Klimatizace', 'Příprava na venkovní žaluzie', 'Denní světlo ve skladu ze světlíku']

  const plans = boxPlans(box.id)
  const rooms = boxRooms(box.id)
  const media = [
    { kind: 'plan', src: plans.np1, label: '1. NP' },
    { kind: 'plan', src: plans.np2, label: '2. NP' },
    { kind: 'aerial', src: BOX_MAP_IMAGE.src, label: 'Poloha' },
  ]
  const active = media[mediaIdx] ?? media[0]
  const lightboxImages = media.map((m) =>
    m.kind === 'aerial'
      ? {
          src: m.src,
          alt: `Poloha boxu ${box.id} v areálu`,
          render: (
            <span className="lb-aerial">
              <img src={BOX_MAP_IMAGE.src} alt={`Poloha boxu ${box.id} v areálu`} />
              <svg
                viewBox={`0 0 ${BOX_MAP_IMAGE.width} ${BOX_MAP_IMAGE.height}`}
                preserveAspectRatio="xMidYMid meet"
                className="lb-aerial-svg"
                aria-hidden
              >
                {BOX_POLYGONS.map((p) => (
                  <polygon
                    key={p.id}
                    points={p.points}
                    className={`bd-poly${p.id === box.id ? ' active' : ''}`}
                  />
                ))}
              </svg>
            </span>
          ),
        }
      : {
          src: m.src,
          alt: `Půdorys ${m.label} boxu ${box.id}`,
          render: (
            <span className="lb-plan">
              <img src={m.src} alt={`Půdorys ${m.label} boxu ${box.id}`} />
            </span>
          ),
        }
  )

  return (
    <div className="box-detail-page">
      <Header scrolled={scrolled} menuOpen={menuOpen} setMenuOpen={setMenuOpen} linkBase="/" />

      <main className="bd">
        <nav className="bd-crumb" aria-label="Drobečková navigace">
          <a href="/#box-map" onClick={goHome}>Nabídka boxů</a>
          <span aria-hidden>/</span>
          <span className="bd-crumb-current">Box {box.id}</span>
        </nav>

        <div className="bd-grid">
          {/* Media — aerial with this box highlighted */}
          <div className="bd-media">
            <div className="bd-gallery">
              <button
                type="button"
                className="bd-gallery-main"
                onClick={() => setLightbox(true)}
                aria-label="Zobrazit větší galerii"
              >
                {active.kind === 'aerial' ? (
                  <div className="bd-map bd-map-fill">
                    <img src={BOX_MAP_IMAGE.src} alt={`Poloha boxu ${box.id} v areálu`} draggable={false} />
                    <svg
                      viewBox={`0 0 ${BOX_MAP_IMAGE.width} ${BOX_MAP_IMAGE.height}`}
                      preserveAspectRatio="xMidYMid meet"
                      className="bd-map-svg"
                      aria-hidden
                    >
                      {BOX_POLYGONS.map((p) => (
                        <polygon
                          key={p.id}
                          points={p.points}
                          className={`bd-poly${p.id === box.id ? ' active' : ''}`}
                        />
                      ))}
                    </svg>
                  </div>
                ) : (
                  <div className="bd-plan-main">
                    <img src={active.src} alt={`Půdorys ${active.label} boxu ${box.id}`} />
                    <span className="bd-plan-tag">{active.label}</span>
                  </div>
                )}

                <span className="bd-zoom" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </span>
              </button>

              <div className="bd-thumbs">
                {media.map((m, i) => (
                  <button
                    key={m.label}
                    type="button"
                    className={`bd-thumb${i === mediaIdx ? ' active' : ''}`}
                    onClick={() => setMediaIdx(i)}
                    aria-label={m.label}
                    title={m.label}
                  >
                    <img
                      src={m.src}
                      alt=""
                      className={m.kind === 'aerial' ? 'cover' : 'contain'}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {rooms && (
            <section className="bd-rooms">
              <div className="bd-rooms-head">
                <h2>Legenda místností</h2>
                <div className="bd-rooms-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={floorTab === 'np1'}
                    className={floorTab === 'np1' ? 'active' : ''}
                    onClick={() => setFloorTab('np1')}
                  >
                    1. NP
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={floorTab === 'np2'}
                    className={floorTab === 'np2' ? 'active' : ''}
                    onClick={() => setFloorTab('np2')}
                  >
                    2. NP
                  </button>
                </div>
              </div>
              <RoomLegend rows={floorTab === 'np1' ? rooms.np1 : rooms.np2} />
            </section>
          )}

          {/* Info panel */}
          <aside className="bd-panel">
            <div className="bd-eyebrow">Park24 · obchodně skladovací box</div>
            <div className="bd-title-row">
              <h1>Box {box.id}</h1>
              <span className={`bd-status bd-status-${box.status}`}>
                {available && <span className="dot" />}
                {STATUS_LABEL[box.status]}
              </span>
            </div>
            <div className="bd-price">{formatCzk(price)}</div>
            <div className="bd-subprice">{fmtM2(area)} m² · {boxParking(box.id)}× parkování</div>

            <dl className="bd-specs">
              {specs.map(([k, v]) => (
                <div className="bd-spec" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            <div className="bd-actions">
              <button
                type="button"
                className="bd-btn primary"
                disabled={!available}
                onClick={() => setReserving(true)}
              >
                {available ? 'Rezervovat box' : `Box ${STATUS_LABEL[box.status].toLowerCase()}`}
                {available && (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <polyline points="14 5 21 12 14 19" />
                  </svg>
                )}
              </button>
              <button type="button" className="bd-btn ghost" onClick={() => generateBoxPdf(box)}>
                <PdfIcon />
                Stáhnout kartu (PDF)
              </button>
            </div>

            <a href="/#box-map" className="bd-back" onClick={goHome}>← Zpět na nabídku boxů</a>
          </aside>

          {/* Text sections — under the photo, left column */}
          <section className="bd-info">
            <div className="bd-info-col">
              <h2>O boxu</h2>
              <p>Moderní prostor pro vaše podnikání v Lelekovicích u Brna.</p>
              <p>
                Dvoupodlažní jednotka chytře kombinuje praktické zázemí v přízemí a reprezentativní
                prostory v patře. Dole získáte variabilní sklad či výrobu s vlastním showroomem,
                nahoře pak světlou kancelář a komfortní administrativní zázemí pro váš tým i schůzky
                s klienty.
              </p>
            </div>
            <div className="bd-info-col">
              <h2>Výbava</h2>
              <ul className="bd-equip">
                {equipment.map((e) => (
                  <li key={e}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <StandardsDownload />
          </section>
        </div>
      </main>

      <Footer />

      {reserving && <InquiryModal box={box} onClose={() => setReserving(false)} />}
      {lightbox && (
        <GalleryModal images={lightboxImages} start={mediaIdx} onClose={() => setLightbox(false)} />
      )}
    </div>
  )
}
