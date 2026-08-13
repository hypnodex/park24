// Per-box room legends (LEGENDA MÍSTNOSTÍ) — 1.NP + 2.NP, areas in m².
// Source: Pudorysy/Fin/Sources (17 boxes: BOX 1–12 → P1–P12, BOX B1–B5 → P13–P17).
// `null` area = source screenshot was cropped and the value must still be filled in.

export type Room = {
  code: string
  name: string
  sv: string // světlá výška [m]
  area: number | null // plocha [m²]
}

export type BoxRooms = {
  np1: Room[]
  np2: Room[]
}

// Variable per-box values; fixed rooms (WC, schodiště, chodba…) come from the template.
type Vars = {
  np1: { kancelar: number | null; uklid: number | null; chodba: number | null; sklad: number | null }
  np2: { kancelar: number | null; sklad: number | null; skladSv?: string }
}

const V: Record<string, Vars> = {
  P1:  { np1: { kancelar: 29.0, uklid: 7.7, chodba: 3.5, sklad: 188.4 }, np2: { kancelar: 51.7, sklad: 3.7 } },
  P2:  { np1: { kancelar: 30.0, uklid: 7.8, chodba: 3.2, sklad: 178.4 }, np2: { kancelar: 53.2, sklad: 3.5 } },
  P3:  { np1: { kancelar: 27.8, uklid: 7.8, chodba: 3.2, sklad: 184.8 }, np2: { kancelar: 51.7, sklad: 3.7 } },
  P4:  { np1: { kancelar: 30.0, uklid: 7.8, chodba: 3.2, sklad: 178.4 }, np2: { kancelar: 53.2, sklad: 3.1 } },
  P5:  { np1: { kancelar: 27.8, uklid: 7.8, chodba: 3.2, sklad: 184.9 }, np2: { kancelar: 51.7, sklad: 3.7 } },
  P6:  { np1: { kancelar: 30.0, uklid: 7.7, chodba: 3.2, sklad: 178.7 }, np2: { kancelar: 54.7, sklad: 3.3 } },
  P7:  { np1: { kancelar: 28.7, uklid: 7.7, chodba: 3.2, sklad: 191.6 }, np2: { kancelar: 51.4, sklad: 3.7 } },
  P8:  { np1: { kancelar: 29.1, uklid: 7.8, chodba: 3.2, sklad: 178.5 }, np2: { kancelar: 53.2, sklad: 3.1 } },
  P9:  { np1: { kancelar: 29.1, uklid: 7.8, chodba: 3.2, sklad: 184.9 }, np2: { kancelar: 51.7, sklad: 3.7 } },
  P10: { np1: { kancelar: 30.1, uklid: 7.8, chodba: 3.2, sklad: 178.4 }, np2: { kancelar: 53.2, sklad: 3.1 } },
  P11: { np1: { kancelar: 27.8, uklid: 7.8, chodba: 3.2, sklad: 184.9 }, np2: { kancelar: 51.7, sklad: 3.7 } },
  P12: { np1: { kancelar: 30.0, uklid: 8.2, chodba: 3.0, sklad: 178.1 }, np2: { kancelar: 54.7, sklad: 3.4 } },
  P13: { np1: { kancelar: 29.0, uklid: 8.7, chodba: 3.2, sklad: 178.1 }, np2: { kancelar: 54.7, sklad: 3.4 } },
  P14: { np1: { kancelar: 30.5, uklid: 8.7, chodba: 3.4, sklad: 191.0 }, np2: { kancelar: 53.1, sklad: 2.7, skladSv: '2,6' } },
  P15: { np1: { kancelar: 30.1, uklid: 8.7, chodba: 3.2, sklad: 178.4 }, np2: { kancelar: 51.7, sklad: 3.7 } },
  P16: { np1: { kancelar: 27.8, uklid: 8.7, chodba: 3.2, sklad: 184.9 }, np2: { kancelar: 53.2, sklad: 3.1 } },
  P17: { np1: { kancelar: 30.1, uklid: 8.7, chodba: 3.2, sklad: 178.4 }, np2: { kancelar: 51.7, sklad: 3.7 } },
}

function build(v: Vars): BoxRooms {
  return {
    np1: [
      { code: '1.01', name: 'Kancelář', sv: '3,50', area: v.np1.kancelar },
      { code: '1.02', name: 'Předsíňka WC', sv: '2,50', area: 1.6 },
      { code: '1.03', name: 'WC', sv: '2,50', area: 1.6 },
      { code: '1.04', name: 'Úklidová komora', sv: '1,80–3,60', area: v.np1.uklid },
      { code: '1.05', name: 'Chodba', sv: '3,50', area: v.np1.chodba },
      { code: '1.06', name: 'Skladová plocha', sv: '6,15–7,29', area: v.np1.sklad },
    ],
    np2: [
      { code: '2.01', name: 'Kancelář', sv: '3,00', area: v.np2.kancelar },
      { code: '2.02', name: 'Předsíňka WC', sv: '2,50', area: 1.6 },
      { code: '2.03', name: 'WC', sv: '2,50', area: 1.6 },
      { code: '2.04', name: 'Sklad', sv: v.np2.skladSv ?? '2,50', area: v.np2.sklad },
      { code: '2.05a', name: 'Schodiště – mezipodesta', sv: '5,075', area: 3.5 },
      { code: '2.05b', name: 'Schodiště – schody', sv: '5,075–3,0', area: 7.2 },
      { code: '2.05c', name: 'Schodiště – podesta', sv: '3,00', area: 1.6 },
      { code: '2.06', name: 'Chodba', sv: '3,00', area: 2.5 },
    ],
  }
}

export function boxRooms(id: string): BoxRooms | null {
  const v = V[id]
  return v ? build(v) : null
}

// Sum of usable floor area across both floors (rooms with a known area).
export function boxTotalArea(id: string): number | null {
  const r = boxRooms(id)
  if (!r) return null
  const all = [...r.np1, ...r.np2]
  if (all.some((x) => x.area == null)) return null
  return Math.round(all.reduce((s, x) => s + (x.area ?? 0), 0) * 10) / 10
}

// Odd boxes use the "lichy" drawings, even boxes the mirrored "sudy" drawings.
// 1.NP plans include the parking layout from the site plan: 4 spaces by default,
// except P13/B1 (5 spaces) and P14/B2 (3 spaces), which have dedicated drawings.
export function boxPlans(id: string): { np1: string; np2: string } {
  const n = parseInt(id.replace(/\D/g, ''), 10)
  const even = n % 2 === 0
  const np2 = even ? '/assets/plan-2np-even.png' : '/assets/plan-2np-odd.png'
  let np1: string
  if (id === 'P13') np1 = '/assets/plan-1np-b1.png'
  else if (id === 'P14') np1 = '/assets/plan-1np-b2.png'
  else np1 = even ? '/assets/plan-1np-even.png' : '/assets/plan-1np-odd.png'
  return { np1, np2 }
}
