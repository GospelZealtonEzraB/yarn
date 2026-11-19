import { useState } from 'react'
import type { Plan } from '../agent/plan'
import { design, type Activity, type Send } from '../agent/run'
import { checkRequest, DEFAULT_MODEL, explain, OPENAI_URL, parseCheck, replyText, type CheckResult } from '../engine/coach'
import { projectsFor } from '../patterns/catalog'
import { STITCH_PATTERNS } from '../patterns/stitches'
import { settingsOf, useStore } from '../store'
import { PlanDetails } from '../ui/PlanDetails'

const KEY = 'loopwise.openai'
/** The app's own coach service, when one has been set up. With it, nobody needs a key. */
const SERVICE: string = import.meta.env.VITE_COACH_URL ?? ''
const read = (): { key: string; model: string } => {
  try { return { key: '', model: DEFAULT_MODEL, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { key: '', model: DEFAULT_MODEL } }
}
const stitchName = (id: string) => STITCH_PATTERNS.find((s) => s.id === id)?.name ?? (id === 'other' ? 'something else' : 'unclear')

/** Shrinks a photo before it is sent: faster, cheaper, and nothing larger than needed leaves the device. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 1024 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => reject(new Error('That file could not be opened as a picture.'))
    img.src = URL.createObjectURL(file)
  })
}

export function Coach({ openProject, openLesson }: { openProject: (id: string) => void; openLesson: (id: string) => void }) {
  const { state, set } = useStore()
  const [cfg, setCfg] = useState(read)
  const [mode, setMode] = useState<'design' | 'check'>('design')
  const [photo, setPhoto] = useState<string | null>(null)
  const [ask, setAsk] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<Activity[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const all = projectsFor(state.custom).filter((p) => p.build)
  const [projectId, setProjectId] = useState(() => (all.find((p) => (state.projects[p.id]?.step ?? 0) > 0) ?? all[0]).id)

  const save = (next: { key: string; model: string }) => {
    setCfg(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked: the key lasts until the page closes */ }
  }
  const clear = () => { setError(null); setPlan(null); setCheck(null); setLog([]) }
  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    clear()
    try { setPhoto(await shrink(file)) } catch (e) { setError((e as Error).message) }
  }

  /** One request to the model, through the app's service if there is one, otherwise with the knitter's own key. */
  const send: Send = async (body) => {
    let res: Response
    try {
      res = SERVICE && !cfg.key
        ? await fetch(SERVICE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(OPENAI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` }, body: JSON.stringify({ ...body, model: cfg.model || body.model }) })
    } catch { throw new Error('Could not reach the coach. Check your connection. Some previews of this app block outside services: use the installed app instead.') }
    const raw = await res.text()
    if (!res.ok) throw new Error(explain(res.status, raw))
    return JSON.parse(raw)
  }

  const runDesign = async () => {
    setBusy(true); clear()
    try {
      const made = await design({ request: ask, photo: photo ?? undefined }, state, send, (a) => setLog((l) => [...l, a]))
      setPlan({ ...made, photo: photo ?? undefined })
    }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const runCheck = async () => {
    if (!photo) return
    setBusy(true); clear()
    try {
      const project = all.find((p) => p.id === projectId)!
      const pattern = project.build!(settingsOf(state), state.styles[projectId] ?? project.styles?.[0])
      const at = Math.max((state.projects[projectId]?.step ?? 0) - 1, 0)
      // Judge the photo against the fabric the knitter is on: this step if it is knitting, otherwise the nearest knitting step.
      const step = pattern.steps.slice(at).find((st) => st.rows) ?? pattern.steps.slice(0, at).reverse().find((st) => st.rows) ?? pattern.steps[at]
      const fabric = step.chart ? STITCH_PATTERNS.find((s) => JSON.stringify(s.chart) === JSON.stringify(step.chart))?.name : undefined
      const res = await send(checkRequest({ project: project.name, step: step.title, stitchName: fabric ?? `the fabric described as: ${step.text.slice(0, 200)}`, construction: pattern.construction, stitches: pattern.castOn }, photo))
      setCheck(parseCheck(replyText(res)))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  const keep = () => {
    if (!plan) return
    const id = `custom-${Date.now().toString(36)}`
    set({ custom: [...state.custom, { id, plan }] })
    openProject(id)
  }

  if (!cfg.key && !SERVICE) return (
    <>
      <header className="top"><h1>Design coach</h1><p className="sub">Not switched on yet</p></header>
      <div className="callout drill">
        <b>The coach is waiting for a one-time setup</b>
        <p>Designing from a photo and checking your work use a paid AI service. Once the app's owner has set it up, it works here with nothing to enter.</p>
      </div>
      <section className="card">
        <h2>What it will do</h2>
        <p><b>Design it for me.</b> Show it a photo or describe what you want. It designs a pattern in your size, works out what you need to learn and buy, and writes any lessons the app is missing.</p>
        <p><b>Check my work.</b> Photograph your knitting and it points out likely mistakes, with a fix for each.</p>
      </section>
      <details className="howto">
        <summary>I have my own OpenAI key</summary>
        <label htmlFor="okey">OpenAI API key
          <input id="okey" type="password" autoComplete="off" placeholder="sk-…" onChange={(e) => e.target.value.trim().length > 20 && save({ ...cfg, key: e.target.value.trim() })} /></label>
        <p className="sub">Kept in this browser on this device only. A design costs more than a quick check, so set a monthly spending limit in your OpenAI account.</p>
      </details>
    </>
  )

  return (
    <>
      <header className="top"><h1>Design coach</h1><p className="sub">Show it what you want to make, or what you have made</p></header>
      <div className="seg">
        <button aria-pressed={mode === 'design'} onClick={() => { setMode('design'); clear() }}>Design it for me</button>
        <button aria-pressed={mode === 'check'} onClick={() => { setMode('check'); clear() }}>Check my work</button>
      </div>

      <section className="card">
        {mode === 'check' ? (
          <label htmlFor="cproj">What are you knitting?
            <select id="cproj" value={projectId} onChange={(e) => setProjectId(e.target.value)}>{all.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        ) : (
          <label htmlFor="cask">What do you want to make?
            <textarea id="cask" rows={3} value={ask} placeholder="A slouchy hat like the photo, but with a ribbed brim I can fold up" onChange={(e) => setAsk(e.target.value)} /></label>
        )}
        <div className="drop">
          {photo && <img src={photo} alt="The photo you chose" />}
          <b>{mode === 'check' ? 'A photo of your knitting' : 'A photo of what you want to make (optional)'}</b>
          <span className="sub">{mode === 'check' ? 'Lay it flat in daylight and fill the frame with stitches.' : 'A clear shot of the whole item works best.'}</span>
          <input id="cphoto" type="file" accept="image/*" aria-label="Choose a photo" onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </div>
        {mode === 'design'
          ? <button className="btn wide" disabled={busy || (!photo && ask.trim().length < 4)} onClick={runDesign}>{busy ? 'Designing…' : 'Design my pattern'}</button>
          : <button className="btn wide" disabled={busy || !photo} onClick={runCheck}>{busy ? 'Reading the photo…' : 'Scan this photo'}</button>}
        <p className="sub">{mode === 'design' ? 'Takes a few minutes: the designer drafts, test-knits and corrects before it answers. ' : ''}Your photo and request are sent to OpenAI to be read. This app does not store the photo.</p>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {log.length > 0 && (
        <section className="card" aria-live="polite">
          <h2>{busy ? 'The designer is working' : 'How the designer got there'}</h2>
          <ol className="activity">{log.map((a, i) => <li key={i} className={a.kind}>{a.text}</li>)}</ol>
        </section>
      )}

      {plan && (
        <>
          <header className="top"><h1>{plan.title}</h1></header>
          <PlanDetails plan={plan} openLesson={openLesson} />
          <section className="card">
            <h2>{plan.pieces.length > 1 ? `${plan.pieces.length} pieces to knit` : 'The pattern'}</h2>
            <p className="sub">Every row of every piece was test-knitted by the app's engine before you saw this.</p>
            {plan.pieces.map((piece) => (
              <details key={piece.name} className="more" open={plan.pieces.length === 1}>
                <summary><b>{piece.name}</b>{piece.quantity > 1 ? ` × ${piece.quantity}` : ''} · cast on {piece.cast_on}, {piece.construction === 'round' ? 'in the round' : 'flat'}</summary>
                <ol className="steps">{piece.sections.map((s) => <li key={s.title}><b>{s.title}.</b> {s.instructions}</li>)}</ol>
              </details>
            ))}
          </section>
          <button className="btn wide" onClick={keep}>Save and start building</button>
          <p className="sub">An AI designed this. The stitch counts are proven to fit together, but nobody has knitted it. Knit a swatch first and try the piece on as you go.</p>
        </>
      )}

      {check && (
        <section className="card" aria-live="polite">
          <h2>What the coach sees</h2>
          {!check.photoOk && <div className="callout warn"><b>The photo is hard to read</b><p>{check.photoAdvice || 'Try again closer up, in daylight.'}</p></div>}
          <p><b>Fabric:</b> {stitchName(check.fabricSeen)}. <b>Matches this step:</b> {check.matchesExpected}.</p>
          {check.issues.length === 0 && check.photoOk && <div className="callout ok"><b>No mistakes spotted</b><p>That does not prove there are none. Count your stitches to be sure.</p></div>}
          {check.issues.map((i) => (
            <div key={i.problem} className="callout warn">
              <b>{i.problem}</b>
              {i.where && <p><span className="tag">Where</span> {i.where}</p>}
              {i.fix && <p><span className="tag">Fix</span> {i.fix}</p>}
              <p className="tag">The coach is {i.confidence === 'high' ? 'fairly sure' : i.confidence === 'medium' ? 'not certain' : 'guessing'}</p>
            </div>
          ))}
          {check.goingWell.length > 0 && <div className="callout ok"><b>Going well</b>{check.goingWell.map((g) => <p key={g}>{g}</p>)}</div>}
          {check.next && <p><b>Next:</b> {check.next}</p>}
          <p className="sub">An AI read this photo and can be wrong. Treat it as a second pair of eyes, not a verdict.</p>
        </section>
      )}

      {cfg.key && (
        <details className="howto">
          <summary>Key and model settings</summary>
          <label htmlFor="omodel">Model
            <input id="omodel" value={cfg.model} onChange={(e) => save({ ...cfg, model: e.target.value.trim() })} spellCheck={false} /></label>
          <button className="chip" onClick={() => { save({ key: '', model: cfg.model }); setPhoto(null); clear() }}>Remove the key from this device</button>
        </details>
      )}
    </>
  )
}
