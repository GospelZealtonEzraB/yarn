import { useMemo, useState } from 'react'
import { LESSONS } from '../content/lessons'
import { knit } from '../engine/fabric'
import { product as shapeOf } from '../engine/product'
import { inWords, parts, repeats } from '../engine/recipe'
import { DIAGRAMS } from '../engine/technique'
import { projectsFor } from '../patterns/catalog'
import { rowsFor, stitchPattern } from '../patterns/stitches'
import { settingsOf, useStore } from '../store'
import { PieceView, YarnSwatch } from '../ui/FabricView'
import { CastOnPicture, KitIcon, RingPicture, RowTiles, SeamPicture } from '../ui/Pictures'
import { Product3D } from '../ui/Product3D'
import { PlanDetails } from '../ui/PlanDetails'
import { ProductView } from '../ui/ProductView'
import { TechniqueView } from '../ui/TechniqueView'

const CLOSE_UP = 8 // stitches shown in the close-up

export function Builder({ id, back, openLesson }: { id: string; back: () => void; openLesson: (id: string) => void }) {
  const { state, set } = useStore()
  const project = projectsFor(state.custom).find((p) => p.id === id)!
  const plan = state.custom.find((c) => c.id === id)?.plan
  const [view, setView] = useState<'flat' | '3d' | 'worn'>('flat')
  const style = state.styles[id] ?? project.styles?.[0]
  // Some stitches need a stitch count this size does not give. Offer only the ones that work.
  const usable = useMemo(() => (project.styles ?? []).filter((sid) => { try { project.build!(settingsOf(state), sid); return true } catch { return false } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, state.gauge, state.headCm, state.handCm])
  const built = useMemo(() => {
    try {
      const pattern = project.build!(settingsOf(state), style)
      const fabric = knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), pattern.construction)
      return { pattern, fabric, shape: shapeOf(pattern, fabric, state.gauge) }
    } catch (e) { return { error: (e as Error).message } }
    // Only the numbers that size the pattern should rebuild it, not every progress tap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, state.gauge, state.headCm, state.handCm, style])

  if (!built.pattern) return (
    <>
      <button className="back" onClick={back}>← All projects</button>
      <div className="callout warn"><b>These choices do not make a pattern</b><p>{built.error} Check your measurements on the Learn tab.</p></div>
      {state.styles[id] && <button className="btn" onClick={() => set({ styles: { ...state.styles, [id]: project.styles![0] } })}>Go back to {stitchPattern(project.styles![0]).name}</button>}
    </>
  )
  const { pattern, fabric, shape } = built
  const saved = state.projects[id] ?? { step: 0, count: 0 }
  const last = pattern.steps.length // step 0 is the kit list
  const stepNo = Math.min(saved.step, last)
  const go = (step: number, count = 0) => set({ projects: { ...state.projects, [id]: { step, count: Math.max(0, count) } } })
  const step = stepNo > 0 ? pattern.steps[stepNo - 1] : null
  const rows = step?.rows ?? []
  const before = pattern.steps.slice(0, Math.max(stepNo - 1, 0)).reduce((n, s) => n + (s.rows?.length ?? 0), 0)
  const fresh = Math.min(saved.count, rows.length)
  const flat = pattern.construction === 'flat'
  const unit = flat ? 'row' : 'round'
  const Unit = flat ? 'Row' : 'Round'
  const total = fabric.rows.length
  const onNeedle = before + fresh > 0 ? fabric.rows[before + fresh - 1].length : pattern.castOn
  // Finishing steps come after all the knitting, so the picture shows everything done.
  const stepDone = step && !rows.length && before >= total ? total : before + fresh
  const percent = Math.round((stepDone / total) * 100)

  // The row to work now.
  const current = fresh < rows.length ? rows[fresh] : null
  const g = before + fresh // its index in the whole piece
  const wrongSide = flat && g % 2 === 1
  const after = current ? fabric.rows[g].length : onNeedle
  const tiles = current ? { ...parts(current), times: repeats(current, onNeedle) } : null
  const closeUp = (() => {
    if (!current) return null
    const from = Math.max(0, g - 3)
    const window = fabric.rows.slice(from, g + 1).map((r) => r.slice(0, CLOSE_UP))
    if (!window.every((r) => r.length === CLOSE_UP && r.every((s) => s === 'k' || s === 'p'))) return null
    return { fabric: { ...fabric, castOn: CLOSE_UP, rows: window }, focus: window.length - 1 }
  })()

  // Only tubes have a meaningful solid shape: knitted in the round, or folded and seamed into a tube.
  const tube = pattern.halved
  const solid = view !== 'flat'
  const worn = view === 'worn' && pattern.wornOn === 'head' ? state.headCm : undefined
  const view3d = tube && (
    <div className="seg view-toggle">
      <button aria-pressed={view === 'flat'} onClick={() => setView('flat')}>Flat</button>
      <button aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D</button>
      {pattern.wornOn && <button aria-pressed={view === 'worn'} onClick={() => setView('worn')}>Worn</button>}
    </div>
  )
  const needs = (project.needs ?? []).map((n) => LESSONS.find((l) => l.id === n)!)
  const finish = () => set({ projects: { ...state.projects, [id]: { step: 0, count: 0 } }, made: { ...state.made, [id]: (state.made[id] ?? 0) + 1 } })

  return (
    <>
      <button className="back" onClick={back}>← All projects</button>
      <header className="top">
        <span className="tag">{project.name} · step {stepNo + 1} of {last + 1} · {percent}% knitted</span>
        <h1>{step ? step.title : 'Before you start'}</h1>
      </header>
      <div className="progress">{Array.from({ length: last + 1 }, (_, i) => <i key={i} className={i <= stepNo ? 'd' : ''} />)}</div>

      {!step ? (
        <>
          <figure className="hero">
            {view3d}
            {solid && tube ? <Product3D product={shape} done={total} current={null} stitches={pattern.castOn} wornOnHead={worn} /> : <ProductView product={shape} done={total} current={null} unit={unit} />}
            <figcaption>What you are making · {pattern.fits}</figcaption>
          </figure>
          {project.styles && style && (
            <section className="card">
              <h2>Choose your stitch</h2>
              <p className="sub">For the {project.styledPart}. Everything else in the pattern stays the same.</p>
              <div className="group">
                {usable.map((sid) => (
                  <button key={sid} className="chip" aria-pressed={sid === style} onClick={() => set({ styles: { ...state.styles, [id]: sid } })}>{stitchPattern(sid).name}</button>
                ))}
              </div>
              <figure className="swatch-pick"><YarnSwatch fabric={knit(16, rowsFor(stitchPattern(style), 16, 8, 'round'), 'round')} /></figure>
              <p className="sub"><b>{stitchPattern(style).name}.</b> {stitchPattern(style).note}</p>
            </section>
          )}
          {!plan && <section className="card">
            <h2>Your kit</h2>
            <ul className="kit">{pattern.kit.map((k) => <li key={k.name}><KitIcon name={k.name} /><span>{k.name}</span><b>{k.qty}</b></li>)}</ul>
            <p className="sub">Yarn amounts are estimates. Buy a little extra.</p>
          </section>}
          {plan && <PlanDetails plan={plan} openLesson={openLesson} />}
          {!plan && <section className="card">
            <h2>Skills this uses</h2>
            <div className="lessons">
              {needs.map((l) => (
                <button key={l.id} className="lesson" onClick={() => openLesson(l.id)}>
                  <span>{l.title}</span><span className={`tag ${state.lessons[l.id] ? 'ok' : ''}`}>{state.lessons[l.id] ? 'Done' : 'Not yet'}</span>
                </button>
              ))}
            </div>
            {needs.some((l) => !state.lessons[l.id]) && <p className="sub">You can start anyway. Each step links to the lesson it needs.</p>}
          </section>}
        </>
      ) : (
        <>
          <figure className="hero">
            {view3d}
            {solid && tube
              ? <Product3D product={shape} done={stepDone} current={rows.length ? stepNo - 1 : null} stitches={pattern.castOn} wornOnHead={worn} />
              : <ProductView product={shape} done={stepDone} current={rows.length ? stepNo - 1 : null} unit={unit} />}
            <figcaption>{percent}% knitted · filled = done · bright = this step · dashed = still to come</figcaption>
          </figure>
          <ol className="map">
            <li className={stepNo > 0 ? 'done' : 'now'}><button onClick={() => go(0)}>Kit</button></li>
            {pattern.steps.map((st, i) => (
              <li key={st.title} className={i + 1 < stepNo ? 'done' : i + 1 === stepNo ? 'now' : ''}><button onClick={() => go(i + 1)}>{st.title}</button></li>
            ))}
          </ol>
          {(step.picture === 'caston' || step.picture === 'ring' || step.picture === 'seam') && (
            <figure className="piece-fig">
              {step.picture === 'caston' ? <CastOnPicture count={pattern.castOn} /> : step.picture === 'ring' ? <RingPicture /> : <SeamPicture />}
              <figcaption>{step.recipe}</figcaption>
            </figure>
          )}
          {step.picture === 'bindoff' && <section className="card"><TechniqueView technique={DIAGRAMS.bindoff} /></section>}

          {rows.length > 0 && (
            <section className="card rowcard" aria-live="polite">
              {current && tiles ? (
                <>
                  <div className="between">
                    <h2>{Unit} {fresh + 1} <span className="of">of about {rows.length}</span></h2>
                    {flat && <span className={`pill ${wrongSide ? 'ws' : 'rs'}`}>{wrongSide ? 'Wrong side' : 'Right side'}</span>}
                  </div>
                  <RowTiles {...tiles} />
                  <p className="say">{inWords(current)}</p>
                  {closeUp && (
                    <figure className="close-up">
                      <YarnSwatch fabric={closeUp.fabric} focusRow={closeUp.focus} />
                      <figcaption>How it looks from the right side once this {unit} is done · pink = this {unit}</figcaption>
                    </figure>
                  )}
                  {after !== onNeedle && <p className="sub">You start this {unit} with {onNeedle} stitches and end with <b>{after}</b>.</p>}
                </>
              ) : (
                <>
                  <h2>Estimate reached</h2>
                  <p>You have counted {saved.count} {unit}s. Now measure. {step.until ? `Keep going only until ${step.until}.` : ''}</p>
                </>
              )}
              <div className="rowbar">
                <button className="round" aria-label={`Undo one ${unit}`} onClick={() => go(stepNo, saved.count - 1)}>−</button>
                <button className="btn grow" onClick={() => go(stepNo, saved.count + 1)}>{Unit} done</button>
                {rows.length > 60 && <button className="chip" onClick={() => go(stepNo, saved.count + 10)}>+10</button>}
              </div>
              {step.until && <p className="sub">Stop when {step.until}. The tape measure has the final say.</p>}
            </section>
          )}

          <p>{step.text}</p>
          {step.tip && <p className="tip">{step.tip}</p>}

          {step.help?.map((h) => {
            const l = LESSONS.find((x) => x.id === h)!
            return (
              <details key={h} className="howto">
                <summary>How to: {l.title}</summary>
                {l.technique && <TechniqueView technique={DIAGRAMS[l.technique]} />}
                <ol className="steps">{l.steps.map((s, n) => <li key={n}>{s}</li>)}</ol>
                <button className="chip" onClick={() => openLesson(h)}>Open the full lesson</button>
              </details>
            )
          })}
          <details className="howto">
            <summary>See every stitch so far</summary>
            <figure className="piece-fig"><PieceView fabric={fabric} done={stepDone} fresh={fresh} /><figcaption>Pink = this step · {onNeedle} stitches on the needle</figcaption></figure>
          </details>
        </>
      )}

      <div className="nav2">
        <button className="btn ghost" disabled={stepNo === 0} onClick={() => go(stepNo - 1)}>Back</button>
        {stepNo < last
          ? <button className="btn" onClick={() => go(stepNo + 1)}>{step ? 'Step done, next' : 'I have everything'}</button>
          : <button className="btn" onClick={() => { finish(); back() }}>Finished!</button>}
      </div>
    </>
  )
}
