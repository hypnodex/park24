import { useEffect, useMemo, useRef, useState } from 'react'
import './Admin.css'
import {
  STATUS_LABEL,
  formatCzk,
  isLoggedIn,
  login,
  logout,
  resetBoxes,
  useBoxes,
  useInquiries,
  type Box,
  type Inquiry,
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
  const [busy, setBusy] = useState(false)

  return (
    <div className="adm-shell adm-login-shell">
      <a href="/" className="adm-logo">
        <img src="/assets/logo_park24.svg" alt="Park24" />
      </a>
      <form
        className="adm-login"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          const ok = await login(pw)
          setBusy(false)
          if (ok) {
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
          disabled={busy}
        />
        {error && <div className="adm-error">{error}</div>}
        <button type="submit" className="adm-btn primary" disabled={busy}>
          {busy ? 'Ověřuji…' : 'Přihlásit'}
        </button>
        <a href="/" className="adm-link">← Zpět na web</a>
      </form>
      <div className="adm-hint">
        Výchozí heslo: <code>park24-admin</code> (změníte env <code>ADMIN_PASSWORD</code>)
      </div>
    </div>
  )
}

/* ───────── Dashboard ───────── */

type Tab = 'boxes' | 'inquiries'

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('boxes')

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

        <div className="adm-tabs">
          <button
            className={`adm-tab${tab === 'boxes' ? ' active' : ''}`}
            onClick={() => setTab('boxes')}
          >
            Správa boxů
          </button>
          <button
            className={`adm-tab${tab === 'inquiries' ? ' active' : ''}`}
            onClick={() => setTab('inquiries')}
          >
            Poptávky
          </button>
        </div>

        {tab === 'boxes' ? <BoxesTab /> : <InquiriesTab />}
      </main>
    </div>
  )
}

/* ───────── Boxes Tab ───────── */

function BoxesTab() {
  const { boxes, loading, update, refresh } = useBoxes()
  const [draft, setDraft] = useState<Box[]>(boxes)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

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

  async function saveAll() {
    setSaving(true)
    const ok = await update(draft)
    setSaving(false)
    if (ok) {
      setSavedAt(Date.now())
      setTimeout(() => setSavedAt(null), 2500)
    }
  }

  function discardAll() {
    setDraft(boxes)
  }

  async function resetToDefaults() {
    if (!confirm('Opravdu obnovit výchozí data všech 18 boxů?')) return
    setSaving(true)
    const fresh = await resetBoxes()
    setDraft(fresh)
    await refresh()
    setSaving(false)
  }

  useMemoSync(boxes, setDraft)

  if (loading) return <div className="adm-loading">Načítám data…</div>

  return (
    <>
      <p className="adm-sub">
        Změny se ukládají na server a okamžitě se promítnou na veřejný web pro všechny návštěvníky.
      </p>

      <div className="adm-summary">
        <SummaryCard label="Volné"        count={counts.volny}       tone="volny" />
        <SummaryCard label="Rezervované"  count={counts.rezervovano} tone="rezervovano" />
        <SummaryCard label="Prodané"      count={counts.prodano}     tone="prodano" />
        <SummaryCard label="Celkem boxů"  count={draft.length}       tone="total" />
      </div>

      <div className="adm-toolbar">
        <button className="adm-btn primary" onClick={saveAll} disabled={!dirty || saving}>
          {saving ? 'Ukládám…' : 'Uložit změny'}
        </button>
        <button className="adm-btn ghost" onClick={discardAll} disabled={!dirty || saving}>
          Zahodit změny
        </button>
        <button className="adm-btn ghost danger" onClick={resetToDefaults} disabled={saving}>
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
    </>
  )
}

/* ───────── Inquiries Tab ───────── */

function InquiriesTab() {
  const { inquiries, loading, remove } = useInquiries()

  if (loading) return <div className="adm-loading">Načítám poptávky…</div>

  if (inquiries.length === 0) {
    return (
      <div className="adm-empty">
        Zatím žádné poptávky.
      </div>
    )
  }

  return (
    <>
      <p className="adm-sub">
        Poptávky z rezervačního formuláře na veřejném webu. Celkem: {inquiries.length}
      </p>

      <div className="adm-table adm-table-inq" role="table" aria-label="Seznam poptávek">
        <div className="adm-tr adm-tr-head" role="row">
          <div role="columnheader">Datum</div>
          <div role="columnheader">Box</div>
          <div role="columnheader">Jméno</div>
          <div role="columnheader">Telefon</div>
          <div role="columnheader">E-mail</div>
          <div role="columnheader">Poznámka</div>
          <div role="columnheader"></div>
        </div>

        {[...inquiries].reverse().map((inq) => (
          <InquiryRow key={inq.id} inq={inq} onDelete={remove} />
        ))}
      </div>
    </>
  )
}

function InquiryRow({ inq, onDelete }: { inq: Inquiry; onDelete: (id: string) => Promise<boolean> }) {
  const [deleting, setDeleting] = useState(false)

  const date = new Date(inq.at)
  const formatted = date.toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  async function handleDelete() {
    if (!confirm(`Smazat poptávku od ${inq.name}?`)) return
    setDeleting(true)
    await onDelete(inq.id)
  }

  return (
    <div className="adm-tr" role="row">
      <div className="adm-cell adm-cell-date">{formatted}</div>
      <div className="adm-cell adm-cell-id">{inq.box}</div>
      <div className="adm-cell">{inq.name}</div>
      <div className="adm-cell">{inq.phone || '—'}</div>
      <div className="adm-cell">{inq.email || '—'}</div>
      <div className="adm-cell adm-cell-note">{inq.note || '—'}</div>
      <div className="adm-cell">
        <button
          className="adm-btn ghost danger adm-btn-sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '…' : 'Smazat'}
        </button>
      </div>
    </div>
  )
}

/* ───────── Shared ───────── */

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

function useMemoSync(boxes: Box[], setDraft: (b: Box[]) => void) {
  const ref = useRef<string>('')
  useEffect(() => {
    const sig = JSON.stringify(boxes)
    if (ref.current && ref.current !== sig) setDraft(boxes)
    ref.current = sig
  }, [boxes, setDraft])
}
