import { useMemo, useState } from 'react'
import { knit, type Construction } from '../engine/fabric'
import { ChartView } from '../ui/FabricView'
import { canDraw } from '../engine/yarnPath'
import { StitchExplorer } from '../ui/StitchExplorer'

const PRESETS: [string, string, Construction][] = [
  ['Stockinette', 'K1', 'round'],
  ['Garter', 'K1', 'flat'],
  ['2×2 rib', 'K2, P2', 'round'],
  ['Seed stitch', 'K1, P1', 'flat'],
  ['Right-leaning decrease', '*K2, k2tog; rep from *', 'round'],
  ['Left-leaning decrease', '*K2, ssk; rep from *', 'round'],
]

export function Lab() {
  const [recipe, setRecipe] = useState('K2, P2')
  const [mode, setMode] = useState<Construction>('round')
  const result = useMemo(() => {
    try {
      // A shaping row is shown once, with plain rows around it so the lean is visible.
      const rows = /k2tog|ssk|yo|m1/i.test(recipe) ? ['K1', 'K1', 'K1', recipe, 'K1', 'K1', 'K1'] : Array(8).fill(recipe)
      return { fabric: knit(12, rows, mode) }
    } catch (e) { return { error: (e as Error).message } }
  }, [recipe, mode])
  const yarnOk = result.fabric && canDraw(result.fabric)
  return (
    <>
      <header className="top">
        <h1>Stitch lab</h1>
        <p className="sub">Type a row of pattern shorthand and see the fabric it makes, worked over 12 stitches.</p>
      </header>
      <section className="card">
        <div className="group">
          {PRESETS.map(([name, r, m]) => (
            <button key={name} className="chip" aria-pressed={recipe === r && mode === m} onClick={() => { setRecipe(r); setMode(m) }}>{name}</button>
          ))}
        </div>
        <div className="fields">
          <label htmlFor="recipe">Row recipe<input id="recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)} spellCheck={false} autoCapitalize="off" /></label>
          <label htmlFor="mode">Worked<select id="mode" value={mode} onChange={(e) => setMode(e.target.value as Construction)}>
            <option value="round">in the round</option><option value="flat">flat, turning each row</option></select></label>
        </div>
        {result.error && <p className="error" role="alert">{result.error}</p>}
        {result.fabric && (
          <>
            {yarnOk ? <StitchExplorer fabric={result.fabric} /> : <p className="sub">The yarn-path view draws knit, purl, k2tog and ssk. Other stitches show in the chart only.</p>}
            <figure className="chart"><figcaption>Chart, right side · blank = knit, dot = purl</figcaption><ChartView fabric={result.fabric} /></figure>
          </>
        )}
      </section>
    </>
  )
}
