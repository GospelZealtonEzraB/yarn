import { projectsFor } from '../patterns/catalog'
import { useStore } from '../store'

export function Projects({ open }: { open: (id: string) => void }) {
  const { state } = useStore()
  return (
    <>
      <header className="top">
        <h1>Pick something to make</h1>
        <p className="sub">Sized for {state.gauge} stitches per 10 cm. Change that on the Learn tab.</p>
      </header>
      <div className="cards">
        {projectsFor(state.custom).map((p) => {
          const started = state.projects[p.id]
          return (
            <button key={p.id} className={`pcard ${p.build ? 'open' : 'locked'}`} disabled={!p.build} onClick={() => open(p.id)}>
              <svg viewBox="0 0 100 70" aria-hidden="true"><path className="sil" d={p.outline} /></svg>
              <b>{p.name}</b>
              <span className="sub">{p.blurb}</span>
              <span className={`tag ${p.build ? 'ok' : ''}`}>{p.build ? (started?.step ? 'On your needles · continue' : p.id.includes('sample') ? 'Example design' : p.id.startsWith('custom-') ? 'Designed for you' : `Stage ${p.stage} · ${p.hours}`) : `Stage ${p.stage} · pattern being written`}</span>
              {state.made[p.id] ? <span className="pill">Made {state.made[p.id]}×</span> : null}
            </button>
          )
        })}
      </div>
    </>
  )
}
