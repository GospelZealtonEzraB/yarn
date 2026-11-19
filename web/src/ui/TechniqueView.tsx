import { useEffect, useRef, useState } from 'react'
import { between, curve, LEFT_NEEDLE, LEFT_XS, leftStitch, onNeedle, WORKED_AT, Z, type Frame, type P, type Technique } from '../engine/technique'

interface Item { z: number; d: string; cls: string }
const NEEDLE_LENGTH = 190

function scene(f: Frame): Item[] {
  const items: Item[] = []
  const line = (a: P, b: P) => `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`
  items.push({ z: Z.leftNeedle, d: line(LEFT_NEEDLE.from, LEFT_NEEDLE.tip), cls: 'needle' })
  items.push({ z: f.needleZ, d: line(f.tip, onNeedle(f.tip, f.angle, NEEDLE_LENGTH)), cls: 'needle' })
  for (const x of LEFT_XS) {
    const st = leftStitch(x)
    items.push({ z: Z.backLeg, d: curve(st.back), cls: 'rest' }, { z: Z.frontLeg, d: curve(st.front), cls: 'rest' })
  }
  for (const t of WORKED_AT) {
    const p = onNeedle(f.tip, f.angle, t)
    items.push(
      { z: f.needleZ - 0.05, d: curve([[p[0] - 9, p[1] + 44], [p[0] - 9, p[1] + 20], [p[0] - 7, p[1] + 4], [p[0] - 2, p[1] - 7]]), cls: 'rest' },
      { z: f.needleZ + 0.05, d: curve([[p[0] - 2, p[1] - 7], [p[0] + 5, p[1] - 9], [p[0] + 8, p[1] + 5], [p[0] + 9, p[1] + 20], [p[0] + 9, p[1] + 44]]), cls: 'rest' },
    )
  }
  items.push({ z: f.old.back.z, d: curve(f.old.back.pts), cls: 'old' }, { z: f.old.front.z, d: curve(f.old.front.pts), cls: 'old' })
  for (const st of f.yarn) items.push({ z: st.z, d: curve(st.pts), cls: 'work' })
  return items.sort((a, b) => a.z - b.z)
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export function TechniqueView({ technique }: { technique: Technique }) {
  const frames = technique.frames
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
  const frame = between(frames[i], frames[i + 1], Math.min(Math.max(pos - i, 0), 1))
  const shown = frames[step]

  return (
    <div className="technique">
      <figure>
        <figcaption>Needles and yarn, seen from your side · hands not shown</figcaption>
        <svg viewBox="44 34 276 166" role="img" aria-label={`${technique.name}: ${shown.title}`}>
          <g transform={mirror ? 'translate(364 0) scale(-1 1)' : undefined} fill="none">
            {scene(frame).map((it, n) => it.cls === 'needle'
              ? <path key={n} d={it.d} className="t-needle" />
              : <g key={n}><path d={it.d} className={`t-edge ${it.cls}`} /><path d={it.d} className={`t-yarn ${it.cls}`} /></g>)}
          </g>
        </svg>
        <div className="legend">
          <span><i className="swatch a" />Working yarn and new loop</span>
          <span><i className="swatch b" />Stitch being worked</span>
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
