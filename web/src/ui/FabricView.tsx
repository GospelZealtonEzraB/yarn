import type { Fabric } from '../engine/fabric'
import { STITCHES } from '../engine/stitch'
import { useMemo } from 'react'
import { CELL, yarnSpans } from '../engine/yarnPath'

/** A standard knitting chart. Handles every stitch in the vocabulary. */
export function ChartView({ fabric }: { fabric: Fabric }) {
  const s = CELL.w
  const cols = Math.max(...fabric.rows.map((r) => r.length))
  const n = fabric.rows.length
  return (
    <svg viewBox={`0 0 ${cols * s + 2} ${n * s + 2}`} role="img" aria-label="Stitch chart, right side facing">
      {fabric.rows.map((row, r) => {
        const off = ((cols - row.length) / 2) * s + 1
        return row.map((id, c) => (
          <g key={`${r}-${c}`} transform={`translate(${off + c * s} ${1 + (n - 1 - r) * s})`}>
            <rect width={s} height={s} className="chart-cell" />
            <path d={STITCHES[id].symbol} transform={`scale(${s})`} className="chart-sym" />
          </g>
        ))
      })}
    </svg>
  )
}

/** The yarn path with no controls, for games and thumbnails. */
export function YarnSwatch({ fabric }: { fabric: Fabric }) {
  const { spans, width, height } = useMemo(() => yarnSpans(fabric), [fabric])
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Knitted swatch, right side facing">
      {([-1, 0, 1] as const).map((z) => {
        const layer = spans.filter((s) => s.z === z)
        return (
          <g key={z} fill="none">
            {layer.map((s, i) => <path key={`e${i}`} d={s.d} className={`edge ${s.row % 2 ? 'b' : 'a'}`} />)}
            {layer.map((s, i) => <path key={`y${i}`} d={s.d} className={`strand ${s.row % 2 ? 'b' : 'a'}`} />)}
          </g>
        )
      })}
    </svg>
  )
}

const CW = 6, CH = 5, WINDOW = 100

/**
 * The whole piece, stitch for stitch, as far as it has been knitted. Rows the
 * knitter has not reached are shown as faint bars so the final shape is visible.
 */
export function PieceView({ fabric, done, fresh }: { fabric: Fabric; done: number; fresh: number }) {
  const total = fabric.rows.length
  const cols = Math.max(fabric.castOn, ...fabric.rows.map((r) => r.length))
  const start = total > WINDOW ? Math.min(Math.max(done - 60, 0), total - WINDOW) : 0
  const shown = Math.min(total, WINDOW)
  const d = { old: '', fresh: '', dec: '', ghost: '' }
  for (let i = 0; i < shown; i++) {
    const r = start + i, row = fabric.rows[r]
    const y = (shown - 1 - i) * CH, x0 = ((cols - row.length) / 2) * CW
    if (r >= done) { d.ghost += `M${x0 + 1},${y + CH / 2}h${row.length * CW - 2}`; continue }
    const key = r >= done - fresh ? 'fresh' : 'old'
    row.forEach((st, c) => {
      const x = x0 + c * CW
      if (st === 'p') d[key] += `M${x + 1},${y + CH / 2}h${CW - 2}`
      else if (st === 'k') d[key] += `M${x + 1},${y + 1}l${CW / 2 - 1},${CH - 2}l${CW / 2 - 1},${2 - CH}`
      else d.dec += `M${x + 1},${y + CH - 1}l${CW - 2},${2 - CH}`
    })
  }
  return (
    <svg viewBox={`-4 -4 ${cols * CW + 8} ${shown * CH + 8}`} className="piece" role="img"
      aria-label={`The piece so far: ${done} of ${total} rows`}>
      <path d={d.ghost} className="ghost" /><path d={d.old} className="old" /><path d={d.fresh} className="fresh" /><path d={d.dec} className="dec" />
    </svg>
  )
}
