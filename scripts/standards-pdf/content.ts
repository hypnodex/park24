/* ════════════════════════════════════════════════════════════════════════
   Park24 — obsah PDF „Standardy boxu"

   Přepis dokumentu „Technická specifikace a standardy boxů Park 24
   Lelekovice" (standardy stavby.docx, 10/2026). Text je věrný předloze,
   upravená je jen typografie (pomlčky, mezery, jednotky) a zjevné překlepy.
   Výtažek pro rozbalovací standardy na webu je v src/boxStandards.ts —
   při změně dokumentu upravte oba soubory.
   ════════════════════════════════════════════════════════════════════════ */

export type Group = { title: string; items: string[] }
export type Param = { label: string; value: string; note?: string }
export type Room = { no: string; name: string; finish: string }

export const INTRO = [
  'Park 24 najdete v Lelekovicích v lokalitě Chmelníky, hned za sjezdem z rychlostní silnice R43 před vjezdem do samotné obce Lelekovice. Na tomto místě pro vás stavíme v první etapě 17 podnikatelských boxů, jejichž prostory mohou sloužit jako sklady či administrativa s obchodním a sociálním zázemím. Boxy mají svá parkovací místa a manipulační plochu.',
  'Zvolená lokalita na sever od Brna disponuje výbornou dostupností do samého centra města i napojením na hlavní dopravní tahy. Nedaleko boxů je vlaková zastávka trati Brno – Kuřim a také zastávka MHD.',
]

export const LAYOUT = [
  'Projekt je rozdělen do dvou řad hal: řada s označením A je orientovaná vstupem na západ, řada s označením B na východ. Haly jsou samostatné jednotky umístěné ve společné budově o 5–6 boxech.',
  'Část boxu je dvoupodlažní — obchodní a administrativní prostory s hygienickým zázemím. Část boxu je jednopodlažní, halová — sklad, drobná výroba, obchod. Užitnou plochu haly lze zvětšit dodatečnou vestavbou nebo spojením dvou samostatných boxů.',
]

/** C. Popis boxu — dispozice */
export const DISPOSITION: Param[] = [
  {
    label: '1. část — administrativa',
    value:
      'Dvoupodlažní vestavba s kancelářskými a obchodními prostorami (showroom) a hygienickým zázemím.',
  },
  {
    label: '2. část — sklad',
    value: 'Jednopodlažní halový prostor, dispozičně nerozdělený.',
  },
]

/** C. Popis boxu — rozměry */
export const PARAMS: Param[] = [
  { label: 'Rozměr boxu', value: '11 × 22,3 m' },
  { label: 'Celková výška objektu', value: '8,20 m', note: 'po atiku' },
  { label: 'Modulové rozměry', value: '(5,5 × 12 m) × 7,0 m', note: 'nosné sloupy 500 × 400 mm' },
  { label: 'Světlá výška — administrativa', value: '3,55 / 3,30 m', note: '1. NP / 2. NP' },
  {
    label: 'Světlá výška — sklad',
    value: '6,0 m',
    note: 'po spodní hranu vazníků, střecha v nejnižším místě 6,7 m',
  },
  { label: 'PENB', value: 'Třída A', note: 'mimořádně úsporná' },
]

/** D. Konstrukce a systémy objektu */
export const CONSTRUCTION: Group[] = [
  {
    title: 'Základy',
    items: ['Hlubinné založení pro ŽB skelet — vrtané piloty', 'Pro schodiště — základový pas'],
  },
  {
    title: 'Skeletový nosný systém',
    items: [
      'Železobetonový prefabrikovaný montovaný skelet',
      'Železobetonové prefabrikované vazníky',
      'Vestavba v 1. části — stropní konstrukce z předpjatých panelů SPIROLL',
    ],
  },
  {
    title: 'Střešní konstrukce',
    items: [
      'Plochá střecha ve spádu 3 % se zvýšenou atikou',
      'Odvodnění — okapový žlab v zadní části haly',
      'Střešní krytina — fólie tl. 1,5 mm',
      'Tepelná izolace z desek EPS tl. 180 mm a desek z minerální vlny 2× 30 mm na trapézovém plechu',
      'Nosný trapézový plech ve spádu (TR 150/280/1)',
    ],
  },
  {
    title: 'Obvodový plášť',
    items: [
      'Sendvičové panely tl. 120 mm (jádro PUR), barva dle architektonického řešení stavby',
    ],
  },
  {
    title: 'Podlahy',
    items: [
      'Sklad a vjezd — drátkobetonová deska tl. 280 mm s únosností 8 000 kg/m², finální povrch s metalickým vsypem',
      'Administrativa — cementový potěr; v 1. NP keramická dlažba 600 × 600 mm, v kancelářích 2. NP koberec, hygienické zázemí keramická dlažba 300 × 300 mm',
    ],
  },
  {
    title: 'Vnitřní příčky',
    items: [
      'Dělicí stěna mezi boxy — sendvičové panely tl. 100 mm s výplní z minerální vlny',
      'Sádrokartonové',
      'Zděné tl. 150 mm',
    ],
  },
  {
    title: 'Stropy',
    items: [
      'Sklad — bez podhledů, trapézový plech, stropní panely',
      'Administrativa — sádrokartonový podhled',
      'Hygienické zázemí — sádrokartonový podhled',
    ],
  },
  {
    title: 'Výplně otvorů',
    items: [
      'Okna — otevíravá i neotevíravá, hliníková, RAL 7016 (antracitová šedá)',
      'Vstupní dveře — hliníkové, prosklené, RAL 7016',
      'Interiérové dveře — plné, CPL šedé; ocelová nebo obložková zárubeň lakovaná, šedá',
      'Vrata — sekční průmyslová, výsuvná, elektricky ovládaná, RAL 7016, včetně prosvětlovacích prvků',
    ],
  },
  {
    title: 'Schodiště',
    items: [
      'Jednoramenné, zalomené, prefabrikované s mezipodestou, šířka ramene 1 190 mm, betonová konstrukce',
      'Zábradlí — ocelové, povrchová úprava, barva stříbrná RAL 9007',
    ],
  },
]

/** E. Technické vybavení, instalace */
export const TECHNICAL: Group[] = [
  {
    title: 'Vytápění',
    items: [
      'Administrativní prostory jsou vytápěny klimatizačními jednotkami',
      'Sklad a vjezd jsou vytápěny plynovými teplovzdušnými jednotkami Sahara',
      'Ohřev teplé vody elektrickým bojlerem',
    ],
  },
  {
    title: 'Vzduchotechnika, klimatizace',
    items: [
      'Dvě vnitřní klimatizační jednotky v administrativě, jedna v showroomu, ovládání nástěnným termostatem',
      'Venkovní jednotky na střeše zajišťují klimatizaci i vytápění showroomu a kanceláří',
      'Nucené větrání úklidových prostor a hygienického zázemí ventilátorem v podhledu',
      'Ostatní prostory větrány přirozeně — okny, vraty, otevíratelnými světlíky',
    ],
  },
  {
    title: 'Elektroinstalace, osvětlení',
    items: [
      'Instalovaný příkon boxu 3× 40 A (pojistky pro halu), v rozvaděči jištění 3× 25 A',
      'Rozvaděč boxu nástěnný, ve skladu — jištění světelných a zásuvkových obvodů, zásuvkových skříní, vrat a RACKu',
      'Datový rozvaděč ve skladu ve 2. NP',
      'Zásuvková skříň ve skladu — 2× 230 V / 16 A, 1× 400 V / 16 A',
      'V administrativě zapuštěné jednofázové zásuvky a zásuvky PC',
      'Osvětlení LED svítidly včetně kanceláří, nouzové osvětlení',
      'Kamerový a zabezpečovací systém není součástí standardu',
    ],
  },
]

/** F. Interiérové provedení jednotlivých místností */
export const ROOMS_NP1: Room[] = [
  {
    no: '1.01',
    name: 'Showroom',
    finish:
      'Keramická dlažba 600 × 600 mm, keramický sokl 100 mm, SDK, bílá výmalba, SDK podhled se zapuštěnými světly, dveře CPL s ocelovou zárubní v šedé, klimatizační jednotka.',
  },
  {
    no: '1.02',
    name: 'Úklidová komora',
    finish:
      'Keramická dlažba 600 × 600 mm, keramický obklad do výšky 1 200 mm, přisazená LED svítidla, dveře CPL s ocelovou zárubní v šedé, nucená ventilace, bílá výmalba.',
  },
  {
    no: '1.03',
    name: 'WC',
    finish:
      'Keramická dlažba 600 × 600 mm, keramický obklad 600 × 600 mm, SDK podhled, přisazená LED svítidla, dveře CPL s ocelovou zárubní v šedé, nucená ventilace — mřížka ve dveřích, bílá výmalba.',
  },
  {
    no: '1.04',
    name: 'Předsíň WC',
    finish:
      'Keramická dlažba 600 × 600 mm (šedá), keramický obklad 600 × 600 mm do výšky 1 200 mm, SDK podhled (v. 2 600 mm), přisazená svítidla, dveře CPL s ocelovou zárubní v šedé, nucená ventilace, bílá výmalba.',
  },
  {
    no: '1.05',
    name: 'Vjezd',
    finish:
      'Drátkobeton s metalickým vsypem, sendvičový panel, zavěšená LED svítidla, vstupní výsuvná vrata.',
  },
  {
    no: '1.06',
    name: 'Sklad',
    finish:
      'Drátkobeton s metalickým vsypem, sendvičový panel, LED svítidla přisazená ke žlabu s kabeláží, strop — přiznaná vlna trapézového plechu, 4× neotevíravý světlík.',
  },
  {
    no: '1.07',
    name: 'Schodiště',
    finish:
      'Prefabrikovaný železobeton, dlažba, SDK / štuková omítka, bílá výmalba, ocelové zábradlí v antracitu RAL 7016.',
  },
]

export const ROOMS_NP2: Room[] = [
  {
    no: '2.01',
    name: 'Kancelář',
    finish:
      'Koberec, soklová lišta z koberce, SDK, bílá výmalba, SDK podhled, zavěšená LED svítidla, 2× vnitřní klimatizační jednotka.',
  },
  {
    no: '2.02',
    name: 'Kuchyňka',
    finish:
      'Keramická dlažba 600 × 600 mm, SDK, keramický obklad, SDK podhled, příprava pro kuchyňskou linku a spotřebiče, světlovod, bílá výmalba.',
  },
  {
    no: '2.03',
    name: 'Předsíň WC',
    finish:
      'Keramická dlažba 600 × 600 mm, SDK, keramický obklad 600 × 600 mm do výšky 1 200 mm, SDK podhled, nucená ventilace, bílá výmalba.',
  },
  {
    no: '2.04',
    name: 'WC',
    finish:
      'Keramická dlažba 600 × 600 mm, SDK, keramický obklad 600 × 600 mm do výšky 1 200 mm, SDK podhled, nucená ventilace, bílá výmalba.',
  },
]

/** G. Napojení na inženýrské sítě */
export const UTILITIES = [
  'Každý box bude mít vlastní přípojku splaškové kanalizace, vody, plynu a elektřiny.',
  'Dešťové vody budou odváděny do vsakovacích nádrží umístěných na ploše areálu.',
  'Měření vody bude pro každý box zajištěno podružnými měřiči umístěnými v boxu.',
  'Fakturační plynoměr bude umístěn na fasádě každého boxu.',
  'Každý box bude osazen fakturačním elektroměrem, který dodá provozovatel lokální distribuční soustavy.',
]

export const CONTACT = {
  heading: 'Kontakt pro rezervaci',
  name: 'Ing. Ondřej Menšík',
  company: 'Esprit Living s.r.o.',
  phone: '+420 737 889 777',
  email: 'mensik@stemfire.cz',
}
