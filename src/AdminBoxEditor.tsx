import { useEffect, useMemo, useRef, useState } from 'react'
import { boxParking, boxRooms, type BoxRooms } from './boxRooms'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_EQUIPMENT,
  PRICE_PER_M2,
  PRICE_PER_PARKING,
  computedPrice,
  equipmentOf,
  parkingOf,
  photosOf,
  roomsOf,
} from './boxData'
import { navigate } from './router'
import {
  STATUS_LABEL,
  formatCzk,
  saveBoxContent,
  uploadBoxPhoto,
  useBoxes,
  type Box,
  type BoxContent,
  type Status,
} from './store'

/**
 * Admin page for one box: status, photos, price and parking, description,
 * equipment and the room table. Nothing is stored until "Uložit"; fields that
 * end up equal to the project default are not stored at all, so the box keeps
 * following later fixes to the drawings and texts.
 */

type Floor = 'np1' | 'np2'
/** Room row while editing — area as typed, so "29," doesn't snap back. */
type RoomRow = { code: string; name: string; sv: string; area: string }

type Draft = {
  status: Status
  photos: string[]
  /** '' = price computed from area and parking */
  price: string
  parking: string
  description: string
  equipment: string[]
  rooms: Record<Floor, RoomRow[]>
}

const FLOORS: { key: Floor; label: string }[] = [
  { key: 'np1', label: '1. NP' },
  { key: 'np2', label: '2. NP' },
]

const fmtArea = (n: number) => n.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })

/** "29,5" / "29.5" / " 29 " → number; '' or junk → null */
function parseNum(s: string): number | null {
  const t = s.replace(/\s/g, '').replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function roomsToRows(rooms: BoxRooms | null): Record<Floor, RoomRow[]> {
  const rows = (list: BoxRooms['np1'] = []) =>
    list.map((r) => ({ ...r, area: r.area == null ? '' : String(r.area).replace('.', ',') }))
  return { np1: rows(rooms?.np1), np2: rows(rooms?.np2) }
}

function rowsToRooms(rows: Record<Floor, RoomRow[]>): BoxRooms {
  const list = (r: RoomRow[]) =>
    r.map((x) => ({ code: x.code.trim(), name: x.name.trim(), sv: x.sv, area: parseNum(x.area) }))
  return { np1: list(rows.np1), np2: list(rows.np2) }
}

function toDraft(box: Box): Draft {
  return {
    status: box.status,
    photos: photosOf(box),
    price: box.content?.price != null ? String(box.content.price) : '',
    parking: String(parkingOf(box)),
    description: box.content?.description ?? DEFAULT_DESCRIPTION,
    equipment: [...equipmentOf(box)],
    rooms: roomsToRows(roomsOf(box)),
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Only what differs from the project defaults. */
function toContent(id: string, d: Draft): BoxContent {
  const content: BoxContent = {}
  const description = d.description.trim()
  if (description && description !== DEFAULT_DESCRIPTION) content.description = description

  const equipment = d.equipment.map((e) => e.trim()).filter(Boolean)
  if (equipment.length && !same(equipment, DEFAULT_EQUIPMENT)) content.equipment = equipment

  if (d.photos.length) content.photos = d.photos.map((url) => ({ url }))

  const price = parseNum(d.price)
  if (price != null && price > 0) content.price = Math.round(price)

  const parking = parseNum(d.parking)
  if (parking != null && Number.isInteger(parking) && parking !== boxParking(id)) content.parking = parking

  const rooms = rowsToRooms(d.rooms)
  if (!same(rooms, boxRooms(id))) content.rooms = rooms

  return content
}

export default function AdminBoxEditor({ id }: { id: string }) {
  const { boxes, loading, update, setLocal } = useBoxes()
  const box = boxes.find((b) => b.id === id)

  // Unsaved edits; null = nothing edited, the form shows what is saved.
  const [edited, setEdited] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const saved = useMemo(() => (box ? toDraft(box) : null), [box])
  const draft = edited ?? saved
  const dirty = !!edited && !!saved && !same(edited, saved)

  // Leaving with unsaved edits (tab close / reload) asks first.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    document.title = `Box ${id} — Admin Park24`
    return () => { document.title = 'Park24' }
  }, [id])

  function back(e: React.MouseEvent) {
    e.preventDefault()
    if (dirty && !confirm('Máte neuložené změny. Opravdu odejít bez uložení?')) return
    navigate('/admin')
  }

  if (loading && !box) return <div className="adm-loading">Načítám box…</div>
  if (!box) {
    return (
      <div className="adm-empty">
        Box „{id}" neexistuje. <a href="/admin" onClick={back}>Zpět na seznam</a>
      </div>
    )
  }
  if (!draft) return null

  const set = (patch: Partial<Draft>) => setEdited((d) => ({ ...(d ?? draft), ...patch }))

  const area = Math.round(
    [...draft.rooms.np1, ...draft.rooms.np2].reduce((s, r) => s + (parseNum(r.area) ?? 0), 0) * 10,
  ) / 10
  const parkingNum = parseNum(draft.parking)
  const parkingValid = parkingNum != null && Number.isInteger(parkingNum) && parkingNum >= 0 && parkingNum <= 50
  const autoPrice = computedPrice(area, parkingValid ? parkingNum : 0)
  const priceNum = parseNum(draft.price)
  const priceValid = draft.price.trim() === '' || (priceNum != null && priceNum > 0)
  const finalPrice = draft.price.trim() && priceValid ? Math.round(priceNum!) : autoPrice
  const canSave = dirty && !saving && !upload && parkingValid && priceValid

  async function save() {
    if (!box || !draft) return
    setSaving(true)
    setMessage(null)
    const content = await saveBoxContent(box.id, toContent(box.id, draft))
    if (!content) {
      setSaving(false)
      setMessage({ tone: 'error', text: 'Uložení se nepovedlo. Zkuste to znovu, případně se znovu přihlaste.' })
      return
    }
    const withContent = boxes.map((b) => (b.id === box.id ? { ...b, content } : b))
    let next = withContent
    let statusFailed = false
    if (draft.status !== box.status) {
      // The status lives in the box list, saved through its own endpoint.
      next = withContent.map((b) => (b.id === box.id ? { ...b, status: draft.status } : b))
      if (!(await update(next))) {
        statusFailed = true
        next = withContent
        setLocal(withContent)
      }
    } else {
      setLocal(withContent)
    }
    setSaving(false)
    const fresh = next.find((b) => b.id === box.id)!
    setEdited(statusFailed ? { ...toDraft(fresh), status: draft.status } : null)
    setMessage(
      statusFailed
        ? { tone: 'error', text: 'Obsah je uložený, ale stav boxu se uložit nepodařilo. Zkuste to znovu.' }
        : { tone: 'ok', text: 'Uloženo. Změny už jsou na webu.' },
    )
  }

  async function addPhotos(files: FileList | File[]) {
    if (!box) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setMessage(null)
    setUpload({ done: 0, total: list.length })
    let failed = 0
    for (const file of list) {
      try {
        const url = await uploadBoxPhoto(box.id, file)
        setEdited((d) => {
          const base = d ?? draft!
          return { ...base, photos: [...base.photos, url] }
        })
      } catch {
        failed++
      }
      setUpload((u) => (u ? { ...u, done: u.done + 1 } : u))
    }
    setUpload(null)
    if (failed) {
      setMessage({
        tone: 'error',
        text: `${failed} z ${list.length} fotek se nepodařilo nahrát. Formát HEIC z iPhonu umí zpracovat jen Safari — v jiném prohlížeči ho převeďte na JPG.`,
      })
    }
  }

  function movePhoto(from: number, to: number) {
    if (!draft || to < 0 || to >= draft.photos.length) return
    const photos = [...draft.photos]
    const [p] = photos.splice(from, 1)
    photos.splice(to, 0, p)
    set({ photos })
  }

  function setRoom(floor: Floor, i: number, patch: Partial<RoomRow>) {
    if (!draft) return
    set({ rooms: { ...draft.rooms, [floor]: draft.rooms[floor].map((r, j) => (j === i ? { ...r, ...patch } : r)) } })
  }

  function addRoom(floor: Floor) {
    if (!draft) return
    const prefix = floor === 'np1' ? '1' : '2'
    const code = `${prefix}.${String(draft.rooms[floor].length + 1).padStart(2, '0')}`
    set({ rooms: { ...draft.rooms, [floor]: [...draft.rooms[floor], { code, name: '', sv: '', area: '' }] } })
  }

  function removeRoom(floor: Floor, i: number) {
    if (!draft) return
    set({ rooms: { ...draft.rooms, [floor]: draft.rooms[floor].filter((_, j) => j !== i) } })
  }

  return (
    <div className="adm-editor">
      <a href="/admin" className="adm-link adm-back" onClick={back}>← Zpět na seznam boxů</a>

      <div className="adm-editor-head">
        <div>
          <div className="adm-eyebrow">Detail boxu</div>
          <h1>Box {box.id}</h1>
        </div>
        <a href={`/box/${box.id}`} target="_blank" rel="noreferrer" className="adm-btn ghost">
          Zobrazit na webu ↗
        </a>
      </div>

      {/* ── Stav ─────────────────────────────────────────────── */}
      <section className="adm-card">
        <h2>Stav</h2>
        <div className="adm-status-pick" role="radiogroup" aria-label="Stav boxu">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={draft.status === s}
              className={`adm-badge adm-badge-${s}${draft.status === s ? ' picked' : ''}`}
              onClick={() => set({ status: s })}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>

      {/* ── Fotky ────────────────────────────────────────────── */}
      <section
        className="adm-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
      >
        <h2>Fotky</h2>
        <p className="adm-hint">
          1. fotka je titulní (záhlaví detailu boxu), 2. je u popisu a první tři jsou v PDF kartě.
          Na webu se všechny ukážou v galerii. Fotky můžete i přetáhnout sem.
        </p>

        {draft.photos.length === 0 && (
          <p className="adm-note">
            Box zatím nemá vlastní fotky — na webu se ukazují společné fotky areálu.
          </p>
        )}

        <div className="adm-photos">
          {draft.photos.map((url, i) => (
            <figure key={url} className="adm-photo">
              <img src={url} alt={`Fotka ${i + 1}`} loading="lazy" />
              {i === 0 && <span className="adm-photo-cover">Titulní</span>}
              <figcaption>
                <button type="button" onClick={() => movePhoto(i, i - 1)} disabled={i === 0} aria-label="Posunout doleva">←</button>
                <button type="button" onClick={() => movePhoto(i, i + 1)} disabled={i === draft.photos.length - 1} aria-label="Posunout doprava">→</button>
                {i > 0 && (
                  <button type="button" onClick={() => movePhoto(i, 0)}>Titulní</button>
                )}
                <button
                  type="button"
                  className="danger"
                  onClick={() => set({ photos: draft.photos.filter((p) => p !== url) })}
                >
                  Smazat
                </button>
              </figcaption>
            </figure>
          ))}

          <button
            type="button"
            className="adm-photo-add"
            onClick={() => fileInput.current?.click()}
            disabled={!!upload}
          >
            {upload ? `Nahrávám ${Math.min(upload.done + 1, upload.total)} z ${upload.total}…` : '+ Přidat fotky'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addPhotos(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      {/* ── Parametry ────────────────────────────────────────── */}
      <section className="adm-card">
        <h2>Parametry</h2>
        <div className="adm-fields">
          <label className="adm-field">
            <span>Cena bez DPH (Kč)</span>
            <input
              className="adm-input"
              inputMode="numeric"
              placeholder={autoPrice.toLocaleString('cs-CZ')}
              value={draft.price}
              onChange={(e) => set({ price: e.target.value })}
              aria-invalid={!priceValid}
            />
            <small>
              {draft.price.trim()
                ? priceValid ? 'Vlastní cena. Vymažte pole a cena se zase bude počítat sama.' : 'Zadejte kladné číslo.'
                : `Počítá se sama: ${fmtArea(area)} m² × ${PRICE_PER_M2.toLocaleString('cs-CZ')} Kč + ${parkingValid ? parkingNum : '?'} × ${PRICE_PER_PARKING.toLocaleString('cs-CZ')} Kč.`}
            </small>
          </label>

          <label className="adm-field">
            <span>Parkovací stání</span>
            <input
              className="adm-input"
              inputMode="numeric"
              value={draft.parking}
              onChange={(e) => set({ parking: e.target.value })}
              aria-invalid={!parkingValid}
            />
            <small>{parkingValid ? `Podle projektu: ${boxParking(box.id)}` : 'Zadejte celé číslo 0–50.'}</small>
          </label>

          <div className="adm-field">
            <span>Plocha</span>
            <div className="adm-readout">{fmtArea(area)} m²</div>
            <small>Součet místností níže.</small>
          </div>
        </div>
        <div className="adm-result">
          Na webu: <strong>{formatCzk(finalPrice)}</strong> · {fmtArea(area)} m² · {parkingValid ? parkingNum : '?'}× parkování
        </div>
      </section>

      {/* ── Popis ────────────────────────────────────────────── */}
      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Popis</h2>
          {draft.description !== DEFAULT_DESCRIPTION && (
            <button type="button" className="adm-btn ghost adm-btn-sm" onClick={() => set({ description: DEFAULT_DESCRIPTION })}>
              Vrátit výchozí text
            </button>
          )}
        </div>
        <p className="adm-hint">Odstavce oddělte prázdným řádkem.</p>
        <textarea
          className="adm-input adm-textarea"
          rows={8}
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </section>

      {/* ── Výbava ───────────────────────────────────────────── */}
      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Výbava</h2>
          {!same(draft.equipment, DEFAULT_EQUIPMENT) && (
            <button type="button" className="adm-btn ghost adm-btn-sm" onClick={() => set({ equipment: [...DEFAULT_EQUIPMENT] })}>
              Vrátit výchozí
            </button>
          )}
        </div>
        <p className="adm-hint">Body se zatržítkem v sekci „Výbava &amp; Standardy".</p>
        <div className="adm-list">
          {draft.equipment.map((item, i) => (
            <div className="adm-list-row" key={i}>
              <input
                className="adm-input"
                value={item}
                onChange={(e) => set({ equipment: draft.equipment.map((x, j) => (j === i ? e.target.value : x)) })}
                aria-label={`Položka výbavy ${i + 1}`}
              />
              <button
                type="button"
                className="adm-btn ghost danger adm-btn-sm"
                onClick={() => set({ equipment: draft.equipment.filter((_, j) => j !== i) })}
                aria-label="Odebrat položku"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="adm-btn ghost adm-btn-sm" onClick={() => set({ equipment: [...draft.equipment, ''] })}>
          + Přidat položku
        </button>
      </section>

      {/* ── Místnosti ────────────────────────────────────────── */}
      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Místnosti a plochy</h2>
          {!same(rowsToRooms(draft.rooms), boxRooms(box.id)) && (
            <button
              type="button"
              className="adm-btn ghost adm-btn-sm"
              onClick={() => set({ rooms: roomsToRows(boxRooms(box.id)) })}
            >
              Vrátit podle projektu
            </button>
          )}
        </div>
        <p className="adm-hint">Tabulky v sekci „Půdorysy a rozměry" a v PDF kartě. Celková plocha i cena se z nich počítají.</p>

        <div className="adm-rooms">
          {FLOORS.map(({ key, label }) => (
            <div key={key}>
              <h3>{label}</h3>
              <div className="adm-room adm-room-head">
                <span>č.</span>
                <span>Místnost</span>
                <span>m²</span>
                <span />
              </div>
              {draft.rooms[key].map((r, i) => (
                <div className="adm-room" key={i}>
                  <input className="adm-input" value={r.code} onChange={(e) => setRoom(key, i, { code: e.target.value })} aria-label="Číslo místnosti" />
                  <input className="adm-input" value={r.name} onChange={(e) => setRoom(key, i, { name: e.target.value })} aria-label="Název místnosti" />
                  <input
                    className="adm-input"
                    inputMode="decimal"
                    value={r.area}
                    onChange={(e) => setRoom(key, i, { area: e.target.value })}
                    aria-label="Plocha v m²"
                    aria-invalid={r.area.trim() !== '' && parseNum(r.area) == null}
                  />
                  <button type="button" className="adm-btn ghost danger adm-btn-sm" onClick={() => removeRoom(key, i)} aria-label="Odebrat místnost">
                    ✕
                  </button>
                </div>
              ))}
              <div className="adm-room-foot">
                <button type="button" className="adm-btn ghost adm-btn-sm" onClick={() => addRoom(key)}>
                  + Přidat místnost
                </button>
                <span>
                  Celkem {fmtArea(Math.round(draft.rooms[key].reduce((s, r) => s + (parseNum(r.area) ?? 0), 0) * 10) / 10)} m²
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Save bar ─────────────────────────────────────────── */}
      <div className="adm-savebar">
        <button type="button" className="adm-btn primary" onClick={save} disabled={!canSave}>
          {saving ? 'Ukládám…' : 'Uložit změny'}
        </button>
        <button type="button" className="adm-btn ghost" onClick={() => setEdited(null)} disabled={!dirty || saving}>
          Zahodit změny
        </button>
        {message && <span className={message.tone === 'ok' ? 'adm-saved' : 'adm-dirty'}>{message.text}</span>}
        {!message && dirty && <span className="adm-dirty">Máte neuložené změny</span>}
      </div>
    </div>
  )
}
