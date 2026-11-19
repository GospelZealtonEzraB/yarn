import { useMemo, useState } from 'react'
import { knit, type Construction } from '../engine/fabric'
import { withMistake, workingOrder } from '../engine/games'
import { CELL, rowBase, yarnSpans } from '../engine/yarnPath'

const pickFrom = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

/* ---------- Chart reader ---------- */

const newChart = () => ({
  cells: Array.from({ length: 6 }, () => pickFrom(['k', 'k', 'p'] as const)) as ('k' | 'p')[],
  wrongSide: Math.random() < 0.4,
})

export function ChartReader() {
  const [q, setQ] = useState(newChart)
  const [done, setDone] = useState(0)
  const [miss, setMiss] = useState<string | null>(null)
  const [solved, setSolved] = useState(0)
  const order = useMemo(() => workingOrder(q.cells, q.wrongSide), [q])
  // Which drawn cell the knitter is on: right to left on the right side, left to right on the wrong side.
  const at = q.wrongSide ? done : q.cells.length - 1 - done
  const finished = done === q.cells.length
  const press = (st: 'k' | 'p') => {
    if (st === order[done]) { setDone(done + 1); setMiss(null); if (done + 1 === q.cells.length) setSolved(solved + 1) }
    else setMiss(q.wrongSide
      ? 'On a wrong-side row every symbol flips: a blank square is purled and a dot is knitted.'
      : 'On a right-side row a blank square is knitted and a dot is purled.')
  }
  const s = 34
  return (
    <section className="card">
      <div className="between"><h2>Work this chart row</h2><span className="pill">{solved} rows read</span></div>
      <p><b>Row {q.wrongSide ? '2, wrong side' : '1, right side'}.</b> {q.wrongSide ? 'Read it left to right.' : 'Read it right to left.'}</p>
      <figure>
        <svg viewBox={`-2 -2 ${q.cells.length * s + 4} ${s + 22}`} role="img" aria-label="One chart row">
          {q.cells.map((c, i) => {
            const worked = q.wrongSide ? i < done : i > at
            return (
              <g key={i} transform={`translate(${i * s} 0)`}>
                <rect width={s} height={s} className={`chart-cell${worked ? ' worked' : ''}${!finished && i === at ? ' current' : ''}`} />
                {c === 'p' && <circle cx={s / 2} cy={s / 2} r={4.5} className="chart-dot" />}
              </g>
            )
          })}
          <path d={q.wrongSide ? `M4 ${s + 12}h${q.cells.length * s - 14}m0 0l-7 -5m7 5l-7 5` : `M${q.cells.length * s - 4} ${s + 12}h-${q.cells.length * s - 14}m0 0l7 -5m-7 5l7 5`} className="chart-dir" />
        </svg>
        <figcaption>Blank = knit on the right side · dot = purl on the right side</figcaption>
      </figure>
      {finished ? (
        <>
          <p aria-live="polite"><b>Row done.</b> You worked: {order.map((o) => (o === 'k' ? 'K' : 'P')).join(' ')}.</p>
          <button className="btn" onClick={() => { setQ(newChart()); setDone(0); setMiss(null) }}>Next row</button>
        </>
      ) : (
        <>
          <p className="sub">Stitch {done + 1} of {q.cells.length}. What do you do with the highlighted square?</p>
          <div className="nav2 even"><button className="btn ghost" onClick={() => press('k')}>Knit</button><button className="btn ghost" onClick={() => press('p')}>Purl</button></div>
          {miss && <p className="error" role="alert">Not that one. {miss}</p>}
        </>
      )}
    </section>
  )
}

/* ---------- Spot the mistake ---------- */

const FABRICS: { name: string; recipe: string; how: Construction }[] = [
  { name: 'stockinette', recipe: 'K1', how: 'round' },
  { name: '2×2 rib', recipe: 'K2, P2', how: 'round' },
  { name: 'garter stitch', recipe: 'K1', how: 'flat' },
  { name: '1×1 rib', recipe: 'K1, P1', how: 'round' },
]
const newPuzzle = () => {
  const kind = pickFrom(FABRICS)
  const row = 2 + Math.floor(Math.random() * 4), col = 2 + Math.floor(Math.random() * 8)
  return { kind, row, col, fabric: withMistake(knit(12, Array(8).fill(kind.recipe), kind.how), row, col) }
}

export function SpotTheMistake() {
  const [p, setP] = useState(newPuzzle)
  const [tries, setTries] = useState(0)
  const [found, setFound] = useState(false)
  const [solved, setSolved] = useState(0)
  const { spans, stitches, width, height } = useMemo(() => yarnSpans(p.fabric), [p])
  const zs = [...new Set(spans.map((s) => s.z))].sort((a, b) => a - b)
  const wrong = stitches[p.row][p.col]
  const tap = (row: number, col: number) => {
    if (found) return
    if (row === p.row && col === p.col) { setFound(true); setSolved(solved + 1) } else setTries(tries + 1)
  }
  return (
    <section className="card">
      <div className="between"><h2>Find the wrong stitch</h2><span className="pill">{solved} found</span></div>
      <p>This should be plain <b>{p.kind.name}</b>. One stitch was worked the wrong way. Tap it.</p>
      <figure>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`A ${p.kind.name} swatch with one mistake`}>
          {zs.map((z) => {
            const layer = spans.filter((s) => s.z === z)
            return (
              <g key={z} fill="none">
                {layer.map((s, i) => <path key={`e${i}`} d={s.d} className={`edge ${s.row % 2 ? 'b' : 'a'}`} />)}
                {layer.map((s, i) => <path key={`y${i}`} d={s.d} className={`strand ${s.row % 2 ? 'b' : 'a'}`} />)}
              </g>
            )
          })}
          {found && <circle cx={wrong.x} cy={rowBase(height, p.row) - CELL.h * 0.8} r={CELL.w * 0.85} className="found-ring" />}
          {stitches.flat().map((st) => (
            <rect key={`${st.row}-${st.col}`} className="hit" x={st.x - CELL.w / 2} y={rowBase(height, st.row) - CELL.h * 1.3}
              width={CELL.w} height={CELL.h} onClick={() => tap(st.row, st.col)} />
          ))}
        </svg>
      </figure>
      {found ? (
        <>
          <p aria-live="polite"><b>That is it.</b> It was {wrong.type === 'p' ? 'purled where it should be knitted, so a bump shows among the Vs' : 'knitted where it should be purled, so a V shows among the bumps'}. In real knitting you would drop that one stitch down and hook it back up the right way.</p>
          <button className="btn" onClick={() => { setP(newPuzzle()); setTries(0); setFound(false) }}>Next swatch</button>
        </>
      ) : (
        <p className="sub" aria-live="polite">{tries === 0 ? 'Look for the one loop that breaks the pattern.' : `Not that one. ${tries} ${tries === 1 ? 'try' : 'tries'} so far. Compare each stitch with the ones above and below it.`}</p>
      )}
    </section>
  )
}
