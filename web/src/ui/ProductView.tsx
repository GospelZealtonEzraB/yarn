import { useId } from 'react'
import { reached, type Product } from '../engine/product'

/**
 * The whole finished item, to scale. What is knitted is filled in and
 * textured, the section in progress is brighter, and a needle marks where the
 * knitter is. Sections not reached yet stay as a dashed outline.
 */
export function ProductView({ product, done, current, unit }: { product: Product; done: number; current: number | null; unit: string }) {
  const id = useId()
  const { lengthCm: L, widthCm: W } = product
  const sideways = L > W * 3 // a scarf is drawn lying on its side
  const k = sideways ? 292 / L : Math.min(150 / W, 210 / L)
  const w = W * k, len = L * k
  const VW = 320, VH = sideways ? w + 96 : len + 44
  const ox = sideways ? 14 : 20 + w / 2, oy = sideways ? 40 + w / 2 : len + 22
  // u runs up the page, or left to right for a piece drawn sideways.
  const pt = (u: number, v: number): [number, number] => (sideways ? [ox + u * k, oy + v * k] : [ox + v * k, oy - u * k])
  const band = (u1: number, u2: number) => {
    const [x1, y1] = pt(u1, -W), [x2, y2] = pt(u2, W)
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) }
  }
  const outline = 'M' + product.outline.map(([u, v]) => pt(u, v).map((n) => n.toFixed(1)).join(',')).join('L') + 'Z'
  const at = reached(product, done)
  const lines = (s: Product['sections'][number], upTo: number) => {
    let d = ''
    const end = Math.min(s.cm[1], upTo)
    if (end <= s.cm[0] || s.texture === 'stockinette') return d
    if (s.texture === 'rib') for (let v = -W / 2; v <= W / 2; v += Math.max(W / 14, 4 / k)) {
      const [x1, y1] = pt(s.cm[0], v), [x2, y2] = pt(end, v)
      d += `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`
    }
    else for (let u = s.cm[0] + 3 / k; u < end; u += 4 / k) {
      const [x1, y1] = pt(u, -W / 2), [x2, y2] = pt(u, W / 2)
      d += `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`
    }
    return d
  }
  const [hx, hy] = pt(at, 0)
  const labelX = ox + w / 2 + 14
  const finished = done >= product.sections[product.sections.length - 1].rows[1]

  return (
    <svg viewBox={`0 0 ${VW} ${VH.toFixed(0)}`} className="product" role="img"
      aria-label={`The finished item, ${Math.round(L)} cm long. ${Math.round((at / L) * 100)} percent knitted.`}>
      <defs>
        <clipPath id={`${id}o`}><path d={outline} /></clipPath>
        <clipPath id={`${id}d`}><rect {...band(0, at)} /></clipPath>
      </defs>
      <path d={outline} className="prod-ghost" />
      <g clipPath={`url(#${id}o)`}>
        {product.sections.map((s) => {
          const end = Math.min(s.cm[1], at)
          if (end <= s.cm[0]) return null
          return (
            <g key={s.step}>
              <rect {...band(s.cm[0], end)} className={s.step === current ? 'prod-now' : 'prod-done'} />
              <path d={lines(s, at)} className="prod-texture" />
            </g>
          )
        })}
      </g>
      <path d={outline} className="prod-edge" clipPath={`url(#${id}d)`} />

      {product.sections.slice(1).map((s) => {
        const [x1, y1] = pt(s.cm[0], -W / 2), [x2, y2] = pt(s.cm[0], W / 2)
        return <path key={s.step} d={`M${x1},${y1}L${x2},${y2}`} className="prod-divider" clipPath={`url(#${id}o)`} />
      })}
      {product.sections.map((s) => {
        const mid = (s.cm[0] + s.cm[1]) / 2
        const state = s.cm[1] <= at ? 'done' : s.step === current ? 'now' : 'todo'
        const [mx, my] = pt(mid, 0)
        const x = sideways ? mx : labelX, y = sideways ? oy + w / 2 + 18 : my + 4
        return (
          <text key={s.step} x={x} y={y} textAnchor={sideways ? 'middle' : 'start'} className={`prod-label ${state}`}>
            {state === 'done' ? '✓ ' : state === 'now' ? '● ' : '○ '}{s.title}
            <tspan className="prod-cm" x={x} dy="12">{Math.round(s.cm[1] - s.cm[0])} cm</tspan>
          </text>
        )
      })}
      {product.marks.map((m) => {
        const [x1, y1] = pt(m.fromCm, W / 2), [x2, y2] = pt(m.toCm, W / 2)
        return <g key={m.label}><path d={`M${x1},${y1}L${x2},${y2}`} className="prod-mark" /><text x={x1 - 8} y={(y1 + y2) / 2 + 3} textAnchor="end" className="prod-cm on-fill">{m.label}</text></g>
      })}

      {!finished && (
        <g className="prod-here">
          {sideways
            ? <path d={`M${hx},${oy - w / 2 - 12}V${oy + w / 2 + 6}`} />
            : <path d={`M${ox - w / 2 - 12},${hy}H${ox + w / 2 + 8}`} />}
          <circle cx={sideways ? hx : ox - w / 2 - 12} cy={sideways ? oy - w / 2 - 12 : hy} r="4" />
          <text x={sideways ? Math.min(Math.max(hx, 60), VW - 60) : ox} y={sideways ? oy - w / 2 - 20 : Math.max(hy - 6, 12)} textAnchor="middle">
            {done === 0 ? 'Start here' : `You are here · ${unit} ${done}`}
          </text>
        </g>
      )}
      <text x={VW / 2} y={VH - 4} textAnchor="middle" className="prod-cm">
        {Math.round(W)} cm wide · {Math.round(L)} cm long · drawn to scale
      </text>
    </svg>
  )
}
