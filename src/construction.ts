/* ════════════════════════════════════════════════════════════════════════
   Průběh výstavby — fotky ze stavby, seskupené po letech.

   Přidání fotky:
   1. obrázek zmenšit na 2000 px (delší strana) a na náhled 720 px, bez EXIF
      metadat (iPhone v nich ukládá GPS polohu), a uložit do
      public/assets/vystavba/ jako RRRR-MM-DD-popis.jpg a …-thumb.jpg,
   2. přidat záznam do CONSTRUCTION_PHOTOS níže.

   Rok i řazení se počítají z data, takže nic dalšího není potřeba.
   ════════════════════════════════════════════════════════════════════════ */

export type ConstructionPhoto = {
  /** Plné rozlišení pro galerii (modal). */
  src: string
  /** Náhled do mřížky na stránce. */
  thumb: string
  /** Datum pořízení, RRRR-MM-DD. */
  date: string
  /** Krátký popis, co je na fotce. */
  title: string
  alt: string
  /** Ukázková fotka (ne ze skutečné stavby) — na webu dostane štítek
   *  „Ilustrační foto". Až budou skutečné fotky, záznamy s demo smazat. */
  demo?: boolean
}

export const CONSTRUCTION_PHOTOS: ConstructionPhoto[] = [
  {
    src: '/assets/vystavba/2026-09-16-zemni-prace.jpg',
    thumb: '/assets/vystavba/2026-09-16-zemni-prace-thumb.jpg',
    date: '2026-09-16',
    title: 'Zemní práce',
    alt: 'Rypadlo na staveništi Park24 u haldy vytěžené zeminy, v pozadí rodinné domy',
  },
  {
    src: '/assets/vystavba/2026-08-24-skryvka-ornice.jpg',
    thumb: '/assets/vystavba/2026-08-24-skryvka-ornice-thumb.jpg',
    date: '2026-08-24',
    title: 'Skrývka ornice',
    alt: 'Letecký pohled na staveniště Park24 — buldozer odstraňuje ornici z pozemku vedle železniční trati',
  },

  // ── UKÁZKA ROKU 2025 ─────────────────────────────────────────────────────
  // Vizualizace hotového areálu z galerie, jen aby bylo vidět, jak stránka
  // vypadá s více roky. Až budou skutečné fotky, tyto tři záznamy smazat
  // (a soubory public/assets/vystavba/ukazka-*.jpg).
  {
    src: '/assets/gallery/g3.jpg',
    thumb: '/assets/vystavba/ukazka-g3-thumb.jpg',
    date: '2025-11-12',
    title: 'Areál z ptačí perspektivy',
    alt: 'Vizualizace areálu Park24 z ptačí perspektivy za soumraku',
    demo: true,
  },
  {
    src: '/assets/gallery/g4.jpg',
    thumb: '/assets/vystavba/ukazka-g4-thumb.jpg',
    date: '2025-06-03',
    title: 'Řada boxů s parkováním',
    alt: 'Vizualizace řady obchodně skladovacích boxů s parkovacími stáními',
    demo: true,
  },
  {
    src: '/assets/gallery/g6.jpg',
    thumb: '/assets/vystavba/ukazka-g6-thumb.jpg',
    date: '2025-03-18',
    title: 'Skladová hala s mezaninem',
    alt: 'Vizualizace skladové části boxu s regály a ocelovým mezaninem',
    demo: true,
  },
]

export type ConstructionYear = { year: number; photos: ConstructionPhoto[] }

/** Nejnovější rok nahoře, uvnitř roku nejnovější fotka první. */
export function constructionYears(): ConstructionYear[] {
  const sorted = [...CONSTRUCTION_PHOTOS].sort((a, b) => b.date.localeCompare(a.date))
  const years: ConstructionYear[] = []
  for (const p of sorted) {
    const year = Number(p.date.slice(0, 4))
    const last = years[years.length - 1]
    if (last && last.year === year) last.photos.push(p)
    else years.push({ year, photos: [p] })
  }
  return years
}

/** „16. 9. 2026" */
export function formatPhotoDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}
