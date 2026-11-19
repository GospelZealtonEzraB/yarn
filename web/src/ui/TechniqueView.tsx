import { useEffect, useRef, useState } from 'react'
import { blend, curve, type Diagram, type Scene } from '../engine/technique'

interface Item { z: number; d: string; cls: string }

function items(scene: Scene): Item[] {
  const out: Item[] = scene.needles.map((n) => ({ z: n.z, cls: 'needle', d: `M${n.from[0].toFixed(1)},${n.from[1].toFixed(1)}L${n.to[0].toFixed(1)},${n.to[1].toFixed(1)}` }))
  for (const st of scene.strands) out.push({ z: st.z, d: curve(st.pts), cls: st.cls })
  return out.sort((a, b) => a.z - b.z)
}

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
  const frame = blend(frames[i].scene, frames[i + 1].scene, Math.min(Math.max(pos - i, 0), 1))
  const shown = frames[step]

  return (
    <div className="technique">
      <figure>
        <figcaption>Needles and yarn, seen from your side · hands not shown</figcaption>
        <svg viewBox={technique.view.join(' ')} role="img" aria-label={`${technique.name}: ${shown.title}`}>
          <g transform={mirror ? `translate(${technique.view[0] * 2 + technique.view[2]} 0) scale(-1 1)` : undefined} fill="none">
            {items(frame).map((it, n) => it.cls === 'needle'
              ? <path key={n} d={it.d} className="t-needle" />
              : <g key={n}><path d={it.d} className={`t-edge ${it.cls}`} /><path d={it.d} className={`t-yarn ${it.cls}`} /></g>)}
          </g>
        </svg>
        <div className="legend">
          <span><i className="swatch a" />{technique.id === 'bindoff' ? 'Newest stitch and working yarn' : 'Working yarn and new loop'}</span>
          <span><i className="swatch b" />{technique.id === 'bindoff' ? 'Stitch being bound off' : 'Stitch being worked'}</span>
          <span><i className="swatch c" />Other stitches</span>
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
