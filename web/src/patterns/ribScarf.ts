import { balanced, rowsFor, stitchPattern } from './stitches'
import type { Pattern, Settings } from './types'

const LENGTH_CM = 150
export const SCARF_STYLES = ['rib2', 'seed', 'moss', 'box', 'basket', 'brokenrib', 'rib1', 'garter']

/**
 * A scarf worked flat in any stitch pattern that lies flat. The cast-on is
 * whole repeats plus half a repeat, so both edges match on the right side.
 */
export function ribScarfPattern(s: Settings, style = 'rib2'): Pattern {
  if (!(s.gauge >= 8 && s.gauge <= 40)) throw new Error('Gauge should be between 8 and 40 stitches per 10 cm.')
  const st = stitchPattern(style)
  const ribbed = style.startsWith('rib')
  const castOn = balanced(st, ((ribbed ? 20 : 18) * s.gauge) / 10)
  const count = Math.round((LENGTH_CM * s.gauge * st.rowFactor) / 10 / 2) * 2
  const rows = rowsFor(st, castOn, count, 'flat')
  const repeat = st.chart.length
  return {
    castOn,
    construction: 'flat',
    halved: false,
    fits: ribbed ? `About 15 cm wide when relaxed and ${LENGTH_CM} cm long. Ribbing pulls in, so it stretches wider.` : `About 18 cm wide and ${LENGTH_CM} cm long.`,
    kit: [
      { name: `${s.yarn} yarn`, qty: 'about 200 g' },
      { name: `Straight needles, ${s.needle}`, qty: '1 pair' },
      { name: 'Tapestry needle', qty: '1' },
      { name: 'Scissors', qty: '1' },
      { name: 'Tape measure', qty: '1' },
    ],
    steps: [
      { title: 'Cast on', picture: 'caston', help: ['caston'], recipe: `CO ${castOn}`, text: `Cast on ${castOn} stitches with the long-tail cast-on.`,
        tip: 'The count is chosen so the pattern starts and ends the same way at both edges.' },
      { title: `Knit the ${st.name.toLowerCase()}`, help: ribbed ? ['rib', 'read'] : ['purl', 'read'], recipe: repeat > 1 ? `${repeat}-row repeat` : rows[0],
        rows, chart: st.chart, cm: LENGTH_CM, until: `the scarf measures ${LENGTH_CM} cm`,
        text: repeat > 2
          ? `The pattern repeats every ${repeat} rows. The card above shows each row as you reach it.`
          : 'The card above shows each row as you reach it. Once the pattern is set you can stop counting and read your stitches.',
        tip: 'Move the yarn between the needles each time you switch, to the front before purls and to the back before knits.' },
      { title: 'Bind off in pattern', picture: 'bindoff', help: ['bindoff'], recipe: 'BO in pattern', text: 'Bind off as usual, but knit the knit stitches and purl the purl stitches as you go. That keeps the edge as stretchy as the scarf.',
        tip: 'Finish on a wrong-side row so the bind-off chain sits on the right side.' },
      { title: 'Weave in the ends', picture: 'done', help: ['weave'], recipe: 'Finish', text: 'Run each tail through the bumps on the wrong side for 5 cm, then back the other way for 2 cm. Trim close.' },
    ],
  }
}
