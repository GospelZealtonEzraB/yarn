import { useMemo } from 'react'
import { LESSONS } from '../content/lessons'
import { knit } from '../engine/fabric'
import { useStore } from '../store'
import { StitchExplorer } from '../ui/StitchExplorer'

export function Lesson({ id, back, open }: { id: string; back: () => void; open: (id: string) => void }) {
  const { state, set } = useStore()
  const i = LESSONS.findIndex((l) => l.id === id)
  const lesson = LESSONS[i], next = LESSONS[i + 1]
  const fabric = useMemo(() => lesson.see && knit(lesson.see.castOn, lesson.see.rows, lesson.see.construction), [lesson])
  const finish = () => { set({ lessons: { ...state.lessons, [id]: true } }); if (next) open(next.id); else back() }
  return (
    <>
      <button className="back" onClick={back}>← All lessons</button>
      <header className="top">
        <span className="tag">Stage {lesson.stage} · {lesson.minutes} min</span>
        <h1>{lesson.title}</h1>
        <p>{lesson.intro}</p>
      </header>
      <ol className="steps">{lesson.steps.map((s, n) => <li key={n}>{s}</li>)}</ol>
      <div className="callout ok"><b>You have it when</b><p>{lesson.check}</p></div>
      <div className="callout warn"><b>Watch out</b><p>{lesson.watch}</p></div>
      {fabric && lesson.see && (
        <section className="card">
          <h2>What it should look like</h2>
          <p className="sub">{lesson.see.caption}</p>
          <StitchExplorer fabric={fabric} />
        </section>
      )}
      <p className="sub">Drawings of hands and needles are not in the app yet. They are being held back until an experienced knitter has checked them.</p>
      <button className="btn wide" onClick={finish}>{state.lessons[id] ? 'Next' : 'Mark as done'}{next ? ` · ${next.title}` : ''}</button>
    </>
  )
}
