import { useEffect, useMemo, useState } from 'react'
import { isWrongSideRow, type Fabric } from '../engine/fabric'
import { CELL, PAD, rowBase, yarnSpans, type Span } from '../engine/yarnPath'

/**
 * Interactive view of the yarn path. Everything here is presentation: colours,
 * dimming, zoom and the step-by-step trace all read the same spans the engine
 * produced, and every span stays on its own depth layer, so no interaction can
 * change which strand is drawn over which.
 */
type ColorBy = 'row' | 'stitch' | 'depth'
type Sel = { row: number; col: number }

const LEGEND: Record<ColorBy, [string, string][]> = {
  row: [['a', 'Odd rows'], ['b', 'Even rows']],
  stitch: [['a', 'Knit'], ['b', 'Purl']],
  depth: [['a', 'In front'], ['c', 'Middle'], ['b', 'Behind']],
}
const LAYERS: [Span['z'], string][] = [[1, 'Front'], [0, 'Middle'], [-1, 'Back']]
// The seven moments of one loop, as loop parts, in the order the yarn travels when the row runs right to left.
const TRACE_RTL = [[7], [6], [5], [4, 3], [2], [1], [0]]
const TRACE_LTR = [[0], [1], [2], [3, 4], [5], [6], [7]]

export function StitchExplorer({ fabric }: { fabric: Fabric }) {
  const { spans, width, height } = useMemo(() => yarnSpans(fabric), [fabric])
  const [colorBy, setColorBy] = useState<ColorBy>('row')
  const [hidden, setHidden] = useState<Span['z'][]>([])
  const [picked, setPicked] = useState<Sel | null>(null)
  const [step, setStep] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  const rows = fabric.rows.length, cols = fabric.rows[0].length
  const sel = picked && picked.row < rows && picked.col < cols ? picked : null
  const pick = (s: Sel | null) => { setPicked(s); setStep(null); setPlaying(false) }
  const move = (dr: number, dc: number) => sel && pick({
    row: Math.min(rows - 1, Math.max(0, sel.row + dr)),
    col: Math.min(cols - 1, Math.max(0, sel.col + dc)),
  })

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      if (step === null) setStep(0)
      else if (step < 6) setStep(step + 1)
      else { setStep(null); setPlaying(false) }
    }, step === null ? 0 : 1300)
    return () => clearTimeout(t)
  }, [playing, step])

  const ltr = sel ? isWrongSideRow(fabric, sel.row) : false
  const order = ltr ? TRACE_LTR : TRACE_RTL
  const type = sel ? fabric.rows[sel.row][sel.col] : 'k'

  const color = (s: Span) =>
    colorBy === 'row' ? (s.row % 2 ? 'b' : 'a')
    : colorBy === 'stitch' ? (fabric.rows[s.row][s.col] === 'k' ? 'a' : 'b')
    : s.z === 1 ? 'a' : s.z === 0 ? 'c' : 'b'

  const look = (s: Span): { opacity: number; hot: boolean } => {
    if (sel && s.row === sel.row && s.col === sel.col) {
      if (step === null) return { opacity: 1, hot: false }
      const at = order.findIndex((parts) => parts.includes(s.part))
      return { opacity: at > step ? 0.25 : 1, hot: at === step }
    }
    if (hidden.includes(s.z)) return { opacity: 0.07, hot: false }
    if (!sel) return { opacity: 1, hot: false }
    return { opacity: s.col === sel.col && Math.abs(s.row - sel.row) === 1 ? 0.6 : 0.1, hot: false }
  }

  // Zoom: fit the picked loop plus the loops directly below and above it.
  let transform = 'translate(0px, 0px) scale(1)'
  if (sel) {
    const cx = PAD + sel.col * CELL.w + CELL.w / 2
    const cy = rowBase(height, sel.row) - CELL.h * 0.6
    const k = Math.min(width / (CELL.w * 3.4), height / (CELL.h * 5))
    transform = `translate(${width / 2 - k * cx}px, ${height / 2 - k * cy}px) scale(${k})`
  }

  const below = sel?.row === 0 ? 'the cast-on loop (not drawn)' : 'the loop below'
  const knitLook = type === 'k'
  const captions = [
    `The yarn arrives from the stitch worked just before, passing ${knitLook ? 'behind' : 'in front of'} the side of ${below}.`,
    `It goes through ${below}, crossing ${knitLook ? 'in front of' : 'behind'} the top of it.`,
    'It climbs to make the first side of the new loop.',
    sel?.row === rows - 1
      ? 'It curves over the top. This arch is the live stitch sitting on your needle.'
      : 'It curves over the top. The stitch in the row above is pulled through this arch.',
    'It comes down the second side.',
    `It goes back through ${below}, crossing ${knitLook ? 'in front of' : 'behind'} the top again.`,
    `It leaves ${knitLook ? 'behind' : 'in front of'} the other side of ${below}, on its way to the next stitch.`,
  ]
  const summary = knitLook
    ? 'This loop was pulled forward through the loop below, so its two legs lie in front and make a V.'
    : 'This loop was pushed back through the loop below, so the top of the lower loop and the strands between stitches lie in front and make a bump.'
  const number = sel ? (ltr ? sel.col + 1 : cols - sel.col) : 0

  return (
    <div className="explorer">
      <div className="toolbar">
        <div className="group" role="group" aria-label="Colour by">
          <span className="group-label">Colour by</span>
          {(['row', 'stitch', 'depth'] as const).map((m) => (
            <button key={m} className="chip" aria-pressed={colorBy === m} onClick={() => setColorBy(m)}>{m === 'stitch' ? 'Knit or purl' : m === 'row' ? 'Row' : 'Depth'}</button>
          ))}
        </div>
        <div className="group" role="group" aria-label="Layers shown">
          <span className="group-label">Layers</span>
          {LAYERS.map(([z, name]) => (
            <button key={z} className="chip" aria-pressed={!hidden.includes(z)}
              onClick={() => setHidden(hidden.includes(z) ? hidden.filter((h) => h !== z) : [...hidden, z])}>{name}</button>
          ))}
        </div>
      </div>

      <figure>
        <figcaption>Yarn path, right side · {sel ? 'tap another stitch, or show the whole fabric' : 'tap any stitch to zoom in'}</figcaption>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Yarn path of the fabric, right side facing">
          <g className="zoom" style={{ transform }}>
            {([-1, 0, 1] as const).map((z) => {
              const layer = spans.filter((s) => s.z === z).map((s) => ({ s, ...look(s) }))
              return (
                <g key={z} fill="none">
                  {layer.map(({ s, opacity, hot }, i) => opacity === 1 && <path key={`e${i}`} d={s.d} className={`edge ${hot ? 'hot' : color(s)}`} />)}
                  {layer.map(({ s, opacity, hot }, i) => <path key={`y${i}`} d={s.d} className={`strand ${hot ? 'hot' : color(s)}`} style={{ opacity }} />)}
                </g>
              )
            })}
            {fabric.rows.map((row, r) => row.map((_, c) => (
              <rect key={`${r}-${c}`} className="hit"
                x={PAD + c * CELL.w} y={rowBase(height, r) - CELL.h * 1.3} width={CELL.w} height={CELL.h}
                onClick={() => pick({ row: r, col: c })} />
            )))}
          </g>
        </svg>
        <div className="legend">
          {LEGEND[colorBy].map(([c, name]) => <span key={c}><i className={`swatch ${c}`} />{name}</span>)}
          {step !== null && <span><i className="swatch hot" />Being traced</span>}
        </div>
      </figure>

      {sel ? (
        <div className="inspect" aria-live="polite">
          <div className="inspect-head">
            <b>Row {sel.row + 1}, stitch {number} · shows as {knitLook ? 'knit' : 'purl'}</b>
            <button className="chip" onClick={() => pick(null)}>Show whole fabric</button>
          </div>
          <p>{step === null ? summary : `${step + 1} of 7. ${captions[step]}`}</p>
          <p className="note">
            This row was worked {ltr ? 'left to right as you see it here, because it is a wrong-side row' : 'right to left'}.
            {isWrongSideRow(fabric, sel.row) && ` On the wrong side the knitter ${knitLook ? 'purled' : 'knitted'} this stitch.`}
            {' '}The trace follows the yarn in the finished fabric, not the hand movements.
          </p>
          <div className="group">
            <button className="btn" onClick={() => { setStep(null); setPlaying(!playing) }}>{playing ? 'Stop' : 'Trace the yarn'}</button>
            <button className="chip" disabled={playing || step === 0} onClick={() => setStep(step === null ? 6 : step - 1)}>Step back</button>
            <button className="chip" disabled={playing} onClick={() => setStep(step === null ? 0 : step === 6 ? null : step + 1)}>Step forward</button>
          </div>
          <div className="group" role="group" aria-label="Move to a neighbouring stitch">
            <span className="group-label">Move</span>
            <button className="chip" aria-label="Stitch to the left" onClick={() => move(0, -1)}>←</button>
            <button className="chip" aria-label="Stitch to the right" onClick={() => move(0, 1)}>→</button>
            <button className="chip" aria-label="Row above" onClick={() => move(1, 0)}>↑</button>
            <button className="chip" aria-label="Row below" onClick={() => move(-1, 0)}>↓</button>
          </div>
        </div>
      ) : (
        <div className="group">
          <button className="chip" onClick={() => pick({ row: Math.floor(rows / 2), col: Math.floor(cols / 2) })}>Pick the middle stitch</button>
        </div>
      )}
    </div>
  )
}
