import { useState } from 'react'
import { checkRequest, closestProject, DEFAULT_MODEL, explain, identifyRequest, OPENAI_URL, parseCheck, parseIdentify, type CheckResult, type IdentifyResult } from '../engine/coach'
import { PROJECTS } from '../patterns/catalog'
import { STITCH_PATTERNS, stitchPattern } from '../patterns/stitches'
import { settingsOf, useStore } from '../store'

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

export function Coach({ openProject }: { openProject: (id: string) => void }) {
  const { state, set } = useStore()
  const [cfg, setCfg] = useState(read)
  const [mode, setMode] = useState<'check' | 'identify'>('check')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [found, setFound] = useState<IdentifyResult | null>(null)
  const makeable = PROJECTS.filter((p) => p.build)
  const [projectId, setProjectId] = useState(() => (makeable.find((p) => (state.projects[p.id]?.step ?? 0) > 0) ?? makeable[0]).id)

  const save = (next: { key: string; model: string }) => {
    setCfg(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked: the key lasts until the page closes */ }
  }
  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    setError(null); setCheck(null); setFound(null)
    try { setPhoto(await shrink(file)) } catch (e) { setError((e as Error).message) }
  }

  const scan = async () => {
    if (!photo) return
    setBusy(true); setError(null); setCheck(null); setFound(null)
    try {
      const project = PROJECTS.find((p) => p.id === projectId)!
      const style = state.styles[projectId] ?? project.styles?.[0]
      const pattern = project.build!(settingsOf(state), style)
      const saved = state.projects[projectId] ?? { step: 0, count: 0 }
      // Judge the photo against the fabric the knitter is on: this step if it is knitting, otherwise the next knitting step.
      const at = Math.max(saved.step - 1, 0)
      const step = pattern.steps.slice(at).find((st) => st.chart) ?? pattern.steps.slice(0, at).reverse().find((st) => st.chart) ?? pattern.steps[at]
      const body = mode === 'check'
        ? checkRequest({ project: project.name, step: step.title, stitchName: step.chart ? STITCH_PATTERNS.find((s) => JSON.stringify(s.chart) === JSON.stringify(step.chart))?.name ?? 'the pattern stitch' : 'not a fabric step', construction: pattern.construction, stitches: pattern.castOn }, photo, cfg.model)
        : identifyRequest(photo, cfg.model)
      let res: Response
      try {
        res = SERVICE && !cfg.key
          ? await fetch(SERVICE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          : await fetch(OPENAI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` }, body: JSON.stringify(body) })
      } catch { throw new Error('Could not reach the coach. Check your connection. Some previews of this app block outside services: use the installed app instead.') }
      const raw = await res.text()
      if (!res.ok) throw new Error(explain(res.status, raw))
      const reply = JSON.parse(raw).choices?.[0]?.message?.content ?? ''
      if (mode === 'check') setCheck(parseCheck(reply)); else setFound(parseIdentify(reply))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  const match = found && closestProject(found, Object.fromEntries(PROJECTS.map((p) => [p.id, p.styles])))
  const start = () => {
    if (!match) return
    if (match.style) set({ styles: { ...state.styles, [match.project]: match.style } })
    openProject(match.project)
  }

  return (
    <>
      <header className="top">
        <h1>Photo coach</h1>
        <p className="sub">Show it a photo, get the next move</p>
      </header>

      {!cfg.key && !SERVICE ? (
        <>
          <div className="callout drill">
            <b>The coach is not switched on yet</b>
            <p>Reading photos uses a paid AI service. It is waiting for a one-time setup by the app's owner, after which it works here with nothing to enter.</p>
          </div>
          <section className="card">
            <h2>What it will do</h2>
            <p><b>Check my work.</b> Photograph your knitting and it points out likely mistakes, with a fix for each.</p>
            <p><b>Knit from a photo.</b> Show it a scarf, hat or mitts you like and it finds the closest pattern in the app.</p>
          </section>
          <details className="howto">
            <summary>I have my own OpenAI key</summary>
            <label htmlFor="okey">OpenAI API key
              <input id="okey" type="password" autoComplete="off" placeholder="sk-…" onChange={(e) => e.target.value.trim().length > 20 && save({ ...cfg, key: e.target.value.trim() })} /></label>
            <p className="sub">Kept in this browser on this device only. Each scan costs a small amount on your OpenAI account, so set a monthly spending limit there.</p>
          </details>
        </>
      ) : (
        <>
          <div className="seg">
            <button aria-pressed={mode === 'check'} onClick={() => { setMode('check'); setFound(null); setCheck(null) }}>Check my work</button>
            <button aria-pressed={mode === 'identify'} onClick={() => { setMode('identify'); setFound(null); setCheck(null) }}>Knit from a photo</button>
          </div>

          <section className="card">
            {mode === 'check' && (
              <label htmlFor="cproj">What are you knitting?
                <select id="cproj" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {makeable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></label>
            )}
            <div className="drop">
              {photo && <img src={photo} alt="The photo you chose" />}
              <b>{mode === 'check' ? 'A photo of your knitting' : 'A photo of something you want to make'}</b>
              <span className="sub">{mode === 'check' ? 'Lay it flat in daylight and fill the frame with stitches.' : 'A clear shot of the whole item works best.'}</span>
              <input id="cphoto" type="file" accept="image/*" aria-label="Choose a photo" onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </div>
            <button className="btn wide" disabled={!photo || busy} onClick={scan}>{busy ? 'Reading the photo…' : 'Scan this photo'}</button>
            <p className="sub">The photo is shrunk, then sent to OpenAI to be read. It is not stored by this app.</p>
            {error && <p className="error" role="alert">{error}</p>}
          </section>

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

          {found && (
            <section className="card" aria-live="polite">
              <h2>What the coach sees</h2>
              <dl className="find">
                <dt>Item</dt><dd>{found.item === 'other' ? found.itemOther || 'Not something the app recognises' : found.item === 'hat' ? 'Hat' : found.item === 'mitts' ? 'Mitts' : 'Scarf'}</dd>
                <dt>Stitch</dt><dd>{found.stitch === 'other' ? found.stitchOther || 'Something else' : stitchName(found.stitch)}</dd>
                <dt>Colours</dt><dd>{found.colours}</dd>
                <dt>Worked</dt><dd>{found.worked === 'round' ? 'In the round' : found.worked === 'flat' ? 'Flat' : 'Unclear'}</dd>
                <dt>How sure</dt><dd>{found.confidence}</dd>
              </dl>
              {found.notes && <p className="sub">{found.notes}</p>}
              {match ? (
                <>
                  <div className={`callout ${match.exact ? 'ok' : 'drill'}`}>
                    <b>{match.exact ? 'The app has this pattern' : 'Closest pattern in the app'}</b>
                    <p>{PROJECTS.find((p) => p.id === match.project)!.name}{match.style ? ` in ${stitchPattern(match.style).name.toLowerCase()}` : ''}. Sizes and stitch counts come from your own measurements, not from the photo.</p>
                    {!match.exact && <p>It will not be identical: {found.colours > 1 ? 'the app knits in one colour so far. ' : ''}{match.style && match.style !== found.stitch ? 'That stitch is not in the library yet, so this uses the nearest one.' : ''}</p>}
                  </div>
                  <button className="btn wide" onClick={start}>Start this pattern</button>
                </>
              ) : <div className="callout warn"><b>No pattern for this yet</b><p>The app can make scarves, hats and fingerless mitts so far.</p></div>}
            </section>
          )}

          {cfg.key && (
            <details className="howto">
              <summary>Key and model settings</summary>
              <label htmlFor="omodel">Model
                <input id="omodel" value={cfg.model} onChange={(e) => save({ ...cfg, model: e.target.value.trim() })} spellCheck={false} /></label>
              <button className="chip" onClick={() => { save({ key: '', model: cfg.model }); setPhoto(null); setCheck(null); setFound(null) }}>Remove the key from this device</button>
            </details>
          )}
        </>
      )}
    </>
  )
}
