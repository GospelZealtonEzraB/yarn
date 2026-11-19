import { runs } from '../engine/recipe'
import type { StitchId } from '../engine/stitch'

/**
 * Small drawn pictures for steps that are about a result or an arrangement
 * rather than a hand movement. Each one shows only things that can be drawn
 * without guessing: counts, layouts and measurements.
 */

/** A run of the same stitch as one tile, in the colours used everywhere else: knit pink, purl blue, shaping grey. */
export function StitchTile({ type, count }: { type: StitchId; count: number }) {
  const cls = type === 'k' ? 'a' : type === 'p' ? 'b' : 'c'
  const label = { k: 'K', p: 'P', k2tog: 'k2tog', ssk: 'ssk', yo: 'yo', m1l: 'M1L', m1r: 'M1R' }[type]
  return (
    <span className={`tile ${cls}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {type === 'k' && <path d="M5 6l7 12 7-12" />}
        {type === 'p' && <path d="M4 15q8-12 16 0" />}
        {type === 'k2tog' && <path d="M5 18L19 6M5 6l6 6" />}
        {type === 'ssk' && <path d="M19 18L5 6M19 6l-6 6" />}
        {type === 'yo' && <circle cx="12" cy="12" r="6" />}
        {(type === 'm1l' || type === 'm1r') && <path d="M12 5v14M5 12h14" />}
      </svg>
      <b>{type === 'k' || type === 'p' ? `${label}${count}` : label}</b>
    </span>
  )
}

/** A row recipe as tiles in the order you work them, with the repeat bracketed. */
export function RowTiles({ head, body, tail, times }: { head: StitchId[]; body: StitchId[]; tail: StitchId[]; times: number }) {
  const row = (xs: StitchId[], k: string) => runs(xs).map((r, i) => <StitchTile key={`${k}${i}`} {...r} />)
  return (
    <div className="tiles" role="img" aria-label="The stitches of this row, in the order you work them">
      {row(head, 'h')}
      <span className="repeat">{row(body, 'b')}<em>× {times}</em></span>
      {row(tail, 't')}
    </div>
  )
}

const Loops = ({ n, x0, dx, y, first }: { n: number; x0: number; dx: number; y: number; first?: boolean }) => (
  <>{Array.from({ length: n }, (_, i) => <ellipse key={i} cx={x0 + i * dx} cy={y} rx="5" ry="9" className={`pic-loop${first && i === n - 1 ? ' first' : ''}`} />)}</>
)

/** What a finished cast-on looks like, with the count that matters. */
export function CastOnPicture({ count }: { count: number }) {
  return (
    <svg viewBox="0 0 300 110" className="pic" role="img" aria-label={`${count} stitches cast on`}>
      <path d="M14 46H250l16 0" className="pic-needle" /><circle cx="14" cy="46" r="7" className="pic-knob" />
      <Loops n={12} x0={60} dx={15} y={46} first />
      <path d="M52 62H232" className="pic-braid" />
      <path d="M225 55q34 4 64 -22" className="pic-yarn" />
      <text x="150" y="20" textAnchor="middle" className="pic-big">{count} stitches</text>
      <text x="228" y="84" textAnchor="middle" className="pic-note">slip knot = stitch 1</text>
      <text x="100" y="84" textAnchor="middle" className="pic-note">even, loose enough to slide</text>
    </svg>
  )
}

/** Stitches joined into a circle on a circular needle, with the marker and the direction of work. */
export function RingPicture() {
  const cx = 150, cy = 62, rx = 104, ry = 36
  return (
    <svg viewBox="0 0 300 130" className="pic" role="img" aria-label="Stitches joined in a circle with a marker">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="pic-needle thin" />
      {Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return <ellipse key={i} cx={cx + Math.cos(a) * rx} cy={cy + Math.sin(a) * ry} rx="4" ry="8" className="pic-loop" /> })}
      <circle cx={cx} cy={cy + ry} r="9" className="pic-marker" />
      <path d={`M${cx + 30} ${cy + ry + 14}q40 2 70 -16m0 0l-12 0m12 0l-4 11`} className="pic-arrow" />
      <text x={cx} y={cy + 4} textAnchor="middle" className="pic-note">cast-on edge faces the centre</text>
      <text x={cx - 58} y={cy + ry + 26} textAnchor="middle" className="pic-note">marker = start of round</text>
    </svg>
  )
}

/** A small tube held on three double-pointed needles, with a fourth doing the knitting. */
export function DpnPicture() {
  const pts: [number, number][] = [[150, 18], [232, 104], [68, 104]]
  return (
    <svg viewBox="0 0 300 130" className="pic" role="img" aria-label="Stitches on three double-pointed needles with a fourth working needle">
      {pts.map((p, i) => {
        const q = pts[(i + 1) % 3], ex = (q[0] - p[0]) * 0.12, ey = (q[1] - p[1]) * 0.12
        return (
          <g key={i}>
            <path d={`M${p[0] - ex} ${p[1] - ey}L${q[0] + ex} ${q[1] + ey}`} className="pic-needle thin" />
            {Array.from({ length: 6 }, (_, k) => { const t = 0.2 + k * 0.12; return <circle key={k} cx={p[0] + (q[0] - p[0]) * t} cy={p[1] + (q[1] - p[1]) * t} r="5" className="pic-loop" /> })}
          </g>
        )
      })}
      <path d="M150 4L262 96" className="pic-needle thin working" />
      <text x="296" y="30" textAnchor="end" className="pic-note">working needle</text>
      <text x="150" y="124" textAnchor="middle" className="pic-note">a third of the stitches on each needle</text>
    </svg>
  )
}

/** The four things to find on a ball band, numbered to match the steps. */
export function BallBandPicture() {
  return (
    <svg viewBox="0 0 300 120" className="pic" role="img" aria-label="An example ball band with weight, needle size, gauge and length marked">
      <rect x="8" y="14" width="284" height="78" rx="8" className="pic-band" />
      <text x="46" y="50" textAnchor="middle" className="pic-big">DK</text><text x="46" y="70" textAnchor="middle" className="pic-note">weight 3</text>
      <path d="M96 34l22 40" className="pic-needle thin" /><text x="126" y="60" className="pic-note">4 mm</text>
      <rect x="170" y="30" width="44" height="44" className="pic-square" /><text x="192" y="48" textAnchor="middle" className="pic-note">22 sts</text><text x="192" y="64" textAnchor="middle" className="pic-note">28 rows</text><text x="192" y="86" textAnchor="middle" className="pic-note">10 × 10 cm</text>
      <text x="254" y="50" textAnchor="middle" className="pic-note">100 g</text><text x="254" y="66" textAnchor="middle" className="pic-note">220 m</text>
      {[[46, 1], [110, 2], [192, 3], [254, 4]].map(([x, n]) => <g key={n}><circle cx={x} cy="106" r="9" className="pic-num" /><text x={x} y="110" textAnchor="middle" className="pic-numtext">{n}</text></g>)}
      <text x="150" y="10" textAnchor="middle" className="pic-note">example band: yours will have different numbers</text>
    </svg>
  )
}

/** A stockinette swatch with a 10 cm ruler laid across exactly `gauge` stitches. */
export function GaugePicture({ gauge }: { gauge: number }) {
  const g = Math.min(Math.max(Math.round(gauge) || 18, 8), 34), cols = g + 6, w = 280 / cols, h = w * 0.8, rows = 9
  let d = ''
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) d += `M${10 + c * w + 1} ${40 + r * h + 1}l${w / 2 - 1} ${h - 2}l${w / 2 - 1} ${2 - h}`
  const x1 = 10 + 3 * w, x2 = x1 + g * w
  return (
    <svg viewBox={`0 0 300 ${50 + rows * h}`} className="pic" role="img" aria-label={`A swatch with ${g} stitches under a 10 centimetre ruler`}>
      <path d={d} className="pic-stitches" />
      <rect x={x1} y="16" width={x2 - x1} height="14" className="pic-ruler" />
      <path d={`M${x1} 30V${44 + rows * h}M${x2} 30V${44 + rows * h}`} className="pic-guide" />
      <text x={(x1 + x2) / 2} y="27" textAnchor="middle" className="pic-numtext dark">10 cm</text>
      <text x={(x1 + x2) / 2} y="10" textAnchor="middle" className="pic-note">count the Vs between the lines: {g}</text>
    </svg>
  )
}

/** The mitt rectangle folded in half, showing where to sew and where to leave the thumb gap. Drawn to scale. */
export function SeamPicture() {
  const top = 14, k = 5.4, y = (cm: number) => top + cm * k // 17 cm tall mitt
  return (
    <svg viewBox="0 0 300 124" className="pic" role="img" aria-label="Where to sew the mitt seam and where to leave the thumb gap">
      <rect x="96" y={y(0)} width="64" height={17 * k} rx="4" className="pic-band" />
      <path d={`M96 ${y(2)}H160M96 ${y(11)}H160`} className="pic-guide" />
      <path d={`M160 ${y(0)}V${y(4)}`} className="pic-seam" /><path d={`M160 ${y(9)}V${y(17)}`} className="pic-seam" />
      <path d={`M160 ${y(4)}V${y(9)}`} className="pic-gap" />
      <text x="168" y={y(2) + 4} className="pic-note">sew 4 cm</text>
      <text x="168" y={y(6.5) + 4} className="pic-note strong">leave 5 cm open: thumb</text>
      <text x="168" y={y(13) + 4} className="pic-note">sew to the cuff</text>
      <text x="90" y={y(1) + 4} textAnchor="end" className="pic-note">top rib</text>
      <text x="90" y={y(6.5) + 4} textAnchor="end" className="pic-note">hand</text>
      <text x="90" y={y(14) + 4} textAnchor="end" className="pic-note">cuff</text>
      <text x="128" y={y(17) + 12} textAnchor="middle" className="pic-note">fold</text>
    </svg>
  )
}

const ICONS: [RegExp, string][] = [
  [/yarn/i, 'M22 7a15 15 0 100 30 15 15 0 000-30zM10 14q12 4 22 16M8 24q12-2 22 10M18 8q12 8 16 20'],
  [/circular/i, 'M6 8l10 12M38 8L28 20M16 20c-10 22 22 22 12 0'],
  [/double-pointed/i, 'M8 36L20 8M16 38L28 10M24 38L36 10'],
  [/straight needles/i, 'M10 38L30 6M18 40L38 8M8 40h4M16 42h4'],
  [/marker/i, 'M22 13a9 9 0 100 18 9 9 0 000-18z'],
  [/tapestry/i, 'M8 36L34 10M31 8l5 5'],
  [/scissors/i, 'M12 10l20 24M32 10L12 34M10 34a4 4 0 108 0 4 4 0 00-8 0M26 34a4 4 0 108 0 4 4 0 00-8 0'],
  [/tape/i, 'M6 14h32v16H6zM12 14v6M18 14v4M24 14v6M30 14v4'],
]
/** A line drawing for a kit item, chosen by its name. */
export function KitIcon({ name }: { name: string }) {
  const d = ICONS.find(([re]) => re.test(name))?.[1] ?? 'M22 10v24M10 22h24'
  return <svg viewBox="0 0 44 44" className="kit-icon" aria-hidden="true"><path d={d} /></svg>
}
