import { useMemo, useState } from 'react'
import { knit, type Construction } from './engine/fabric'
import { beanie } from './patterns/beanie'
import { ChartView } from './ui/FabricView'
import { StitchExplorer } from './ui/StitchExplorer'

const PRESETS: [string, string, Construction][] = [
  ['Stockinette', 'K1', 'round'],
  ['Garter', 'K1', 'flat'],
  ['2×2 rib', 'K2, P2', 'round'],
  ['Seed stitch', 'K1, P1', 'flat'],
  ['Crown decrease', '*K2, k2tog; rep from *', 'round'],
]

export default function App() {
  const [recipe, setRecipe] = useState('K2, P2')
  const [mode, setMode] = useState<Construction>('round')
  const [gauge, setGauge] = useState(18)
  const [head, setHead] = useState(56)

  const result = useMemo(() => {
    try {
      const rows = recipe.includes('k2tog') || recipe.includes('ssk') ? [recipe] : Array(8).fill(recipe)
      return { fabric: knit(12, rows, mode) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [recipe, mode])
  const yarnOk = result.fabric?.rows.every((r) => r.every((s) => s === 'k' || s === 'p'))
  const hat = useMemo(() => { try { return beanie({ gauge, headCm: head }) } catch { return null } }, [gauge, head])

  return (
    <main>
      <header>
        <p className="eyebrow">Loopwise · stitch lab</p>
        <h1>Type a row. See the fabric.</h1>
        <p className="lede">Both pictures below are drawn from the stitches you type, worked over 12 cast-on stitches. Nothing here is a stored image.</p>
      </header>

      <section className="panel">
        <div className="chips">
          {PRESETS.map(([name, r, m]) => (
            <button key={name} className="chip" aria-pressed={recipe === r && mode === m} onClick={() => { setRecipe(r); setMode(m) }}>{name}</button>
          ))}
        </div>
        <div className="fields">
          <label htmlFor="recipe">Row recipe<input id="recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)} spellCheck={false} /></label>
          <label htmlFor="mode">Worked<select id="mode" value={mode} onChange={(e) => setMode(e.target.value as Construction)}>
            <option value="round">in the round</option><option value="flat">flat, turning each row</option></select></label>
        </div>
        {result.error && <p className="error" role="alert">{result.error}</p>}
        {result.fabric && (
          <>
            {yarnOk ? <StitchExplorer fabric={result.fabric} /> : <p className="note">The yarn-path view draws knit and purl so far. Shaping stitches show in the chart until their loop geometry is added and reviewed.</p>}
            <figure className="chart"><figcaption>Chart, right side · blank = knit, dot = purl</figcaption><ChartView fabric={result.fabric} /></figure>
          </>
        )}
      </section>

      <section className="panel">
        <h2>Beanie calculator</h2>
        <div className="fields">
          <label htmlFor="gauge">Stitches per 10 cm<input id="gauge" type="number" min={8} max={40} value={gauge} onChange={(e) => setGauge(+e.target.value)} /></label>
          <label htmlFor="head">Head, cm<input id="head" type="number" min={30} max={70} value={head} onChange={(e) => setHead(+e.target.value)} /></label>
        </div>
        {hat ? (
          <>
            <p>Cast on <b>{hat.castOn}</b> stitches. The hat measures {hat.finishedCm} cm around and stretches to fit. The crown has {hat.sections} wedges.</p>
            <ol className="steps">{hat.steps.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.text}</span><code>{s.recipe}</code></li>)}</ol>
          </>
        ) : <p className="error">Enter a gauge between 8 and 40 and a head size between 30 and 70 cm.</p>}
      </section>
    </main>
  )
}
