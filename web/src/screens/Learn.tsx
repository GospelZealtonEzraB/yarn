import { LESSONS, STAGES } from '../content/lessons'
import { needleFor, PROJECTS, YARNS } from '../patterns/catalog'
import { useStore } from '../store'

export function Learn({ open, openProject }: { open: (lessonId: string) => void; openProject: (id: string) => void }) {
  const { state, set } = useStore()
  const next = LESSONS.find((l) => !state.lessons[l.id])
  const doneCount = LESSONS.filter((l) => state.lessons[l.id]).length
  const inProgress = PROJECTS.find((p) => (state.projects[p.id]?.step ?? 0) > 0)
  return (
    <>
      <header className="top">
        <h1>Learn to knit</h1>
        <p className="sub">{doneCount} of {LESSONS.length} lessons done</p>
      </header>

      {next && (
        <button className="card next" onClick={() => open(next.id)}>
          <span className="tag">Up next · {next.minutes} min</span>
          <b>{next.title}</b>
          <span className="sub">{next.intro}</span>
        </button>
      )}
      {inProgress && (
        <button className="card next alt" onClick={() => openProject(inProgress.id)}>
          <span className="tag">On your needles</span>
          <b>{inProgress.name}</b>
          <span className="sub">Pick up where you left off.</span>
        </button>
      )}

      <section className="card">
        <h2>Your yarn and measurements</h2>
        <p className="sub">Read the weight off the ball band. Every project resizes to match.</p>
        <div className="group">
          {Object.entries(YARNS).map(([k, y]) => (
            <button key={k} className="chip" aria-pressed={state.gauge === y.gauge} onClick={() => set({ yarn: k, gauge: y.gauge })}>{y.label}</button>
          ))}
        </div>
        <div className="fields">
          <label htmlFor="gauge">Stitches per 10 cm
            <input id="gauge" type="number" inputMode="numeric" min={8} max={40} value={state.gauge} onChange={(e) => set({ gauge: +e.target.value })} /></label>
          <label htmlFor="head">Head around, cm
            <input id="head" type="number" inputMode="numeric" min={30} max={70} value={state.headCm} onChange={(e) => set({ headCm: +e.target.value })} /></label>
          <label htmlFor="hand">Hand around, cm
            <input id="hand" type="number" inputMode="numeric" min={12} max={28} value={state.handCm} onChange={(e) => set({ handCm: +e.target.value })} /></label>
        </div>
        <p className="sub">Start with <b>{needleFor(state.gauge)}</b> needles. Once you have knitted a gauge swatch, type your own number here.</p>
      </section>

      <ol className="path">
        {STAGES.map((s) => {
          const lessons = LESSONS.filter((l) => l.stage === s.n)
          const done = lessons.filter((l) => state.lessons[l.id]).length
          const complete = lessons.length > 0 && done === lessons.length
          return (
            <li key={s.n} className={complete ? 'done' : next?.stage === s.n ? 'now' : ''}>
              <span className="node">{complete ? '✓' : s.n}</span>
              <div>
                <div className="between"><h3>{s.name}</h3>{lessons.length > 0 && <span className="pill">{done} of {lessons.length}</span>}</div>
                <p className="goal">{s.goal}</p>
                {lessons.length ? (
                  <>
                    <div className="lessons">
                      {lessons.map((l) => (
                        <button key={l.id} className="lesson" onClick={() => open(l.id)}>
                          <span>{l.title}</span><span className={`tag ${state.lessons[l.id] ? 'ok' : ''}`}>{state.lessons[l.id] ? 'Done' : `${l.minutes} min`}</span>
                        </button>
                      ))}
                    </div>
                    <div className="group then">
                      <span className="tag">Then make</span>
                      {s.projects.map((id) => {
                        const p = PROJECTS.find((x) => x.id === id)!
                        return <button key={id} className="chip" onClick={() => openProject(id)}>{p.name}{state.made[id] ? ' ✓' : ''}</button>
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="sub">{s.skills}</p>
                    <p className="makes"><span className="tag">You will make</span> {s.makes}</p>
                    <p className="tag soon">Lessons being written</p>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
