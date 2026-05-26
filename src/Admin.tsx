import { useEffect, useMemo, useRef, useState } from 'react'
import './Admin.css'
import {
  ADMIN_PASSWORD,
  STATUS_LABEL,
  formatCzk,
  isLoggedIn,
  login,
  logout,
  resetBoxes,
  useBoxes,
  type Box,
  type Status,
} from './store'

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(() => isLoggedIn())

  if (!authed) return <LoginGate onSuccess={() => setAuthed(true)} />
  return <Dashboard onLogout={() => { logout(); setAuthed(false) }} />
}

/* ───────── Login ───────── */

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="adm-shell adm-login-shell">
      <a href="/" className="adm-logo">
        <img src="/assets/logo_park24.svg" alt="Park24" />
      </a>
      <form
        className="adm-login"
        onSubmit={(e) => {
          e.preventDefault()
          if (login(pw)) {
            setError(null)
            onSuccess()
          } else {
            setError('Špatné heslo')
          }
        }}
      >
        <div className="adm-eyebrow">Admin</div>
        <h1>Přihlášení</h1>
        <p className="adm-sub">Zadejte heslo pro správu boxů.</p>
        <input
          type="password"
          autoFocus
          placeholder="Heslo"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          aria-label="Heslo"
        />
        {error && <div className="adm-error">{error}</div>}
        <button type="submit" className="adm-btn primary">
          Přihlásit
        </button>
        <a href="/" className="adm-link">← Zpět na web</a>
      </form>
      <div className="adm-hint">
        Výchozí heslo: <code>{ADMIN_PASSWORD}</code> (změníte v <code>src/store.ts</code>)
      </div>
    </div>
  )
}

/* ───────── Dashboard ───────── */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [boxes, setBoxes] = useBoxes()
  const [draft, setDraft] = useState<Box[]>(boxes)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(boxes),
    [draft, boxes],
  )

  const counts = useMemo(() => {
    const c = { volny: 0, rezervovano: 0, prodano: 0 } as Record<Status, number>
    draft.forEach((b) => { c[b.status]++ })
    return c
  }, [draft])

  function updateBox(idx: number, patch: Partial<Box>) {
    setDraft((d) => d.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }

  function saveAll() {
    setBoxes(draft)
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 2500)
  }

  function discardAll() {
    setDraft(boxes)
  }

  function resetToDefaults() {
    if (!confirm('Opravdu obnovit výchozí data všech 12 boxů?')) return
    resetBoxes()
    // useBoxes hook listens on the event; draft sync happens via effect below
    setTimeout(() => {
      const fresh = JSON.parse(localStorage.getItem('park24.boxes.v1') || 'null')
      if (!fresh) {
        // resetBoxes removed the key, defaults will be returned by loadBoxes via useBoxes
        // but our local draft needs to be set from the new `boxes` ref next render
      }
    }, 0)
  }

  // Whenever boxes (external) changes (e.g. resetBoxes), reset draft
  // unless user has unsaved local changes.
  useMemoSync(boxes, setDraft)

  return (
    <div className="adm-shell adm-dash">
      <header className="adm-header">
        <a href="/" className="adm-logo">
          <img src="/assets/logo_park24.svg" alt="Park24" />
        </a>
        <div className="adm-header-right">
          <a href="/" className="adm-link">Veřejný web →</a>
          <button onClick={onLogout} className="adm-btn ghost">Odhlásit</button>
        </div>
      </header>

      <main className="adm-main">
        <div className="adm-eyebrow">Administrace</div>
        <h1>Správa boxů</h1>
        <p className="adm-sub">
          Změny se ukládají do prohlížeče a okamžitě se promítnou na veřejný web (stejný počítač / stejný prohlížeč).
        </p>

        <div className="adm-summary">
          <SummaryCard label="Volné"        count={counts.volny}       tone="volny" />
          <SummaryCard label="Rezervované"  count={counts.rezervovano} tone="rezervovano" />
          <SummaryCard label="Prodané"      count={counts.prodano}     tone="prodano" />
          <SummaryCard label="Celkem boxů"  count={draft.length}       tone="total" />
        </div>

        <div className="adm-toolbar">
          <button className="adm-btn primary" onClick={saveAll} disabled={!dirty}>
            Uložit změny
          </button>
          <button className="adm-btn ghost" onClick={discardAll} disabled={!dirty}>
            Zahodit změny
          </button>
          <button className="adm-btn ghost danger" onClick={resetToDefaults}>
            Obnovit výchozí
          </button>
          {savedAt && <span className="adm-saved">Uloženo ✓</span>}
          {dirty && !savedAt && <span className="adm-dirty">Máte neuložené změny</span>}
        </div>

        <div className="adm-table" role="table" aria-label="Seznam boxů">
          <div className="adm-tr adm-tr-head" role="row">
            <div role="columnheader">Box</div>
            <div role="columnheader">Stav</div>
            <div role="columnheader">Plocha (m²)</div>
            <div role="columnheader">Cena (Kč/měs.)</div>
            <div role="columnheader">Náhled</div>
          </div>

          {draft.map((b, i) => (
            <div className={`adm-tr adm-tr-${b.status}`} key={b.id} role="row">
              <div className="adm-cell adm-cell-id">{b.id}</div>

              <div className="adm-cell">
                <select
                  className="adm-select"
                  value={b.status}
                  onChange={(e) => updateBox(i, { status: e.target.value as Status })}
                >
                  {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>

              <div className="adm-cell">
                <input
                  type="number"
                  className="adm-input"
                  value={b.area}
                  min={1}
                  step={1}
                  onChange={(e) => updateBox(i, { area: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="adm-cell">
                <input
                  type="number"
                  className="adm-input"
                  value={b.price}
                  min={0}
                  step={100}
                  onChange={(e) => updateBox(i, { price: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="adm-cell adm-cell-preview">
                <span className={`adm-badge adm-badge-${b.status}`}>
                  {b.status === 'volny' && <span className="dot" />}
                  {STATUS_LABEL[b.status]}
                </span>
                <span className="adm-preview-meta">
                  {b.area} m² · {formatCzk(b.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function SummaryCard({
  label, count, tone,
}: {
  label: string
  count: number
  tone: 'volny' | 'rezervovano' | 'prodano' | 'total'
}) {
  return (
    <div className={`adm-summary-card adm-tone-${tone}`}>
      <div className="adm-summary-num">{count}</div>
      <div className="adm-summary-label">{label}</div>
    </div>
  )
}

/* Sync draft when external `boxes` changes (e.g. after reset). */
function useMemoSync(boxes: Box[], setDraft: (b: Box[]) => void) {
  const ref = useRef<string>('')
  useEffect(() => {
    const sig = JSON.stringify(boxes)
    if (ref.current && ref.current !== sig) setDraft(boxes)
    ref.current = sig
  }, [boxes, setDraft])
}
