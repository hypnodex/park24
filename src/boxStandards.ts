/* ════════════════════════════════════════════════════════════════════════
   Park24 — rozbalovací standardy na detailu boxu

   Kategorie a jejich pořadí přebírají návrh z Figmy (frame „subpage",
   node 222:2423): Podlahy a povrchy / Vytápění a klimatizace / Osvětlení /
   Výbava / Doplňky, doplněné o Konstrukci.

   Obsah je výtažek z dokumentu „Technická specifikace a standardy boxů"
   (standardy stavby.docx, 10/2026). Celé znění je v PDF Standardy boxu,
   které se exportuje z Figmy (viz scripts/standards-pdf/finalize.py) —
   při změně dokumentu upravte Figmu i tento soubor.
   ════════════════════════════════════════════════════════════════════════ */

export type StandardGroup = {
  key: string
  title: string
  items: string[]
}

export const BOX_STANDARDS: StandardGroup[] = [
  {
    key: 'konstrukce',
    title: 'Konstrukce',
    items: [
      'Box 11 × 22,3 m, celková výška objektu 8,20 m po atiku.',
      'Železobetonový prefabrikovaný skelet na vrtaných pilotách, stropy vestavby z předpjatých panelů SPIROLL.',
      'Obvodový plášť ze sendvičových panelů tl. 120 mm s jádrem PUR.',
      'Plochá střecha se zvýšenou atikou, tepelná izolace EPS 180 mm a minerální vlna 2× 30 mm.',
      'Světlá výška skladu 6 m po spodní hranu vazníků, administrativy 3,55 m (1. NP) a 3,30 m (2. NP).',
    ],
  },
  {
    key: 'podlahy',
    title: 'Podlahy a povrchy',
    items: [
      'Sklad a vjezd: drátkobetonová deska tl. 280 mm s únosností 8 000 kg/m² a metalickým vsypem.',
      'Showroom a zázemí v 1. NP: keramická dlažba 600 × 600 mm, v kancelářích 2. NP koberec.',
      'WC a předsíně: keramická dlažba a obklad do výšky 1 200 mm.',
      'Administrativa: sádrokartonové stěny a podhledy, bílá výmalba.',
      'Sklad bez podhledů — přiznaný trapézový plech.',
    ],
  },
  {
    key: 'vytapeni',
    title: 'Vytápění a klimatizace',
    items: [
      'Administrativa a showroom: klimatizační jednotky pro chlazení i vytápění, ovládání nástěnným termostatem.',
      'Dvě vnitřní jednotky v kancelářích, jedna v showroomu, venkovní jednotky na střeše.',
      'Sklad a vjezd: plynové teplovzdušné jednotky Sahara.',
      'Nucené větrání WC a úklidové komory, ostatní prostory větrány přirozeně.',
      'Ohřev teplé vody elektrickým bojlerem.',
    ],
  },
  {
    key: 'osvetleni',
    title: 'Osvětlení',
    items: [
      'LED svítidla v celém boxu a nouzové osvětlení.',
      'Denní světlo ve skladu ze 4 neotevíravých světlíků, v kuchyňce světlovod.',
      'Showroom se svítidly zapuštěnými do podhledu, kanceláře se zavěšenými LED svítidly.',
      'Hliníková okna v antracitové RAL 7016, otevíravá i neotevíravá.',
    ],
  },
  {
    key: 'vybava',
    title: 'Výbava',
    items: [
      'Sekční průmyslová vrata s elektrickým ovládáním a prosvětlovacími prvky.',
      'Prosklené hliníkové vstupní dveře, interiérové dveře CPL v šedé.',
      'Příkon 3× 40 A, zásuvková skříň ve skladu 2× 230 V / 16 A a 1× 400 V / 16 A.',
      'Datový rozvaděč ve 2. NP, zásuvky PC v administrativě.',
      'Kuchyňka s přípravou pro linku a spotřebiče, WC v 1. i 2. NP.',
    ],
  },
  {
    key: 'doplnky',
    title: 'Přípojky a doplňky',
    items: [
      'Vlastní přípojka kanalizace, vody, plynu a elektřiny pro každý box.',
      'Vlastní elektroměr, plynoměr na fasádě a podružný vodoměr.',
      'Dešťová voda odváděna do vsakovacích nádrží v areálu.',
      'Plochu lze zvětšit dodatečnou vestavbou nebo spojením dvou sousedních boxů.',
      'Kamerový a zabezpečovací systém není součástí standardu.',
    ],
  },
]
