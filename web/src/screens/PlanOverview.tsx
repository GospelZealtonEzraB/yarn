import { useMemo } from 'react'
import { toPattern } from '../agent/plan'
import { settingsOf, useStore } from '../store'
import { Assembly3D } from '../ui/Assembly3D'
import { PlanDetails } from '../ui/PlanDetails'

/** A many-piece design: the assembled model, each piece with its progress, then how to put it together. */
export function PlanOverview({ id, back, openPiece, openLesson }: { id: string; back: () => void; openPiece: (pieceId: string) => void; openLesson: (id: string) => void }) {
  const { state, set } = useStore()
  const plan = state.custom.find((c) => c.id === id)!.plan
  const settings = settingsOf(state)
  const totals = useMemo(() => plan.pieces.map((_, i) => {
    try { return toPattern(plan, settings, i).steps.reduce((n, s) => n + (s.rows?.length ?? 0), 0) } catch { return 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [plan, state.gauge])
  // How much of each piece is knitted, from the builder's saved place in it.
  const progress = plan.pieces.map((_, i) => {
    const saved = state.projects[`${id}#${i}`]
    if (state.made[`${id}#${i}`]) return 1
    if (!saved || !totals[i]) return 0
    const steps = toPattern(plan, settings, i).steps
    const before = steps.slice(0, Math.max(saved.step - 1, 0)).reduce((n, s) => n + (s.rows?.length ?? 0), 0)
    return Math.min((before + Math.min(saved.count, steps[saved.step - 1]?.rows?.length ?? 0)) / totals[i], 1)
  })
  const allDone = progress.every((p) => p >= 1)

  return (
    <>
      <button className="back" onClick={back}>← All projects</button>
      <header className="top">
        <span className="tag">Designed for you · {plan.pieces.length} pieces</span>
        <h1>{plan.title}</h1>
      </header>

      <figure className="hero">
        <Assembly3D plan={plan} settings={settings} progress={progress} />
        <figcaption>Built from your pieces · solid = knitted · see-through = still to make · drag to turn</figcaption>
      </figure>
      {plan.photo && <figure className="reference"><img src={plan.photo} alt="Your reference photo" /><figcaption>Your reference photo</figcaption></figure>}
      <p className="sub">The model is assembled from each piece's stitch counts and the positions the designer gave. It shows shape, size and progress. It is a guide, not a photograph of the finished toy.</p>

      <section className="card">
        <h2>Pieces to knit</h2>
        <div className="lessons">
          {plan.pieces.map((piece, i) => (
            <button key={piece.name} className="lesson piece" onClick={() => openPiece(`${id}#${i}`)}>
              <i className="dot" style={{ background: /^#[0-9a-f]{6}$/i.test(piece.colour_hex) ? piece.colour_hex : undefined }} />
              <span><b>{piece.name}</b>{piece.quantity > 1 ? ` × ${piece.quantity}` : ''}<small>{piece.construction === 'round' ? 'In the round' : 'Flat'} · cast on {piece.cast_on}{piece.stuffed ? ' · stuffed' : ''}</small></span>
              <span className={`tag ${progress[i] >= 1 ? 'ok' : ''}`}>{progress[i] >= 1 ? 'Done' : progress[i] > 0 ? `${Math.round(progress[i] * 100)}%` : 'Start'}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Putting it together</h2>
        {!allDone && <p className="sub">For when every piece is knitted.</p>}
        <ol className="steps">{plan.assembly.map((a, n) => <li key={n}>{a}</li>)}</ol>
      </section>

      <PlanDetails plan={plan} openLesson={openLesson} />
      <button className="chip" onClick={() => { set({ custom: state.custom.filter((c) => c.id !== id) }); back() }}>Remove this design</button>
    </>
  )
}
