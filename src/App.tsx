import { useEffect, useMemo, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'
import { STATUS_LABEL, formatCzk, submitInquiry, useBoxes, type Box } from './store'
import { BOX_MAP_IMAGE, BOX_POLYGONS } from './boxMapPolygons'

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main App                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export default function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [inquiryBox, setInquiryBox] = useState<Box | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setInquiryBox(null)
      }
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
      <BoxSelection onInquire={setInquiryBox} />
      <BoxMap onInquire={setInquiryBox} />
      <Gallery />
      <InteractiveMapContact />
      <Ticker />
      <Footer />

      {inquiryBox && (
        <InquiryModal box={inquiryBox} onClose={() => setInquiryBox(null)} />
      )}
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Header (fixed, with menu)                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Header({
  scrolled,
  menuOpen,
  setMenuOpen,
}: {
  scrolled: boolean
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
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
      <a href="#top" className="logo" aria-label="Park24">
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
            <a key={anchor} href={`#${anchor}`} onClick={() => setMenuOpen(false)}>
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
            <div className="glass-num">305m²</div>
            <div className="glass-label">Skladová plocha</div>
          </div>
        </div>
        <div className="glass-card">
          <img className="glass-icon" src="/assets/car-01.svg" alt="" aria-hidden />
          <div>
            <div className="glass-num">16x</div>
            <div className="glass-label">Parkovací stání</div>
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
        Novostavba <b>obchodně skladovacích boxů</b> Rohlenka nabízí skvělé zázemí <b>pro Váš business.</b>
      </h2>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Carousel                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function CarouselSection() {
  const trackRef = useRef<HTMLDivElement>(null)

  const slide = (dir: 1 | -1) => {
    if (!trackRef.current) return
    const w = trackRef.current.clientWidth
    trackRef.current.scrollBy({ left: dir * w * 0.6, behavior: 'smooth' })
  }

  return (
    <section className="carousel-section" id="carousel">
      <div className="carousel" ref={trackRef}>
        <div className="carousel-track">
          <div
            className="c-side-img"
            style={{ '--bg': 'url(/assets/carousel-side.jpg)' } as React.CSSProperties}
          />
          <div className="c-card-lite">
            <svg className="glass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8V5a2 2 0 0 1 2-2h3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
            </svg>
            <div>
              <div className="glass-num">305m²</div>
              <div className="glass-label">Skladová plocha</div>
            </div>
          </div>
          <div
            className="c-main-img"
            style={{ '--bg': 'url(/assets/carousel-main.png)' } as React.CSSProperties}
          />
          <div className="c-card-dark">
            <h3>Celkem je na výběr 12 boxů</h3>
            <div className="c-avatar" aria-hidden />
          </div>
          <div
            className="c-wide-img"
            style={{ '--bg': 'url(/assets/carousel-dd.png)' } as React.CSSProperties}
          />
          <div
            className="c-side-img"
            style={{ '--bg': 'url(/assets/carousel-parking.png)' } as React.CSSProperties}
          />
          <div
            className="c-tall-img"
            style={{ '--bg': 'url(/assets/carousel-dvcak.png)' } as React.CSSProperties}
          />
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
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Features (blueprint slider + pills)                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function Features() {
  const [slideIdx, setSlideIdx] = useState(0)
  const slides = ['1. patro', '2. patro', 'Pohled shora', 'Řez']

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
        <p>
          Novostavba obchodně skladovacích boxů Rohlenka nabízí skvělé zázemí pro Váš business.
          Poskytne pohodlí jak menším, tak středním firmám. Box je dvoupodlažní v přední části,
          kde se nabízí přízemí využít jako showroom na prezentaci produktů a poschodí jako
          administrativní zázemí.
        </p>
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
                <img src="/assets/pudorys.png" alt={`Půdorys boxu — ${s}`} />
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
          ['Rekuperace a TČ', <FpIcon1 key="i1" />],
          ['Klimatizace', <FpIcon2 key="i2" />],
          ['Venkovní žaluzie', <FpIcon3 key="i3" />],
          ['Zabezpečení', <FpIcon4 key="i4" />],
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
    <path d="M24 6l16 6v10c0 10-7 18-16 22-9-4-16-12-16-22V12l16-6z" />
    <path d="M17 24l5 5 9-10" />
  </svg>
)

/* ────────────────────────────────────────────────────────────────────────── */
/*  Box Selection — aerial image (left) + clickable status list (right)        */
/* ────────────────────────────────────────────────────────────────────────── */

function BoxList({ boxes, onInquire }: { boxes: Box[]; onInquire: (b: Box) => void }) {
  return (
    <ul className="bs-list">
      {boxes.map((b) => {
        const isAvailable = b.status === 'volny'
        return (
          <li
            key={b.id}
            className={`bs-row bs-row-${b.status}`}
            tabIndex={0}
            role="button"
            aria-disabled={!isAvailable}
            title={`${b.area} m² · ${formatCzk(b.price)}`}
            onClick={() => isAvailable && onInquire(b)}
            onKeyDown={(e) => {
              if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onInquire(b)
              }
            }}
          >
            <span className="bs-row-id">{b.id}</span>
            <span className="bs-row-area">{b.area} m²</span>
            <span className="bs-row-price">{formatCzk(b.price)}</span>
            <span className={`bs-status bs-status-${b.status}`}>
              {b.status === 'volny' && <span className="dot" />}
              {STATUS_LABEL[b.status]}
            </span>
            {isAvailable && (
              <button
                type="button"
                className="bs-cta"
                aria-label={`Rezervovat box ${b.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onInquire(b)
                }}
              >
                Rezervovat
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <polyline points="14 5 21 12 14 19" />
                </svg>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function BoxSelection({ onInquire }: { onInquire: (b: Box) => void }) {
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
        <BoxList boxes={boxes} onInquire={onInquire} />
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

function BoxMap({ onInquire }: { onInquire: (b: Box) => void }) {
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
              const interactive = status === 'volny'
              const tooltip = box
                ? `Box ${poly.id} – ${STATUS_LABEL[status]} · ${box.area} m² · ${formatCzk(box.price)}`
                : `Box ${poly.id}`
              const anchor = polygonTopCenter(poly.points)
              return (
                <g
                  key={poly.id}
                  className={`bm-box bm-box-${status}${interactive ? ' is-clickable' : ''}`}
                  role={interactive ? 'button' : 'presentation'}
                  tabIndex={interactive ? 0 : -1}
                  aria-label={tooltip}
                  aria-disabled={!interactive}
                  onClick={() => {
                    if (interactive && box) onInquire(box)
                  }}
                  onKeyDown={(e) => {
                    if (!interactive || !box) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onInquire(box)
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
        <BoxList boxes={boxes} onInquire={onInquire} />
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Gallery                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function Gallery() {
  return <div className="gallery" id="gallery" aria-label="Galerie boxů" />
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
          <div className="eyebrow">Pomůžeme vám</div>
          <h3>Lokalita &amp; Kontakt</h3>
          <div className="lines">
            <span>Esprit living s.r.o.</span>
            <span>Šámalova 1537/60a, 615 00 Brno – Židenice</span>
          </div>
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
              <div className="stat-num">2 min</div>
              <div className="stat-sub">Dálnice D1</div>
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
              <div className="stat-sub">Brno</div>
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
        <span>Esprit living s.r.o.</span>
        <span>Šámalova 1537/60a, 615 00 Brno – Židenice</span>
        <span>Ing. Ondřej Menšík</span>
        <span>Tel.: +420 737 889 777</span>
        <span>mensik@stemfire.cz</span>
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
              {box.area} m² · {formatCzk(box.price)}
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
