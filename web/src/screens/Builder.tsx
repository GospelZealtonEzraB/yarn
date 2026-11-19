import { useMemo } from 'react'
import { knit } from '../engine/fabric'
import { PROJECTS } from '../patterns/catalog'
import { settingsOf, useStore } from '../store'
import { PieceView } from '../ui/FabricView'

export function Builder({ id, back }: { id: string; back: () => void }) {
  const { state, set } = useStore()
  const project = PROJECTS.find((p) => p.id === id)!
  const built = useMemo(() => {
    try {
      const pattern = project.build!(settingsOf(state))
      return { pattern, fabric: knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), pattern.construction) }
    } catch (e) { return { error: (e as Error).message } }
  }, [project, state])

  if (!built.pattern) return (
    <>
      <button className="back" onClick={back}>← All projects</button>
      <div className="callout warn"><b>These numbers do not make a pattern</b><p>{built.error} Check the gauge and head size on the Learn tab.</p></div>
    </>
  )
  const { pattern, fabric } = built
  const saved = state.projects[id] ?? { step: 0, count: 0 }
  const last = pattern.steps.length // step 0 is the kit list
  const stepNo = Math.min(saved.step, last)
  const go = (step: number, count = 0) => set({ projects: { ...state.projects, [id]: { step, count: Math.max(0, count) } } })
  const step = stepNo > 0 ? pattern.steps[stepNo - 1] : null
  const target = step?.rows?.length ?? 0
  const before = pattern.steps.slice(0, Math.max(stepNo - 1, 0)).reduce((n, s) => n + (s.rows?.length ?? 0), 0)
  const fresh = Math.min(saved.count, target)
  const unit = pattern.construction === 'round' ? 'round' : 'row'
  const onNeedle = before + fresh > 0 ? fabric.rows[before + fresh - 1].length : pattern.castOn

  return (
    <>
      <button className="back" onClick={back}>← All projects</button>
      <header className="top">
        <span className="tag">{project.name} · step {stepNo + 1} of {last + 1}</span>
        <h1>{step ? step.title : 'Gather your kit'}</h1>
      </header>
      <div className="progress">{Array.from({ length: last + 1 }, (_, i) => <i key={i} className={i <= stepNo ? 'd' : ''} />)}</div>

      {!step ? (
        <>
          <ul className="kit">{pattern.kit.map((k) => <li key={k.name}><span>{k.name}</span><b>{k.qty}</b></li>)}</ul>
          <p className="sub">{pattern.fits} Yarn amounts are estimates. Buy a little extra.</p>
        </>
      ) : (
        <>
          <figure className="piece-fig">
            <PieceView fabric={fabric} done={before + fresh} fresh={fresh} />
            <figcaption>Every stitch of your piece · pink = this step · {onNeedle} stitches on the needle</figcaption>
          </figure>
          <p>{step.text}{step.until ? ` Stop when ${step.until}.` : ''}</p>
          <code className="recipe">{step.recipe}</code>
          {target > 0 && (
            <section className="card counter">
              <div>
                <b>{unit === 'round' ? 'Round' : 'Row'} counter</b>
                <p className="sub">About {target} {unit}s at your gauge. The tape measure has the final say.</p>
              </div>
              <div className="group">
                <button className="round" aria-label={`One ${unit} fewer`} onClick={() => go(stepNo, saved.count - 1)}>−</button>
                <output>{saved.count}</output>
                <button className="round plus" aria-label={`Add one ${unit}`} onClick={() => go(stepNo, saved.count + 1)}>+</button>
                {target > 60 && <button className="chip" onClick={() => go(stepNo, saved.count + 10)}>+10</button>}
              </div>
            </section>
          )}
          {step.tip && <p className="tip">{step.tip}</p>}
        </>
      )}

      <div className="nav2">
        <button className="btn ghost" disabled={stepNo === 0} onClick={() => go(stepNo - 1)}>Back</button>
        {stepNo < last
          ? <button className="btn" onClick={() => go(stepNo + 1)}>{step ? 'Done, next step' : 'I have everything'}</button>
          : <button className="btn" onClick={() => { go(0); back() }}>Finished!</button>}
      </div>
    </>
  )
}
