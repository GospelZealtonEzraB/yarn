import { useMemo, useState } from 'react'
import { EXTRAS } from '../content/extras'
import { LESSONS } from '../content/lessons'
import { knit } from '../engine/fabric'
import { DIAGRAMS } from '../engine/technique'
import { useStore } from '../store'
import { BallBandPicture, CastOnPicture, DpnPicture, GaugePicture, RingPicture } from '../ui/Pictures'
import { StitchExplorer } from '../ui/StitchExplorer'
import { TechniqueView } from '../ui/TechniqueView'

export function Lesson({ id, back, open }: { id: string; back: () => void; open: (id: string) => void }) {
  const { state, set } = useStore()
  const i = LESSONS.findIndex((l) => l.id === id)
  const lesson = LESSONS[i], next = LESSONS[i + 1], extra = EXTRAS[id]
  const [at, setAt] = useState(0)
  const fabric = useMemo(() => lesson.see && knit(lesson.see.castOn, lesson.see.rows, lesson.see.construction), [lesson])
  const last = at === lesson.steps.length - 1
  const finish = () => { set({ lessons: { ...state.lessons, [id]: true } }); if (next) open(next.id); else back() }

  return (
    <>
      <button className="back" onClick={back}>← All lessons</button>
      <header className="top">
        <span className="tag">Stage {lesson.stage} · {lesson.minutes} min</span>
        <h1>{lesson.title}</h1>
        <p className="sub">{lesson.intro}</p>
      </header>

      <section className="card follow">
        {lesson.technique && <TechniqueView technique={DIAGRAMS[lesson.technique]} at={lesson.frames?.[at] ?? at} />}
        {lesson.picture === 'ballband' && <figure><BallBandPicture /></figure>}
        {lesson.picture === 'gauge' && <figure><GaugePicture gauge={state.gauge} /></figure>}
        {lesson.picture === 'caston' && <figure><CastOnPicture count={20} /></figure>}
        {lesson.picture === 'ring' && <figure><RingPicture /></figure>}
        {lesson.picture === 'dpn' && <figure><DpnPicture /></figure>}
        <div className="progress">{lesson.steps.map((_, n) => <i key={n} className={n <= at ? 'd' : ''} />)}</div>
        <div className="step-now" aria-live="polite">
          <span className="step-no">{at + 1}</span>
          <p>{lesson.steps[at]}</p>
        </div>
        <div className="nav2">
          <button className="btn ghost" disabled={at === 0} onClick={() => setAt(at - 1)}>Back</button>
          <button className="btn" disabled={last} onClick={() => setAt(at + 1)}>{last ? 'Last step' : 'Next step'}</button>
        </div>
        <details className="more"><summary>See all {lesson.steps.length} steps at once</summary>
          <ol className="steps">{lesson.steps.map((s, n) => <li key={n}>{s}</li>)}</ol>
        </details>
        {lesson.technique && <p className="sub">A diagram, not a photo. Needle positions and yarn path were checked against a published tutorial's text and photos. No knitter has reviewed it yet.</p>}
        {lesson.picture === 'caston' && <p className="sub">The picture shows the result. The hand movement is not drawn yet, so pair these steps with a video the first time.</p>}
      </section>

      {fabric && lesson.see && (
        <section className="card">
          <h2>What it should look like</h2>
          <p className="sub">{lesson.see.caption}</p>
          <StitchExplorer fabric={fabric} />
        </section>
      )}

      <div className="callout ok"><b>You have it when</b><p>{lesson.check}</p></div>
      <div className="callout drill"><b>Now try it with yarn</b><p>{extra.practice}</p></div>

      <section className="card">
        <h2>If it goes wrong</h2>
        <div className="troubles">
          <details><summary>{lesson.watch.split('. ')[0]}.</summary><p>{lesson.watch.split('. ').slice(1).join('. ') || lesson.watch}</p></details>
          {extra.troubles.map(([problem, fix]) => <details key={problem}><summary>{problem}</summary><p>{fix}</p></details>)}
        </div>
      </section>

      <button className="btn wide" onClick={finish}>{state.lessons[id] ? 'Next' : 'Mark as done'}{next ? ` · ${next.title}` : ''}</button>
    </>
  )
}
