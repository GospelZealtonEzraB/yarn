import { useMemo, useState } from 'react'
import { GLOSSARY } from '../content/lessons'
import { knit, type Construction } from '../engine/fabric'
import { useStore } from '../store'
import { YarnSwatch } from '../ui/FabricView'
import { ChartReader, SpotTheMistake } from './Games'

const SWATCHES: { name: string; recipe: string; how: Construction; why: string }[] = [
  { name: 'Stockinette', recipe: 'K1', how: 'round', why: 'Smooth columns of V shapes. Knit one row, purl the next when worked flat.' },
  { name: 'Garter stitch', recipe: 'K1', how: 'flat', why: 'A ridge of bumps on every other row. Made by knitting every row, worked flat.' },
  { name: '1×1 rib', recipe: 'K1, P1', how: 'round', why: 'Single knit columns beside single purl columns.' },
  { name: '2×2 rib', recipe: 'K2, P2', how: 'round', why: 'Pairs of knit columns beside pairs of purl columns. The classic hat brim.' },
  { name: 'Seed stitch', recipe: 'K1, P1', how: 'flat', why: 'Knits and purls alternate like a checkerboard, so the bumps are scattered.' },
]
const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5)
const question = (avoid = -1) => {
  const answer = shuffle(SWATCHES.map((_, i) => i).filter((i) => i !== avoid))[0]
  return { answer, options: shuffle([answer, ...shuffle(SWATCHES.map((_, i) => i).filter((i) => i !== answer)).slice(0, 2)]) }
}

export function Practice() {
  const { state, set } = useStore()
  const [mode, setMode] = useState<'swatch' | 'mistake' | 'chart' | 'cards'>('swatch')
  const [q, setQ] = useState(() => question())
  const [pick, setPick] = useState<number | null>(null)
  const [card, setCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const sw = SWATCHES[q.answer]
  const fabric = useMemo(() => knit(12, Array(8).fill(sw.recipe), sw.how), [sw])
  const answer = (i: number) => {
    setPick(i)
    set({ quiz: { asked: state.quiz.asked + 1, right: state.quiz.right + (i === q.answer ? 1 : 0) } })
  }
  return (
    <>
      <header className="top">
        <h1>Practice</h1>
        <p className="sub">Five minutes without needles</p>
      </header>
      <div className="seg">
        <button aria-pressed={mode === 'swatch'} onClick={() => setMode('swatch')}>Name that swatch</button>
        <button aria-pressed={mode === 'mistake'} onClick={() => setMode('mistake')}>Find the mistake</button>
        <button aria-pressed={mode === 'chart'} onClick={() => setMode('chart')}>Chart reader</button>
        <button aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>Flashcards</button>
      </div>
      {mode === 'mistake' && <SpotTheMistake />}
      {mode === 'chart' && <ChartReader />}
      {mode === 'swatch' && (
        <section className="card">
          <div className="between"><h2>Which fabric is this?</h2><span className="pill">{state.quiz.right} of {state.quiz.asked} right</span></div>
          <figure><YarnSwatch fabric={fabric} /></figure>
          <p className="sub">Shown from the right side. Legs in front make a V, which is a knit. A strand lying across the front is a purl bump.</p>
          <div className="opts">
            {q.options.map((i) => (
              <button key={i} disabled={pick !== null} onClick={() => answer(i)}
                className={`opt ${pick !== null ? (i === q.answer ? 'right' : i === pick ? 'wrong' : '') : ''}`}>{SWATCHES[i].name}</button>
            ))}
          </div>
          {pick !== null && (
            <>
              <p aria-live="polite"><b>{pick === q.answer ? 'Correct.' : `It is ${sw.name.toLowerCase()}.`}</b> {sw.why}</p>
              <button className="btn" onClick={() => { setQ(question(q.answer)); setPick(null) }}>Next swatch</button>
            </>
          )}
        </section>
      )}
      {mode === 'cards' && (
        <section className="card">
          <div className="between"><h2>Pattern shorthand</h2><span className="pill">{card + 1} of {GLOSSARY.length}</span></div>
          <button className="flash" onClick={() => setFlipped(!flipped)} aria-live="polite">
            <code>{GLOSSARY[card][0]}</code>
            <span>{flipped ? GLOSSARY[card][1] : 'Tap to see what it means'}</span>
          </button>
          <div className="nav2">
            <button className="btn ghost" onClick={() => { setCard((card + GLOSSARY.length - 1) % GLOSSARY.length); setFlipped(false) }}>Back</button>
            <button className="btn" onClick={() => { setCard((card + 1) % GLOSSARY.length); setFlipped(false) }}>Next card</button>
          </div>
        </section>
      )}
    </>
  )
}
