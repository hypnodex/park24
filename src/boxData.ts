// What a box actually shows: the project defaults (boxRooms.ts, the texts
// below) with whatever the admin changed on that box layered on top.
// Everything public — list, map, detail, PDF card — reads through here, so an
// edit in the admin shows up everywhere at once.

import { boxRooms, boxParking, type BoxRooms } from './boxRooms'
import type { Box } from './store'

export const DEFAULT_DESCRIPTION =
  'Moderní prostor pro vaše podnikání v Lelekovicích u Brna.\n\n' +
  'Dvoupodlažní jednotka chytře kombinuje praktické zázemí v přízemí a reprezentativní ' +
  'prostory v patře. Dole získáte variabilní sklad či výrobu s vlastním showroomem, ' +
  'nahoře pak světlou kancelář a komfortní administrativní zázemí pro váš tým i schůzky ' +
  's klienty.'

export const DEFAULT_EQUIPMENT = [
  'Energetická třída A',
  'Klimatizace',
  'Příprava na venkovní žaluzie',
  'Denní světlo ve skladu ze světlíku',
]

/** Shared site photos, used until a box gets photos of its own. */
export const DEFAULT_PHOTOS = {
  hero: '/assets/gallery/g5.jpg',
  about: '/assets/gallery/g3.jpg',
  card: ['/assets/gallery/g1.jpg', '/assets/gallery/g2.jpg', '/assets/gallery/g5.jpg'],
}

// Price = area × 65 000 Kč + parking spaces × 100 000 Kč, unless the admin
// set a fixed price.
export const PRICE_PER_M2 = 65000
export const PRICE_PER_PARKING = 100000

export function roomsOf(box: Box): BoxRooms | null {
  return box.content?.rooms ?? boxRooms(box.id)
}

/** Usable floor area across both floors, rounded to 0.1 m². */
export function areaOf(box: Box): number {
  const rooms = roomsOf(box)
  if (!rooms) return box.area
  return sumArea([...rooms.np1, ...rooms.np2])
}

export function sumArea(rows: { area: number | null }[]): number {
  return Math.round(rows.reduce((s, r) => s + (r.area ?? 0), 0) * 10) / 10
}

export function parkingOf(box: Box): number {
  return box.content?.parking ?? boxParking(box.id)
}

export function computedPrice(area: number, parking: number): number {
  return Math.round(area * PRICE_PER_M2 + parking * PRICE_PER_PARKING)
}

export function priceOf(box: Box): number {
  return box.content?.price ?? computedPrice(areaOf(box), parkingOf(box))
}

/** Description split into paragraphs (blank line = new paragraph). */
export function descriptionOf(box: Box): string[] {
  return (box.content?.description ?? DEFAULT_DESCRIPTION)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function equipmentOf(box: Box): string[] {
  return box.content?.equipment ?? DEFAULT_EQUIPMENT
}

/** The box's own photos, cover first. Empty when it has none. */
export function photosOf(box: Box): string[] {
  return box.content?.photos?.map((p) => p.url) ?? []
}
