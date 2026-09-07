/* ════════════════════════════════════════════════════════════════════════
   Park24 — rozbalovací standardy na detailu boxu

   Kategorie a jejich pořadí přebírají návrh z Figmy (frame „subpage",
   node 222:2423): Podlahy a povrchy / Vytápění a klimatizace / Osvětlení /
   Výbava / Doplňky. Návrh ukazuje jen zabalené řádky, obsah v něm není.

   ⚠️  TEXTY JSOU NÁVRH K REVIZI — nejsou potvrzené projektantem.
   Vychází z údajů, které už na webu jsou (pasivní energetický standard,
   energetická třída A, klimatizace, příprava na venkovní žaluzie, světlík
   ve skladu, světlé výšky z legendy místností). Zbytek je typový odhad pro
   halu tohoto druhu a před spuštěním ho musí potvrdit projektant.
   ════════════════════════════════════════════════════════════════════════ */

export type StandardGroup = {
  key: string
  title: string
  items: string[]
}

export const BOX_STANDARDS: StandardGroup[] = [
  {
    key: 'podlahy',
    title: 'Podlahy a povrchy',
    items: [
      'Skladová část: drátkobetonová deska s vsypem a povrchovým vytvrzením.',
      'Kanceláře a zázemí: připraveno pod finální nášlapnou vrstvu dle výběru klienta.',
      'Hygienické zázemí a úklidová komora: keramická dlažba včetně soklu.',
      'Stěny a stropy: vnitřní omítky s finálním bílým nátěrem.',
    ],
  },
  {
    key: 'vytapeni',
    title: 'Vytápění a klimatizace',
    items: [
      'Klimatizace v kancelářských prostorech — součást standardu.',
      'Samostatný zdroj tepla pro každou jednotku.',
      'Podlahové vytápění v kancelářích a zázemí, temperování skladové části.',
      'Nucené větrání zázemí a WC, samostatné podružné měření energií.',
    ],
  },
  {
    key: 'osvetleni',
    title: 'Osvětlení',
    items: [
      'Denní světlo ve skladové části ze střešního světlíku.',
      'Prosklené stěny v kancelářích a showroomu.',
      'LED osvětlení skladu, kanceláří i zázemí.',
      'Osvětlení parkovacích stání a vstupu do jednotky.',
    ],
  },
  {
    key: 'vybava',
    title: 'Výbava',
    items: [
      'Energetická třída A, celá hala v pasivním energetickém standardu.',
      'Vjezdová sekční vrata do skladové části s elektrickým pohonem.',
      'Samostatný vstup do kancelářské části.',
      'Kompletní hygienické zázemí v 1. NP i ve 2. NP.',
    ],
  },
  {
    key: 'doplnky',
    title: 'Doplňky',
    items: [
      'Příprava na venkovní žaluzie u prosklených ploch (kabeláž a kotvení).',
      'Příprava pro EZS a kamerový systém jednotky.',
      'Připravenost střechy pro instalaci fotovoltaiky.',
      'Sousední boxy lze propojit do jednoho většího celku — řešíme individuálně.',
    ],
  },
]
