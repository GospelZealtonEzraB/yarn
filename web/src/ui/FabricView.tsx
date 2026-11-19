import { useMemo } from 'react'
import type { Fabric } from '../engine/fabric'
import { STITCHES } from '../engine/stitch'
import { CELL, yarnSpans } from '../engine/yarnPath'

/** The yarn itself, drawn back layer first so every crossing reads over or under. */
export function YarnView({ fabric }: { fabric: Fabric }) {
  const { spans, width, height } = useMemo(() => yarnSpans(fabric), [fabric])
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Yarn path of the fabric, right side facing">
      {([-1, 0, 1] as const).map((z) => {
        const layer = spans.filter((s) => s.z === z)
        return (
          <g key={z} fill="none">
            {layer.map((s, i) => <path key={i} d={s.d} className="yarn-edge" />)}
            {layer.map((s, i) => <path key={i} d={s.d} className={`yarn row${s.row % 2}`} />)}
          </g>
        )
      })}
    </svg>
  )
}

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
