import { useEffect, useRef, useState } from 'react'
import { blend, curve, type Diagram, type P, type Scene, type View } from '../engine/technique'

interface Item { z: number; d: string; cls: string }

function items(scene: Scene): Item[] {
  const out: Item[] = scene.needles.map((n) => ({ z: n.z, cls: 'needle', d: `M${n.from[0].toFixed(1)},${n.from[1].toFixed(1)}L${n.to[0].toFixed(1)},${n.to[1].toFixed(1)}` }))
  for (const st of scene.strands) out.push({ z: st.z, d: curve(st.pts), cls: st.cls })
  return out.sort((a, b) => a.z - b.z)
}

/** A small triangle at the end of an arrow, pointing along its last segment. */
function head(pts: P[], size: number): string {
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len
  const tip: P = [b[0] + ux * size * 0.6, b[1] + uy * size * 0.6]
  return `M${tip[0]},${tip[1]}L${b[0] - ux * size - uy * size * 0.7},${b[1] - uy * size + ux * size * 0.7}L${b[0] - ux * size + uy * size * 0.7},${b[1] - uy * size - ux * size * 0.7}Z`
}
/** In the left-handed mirror the two needles swap roles, so their names swap too. */
const flipWords = (t: string) => t.replace(/\b(left|right)\b/g, (w) => (w === 'left' ? 'right' : 'left'))

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export function TechniqueView({ technique }: { technique: Diagram }) {
  const frames = technique.steps
  const [step, setStep] = useState(0)
  const [pos, setPos] = useState(0) // animated position, in frames
  const [playing, setPlaying] = useState(false)
  const [mirror, setMirror] = useState(false)
  const posRef = useRef(0)

  useEffect(() => {
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const from = posRef.current, start = performance.now(), dur = still ? 0 : 900 * Math.max(Math.abs(step - from), 0.3)
    let raf = 0
    const tick = (now: number) => {
      const t = dur ? Math.min((now - start) / dur, 1) : 1
      posRef.current = from + (step - from) * ease(t)
      setPos(posRef.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      if (step < frames.length - 1) setStep(step + 1)
      else setPlaying(false)
    }, 2400)
    return () => clearTimeout(t)
  }, [playing, step, frames.length])

  const i = Math.min(Math.floor(pos), frames.length - 2)
  const t = Math.min(Math.max(pos - i, 0), 1)
  const frame = blend(frames[i].scene, frames[i + 1].scene, t)
  const view = frames[i].view.map((v, n) => v + (frames[i + 1].view[n] - v) * t) as View
  const shown = frames[step]
  const settled = Math.abs(pos - step) < 0.02
  const unit = view[2] / 150 // drawing units per "normal" unit, so labels and arrows keep their size on screen
  const flipX = (x: number) => view[0] * 2 + view[2] - x

  return (
    <div className="technique">
      <figure>
        <figcaption>Needles and yarn, seen from your side · hands not shown</figcaption>
        <svg viewBox={view.join(' ')} role="img" aria-label={`${technique.name}: ${shown.title}`}>
          <g transform={mirror ? `translate(${view[0] * 2 + view[2]} 0) scale(-1 1)` : undefined} fill="none">
            {items(frame).map((it, n) => it.cls === 'needle'
              ? <g key={n}><path d={it.d} className="t-halo needle" /><path d={it.d} className="t-needle" /></g>
              : <g key={n}><path d={it.d} className="t-halo" /><path d={it.d} className={`t-edge ${it.cls}`} /><path d={it.d} className={`t-yarn ${it.cls}`} /></g>)}
            {shown.arrow && (
              <g className="t-arrow" style={{ opacity: settled ? 1 : 0 }}>
                <path d={curve(shown.arrow)} strokeWidth={2.2 * unit} strokeDasharray={`${5 * unit} ${3.5 * unit}`} />
                <path d={head(shown.arrow, 5 * unit)} className="t-arrowhead" />
              </g>
            )}
          </g>
          <g className="t-labels" style={{ opacity: settled ? 1 : 0 }}>
            {shown.labels?.map((l) => {
              const end = (l.side === 'end') !== mirror
              return <text key={l.text} x={mirror ? flipX(l.at[0]) : l.at[0]} y={l.at[1]} fontSize={6.2 * unit} strokeWidth={2.4 * unit} textAnchor={end ? 'end' : 'start'}>{mirror ? flipWords(l.text) : l.text}</text>
            })}
          </g>
        </svg>
        <div className="legend">
          <span><i className="swatch a" />{technique.id === 'bindoff' ? 'Newest stitch and working yarn' : 'Working yarn and new loop'}</span>
          <span><i className="swatch b" />{technique.id === 'bindoff' ? 'Stitch being bound off' : 'Stitch being worked'}</span>
          <span><i className="swatch c" />Other stitches</span>
          {shown.arrow && <span><i className="swatch hot" />What moves in this step</span>}
        </div>
      </figure>
      <div className="inspect" aria-live="polite">
        <b>{step + 1} of {frames.length} · {shown.title}</b>
        <p>{shown.text}</p>
        <div className="group">
          <button className="btn" onClick={() => { if (!playing && step === frames.length - 1) setStep(0); setPlaying(!playing) }}>{playing ? 'Pause' : 'Play'}</button>
          <button className="chip" disabled={step === 0} onClick={() => { setPlaying(false); setStep(step - 1) }}>Step back</button>
          <button className="chip" disabled={step === frames.length - 1} onClick={() => { setPlaying(false); setStep(step + 1) }}>Step forward</button>
          <button className="chip" aria-pressed={mirror} onClick={() => setMirror(!mirror)}>Left-handed mirror</button>
        </div>
      </div>
    </div>
  )
}
