import { describe, expect, it } from 'vitest'
import { inWords, parseRow, produced, runs } from './recipe'
import { isWrongSideRow, knit } from './fabric'
import { yarnSpans } from './yarnPath'
import { headForm, product, profile, reached, wornProfile } from './product'
import { between, BINDOFF, blend, DIAGRAMS, KNIT, PURL, Z } from './technique'
import { beanie, crownRecipes } from '../patterns/beanie'
import { needleFor, PROJECTS } from '../patterns/catalog'
import { LESSONS, STAGES } from '../content/lessons'
import { EXTRAS } from '../content/extras'
import { checkRequest, explain, parseCheck, replyText } from './coach'
import { checkPattern, checkPlan, expand, normalise, toPattern, type Plan } from '../agent/plan'
import { findProject, projectsFor } from '../patterns/catalog'
import { design, DESIGNER, MAX_TURNS } from '../agent/run'
import { runTool, TOOLS } from '../agent/tools'
import { INITIAL } from '../store'
import beaniePlan from '../agent/fixtures/weekend-beanie.json'
import { balanced, repeatWidth, rowsFor, STITCH_PATTERNS } from '../patterns/stitches'
import { classify } from './product'
import { withMistake, workingOrder } from './games'

const look = (rows: string[][]) => rows.map((r) => r.join(''))

describe('recipes', () => {
  it('repeats across the row', () => expect(parseRow('K2, P2', 8).join('')).toBe('kkppkkpp'))
  it('handles edge stitches around a repeat', () =>
    expect(parseRow('K1, *K2, P2; rep from *, K1', 10).join('')).toBe('kkkppkkppk'))
  it('refuses a repeat that does not fit', () => expect(() => parseRow('K2, P2', 10)).toThrow(/does not fit/))
  it('refuses unknown stitches', () => expect(() => parseRow('K2, zz', 4)).toThrow(/not a stitch/))
  it('counts decreases', () => expect(produced(parseRow('*K2, k2tog; rep from *', 8))).toBe(6))
})

describe('fabric, seen from the right side', () => {
  it('knit every row flat is garter: ridges on alternate rows', () =>
    expect(look(knit(4, ['K1', 'K1', 'K1', 'K1'], 'flat').rows)).toEqual(['kkkk', 'pppp', 'kkkk', 'pppp']))
  it('knit every round is stockinette', () =>
    expect(look(knit(4, ['K1', 'K1', 'K1'], 'round').rows)).toEqual(['kkkk', 'kkkk', 'kkkk']))
  it('knit a row, purl a row flat is stockinette', () =>
    expect(look(knit(4, ['K1', 'P1', 'K1', 'P1'], 'flat').rows)).toEqual(['kkkk', 'kkkk', 'kkkk', 'kkkk']))
  it('flat ribbing lines up only when wrong-side rows swap knits and purls', () =>
    expect(look(knit(8, ['K2, P2', 'K2, P2'], 'flat').rows)).toEqual(['ppkkppkk', 'ppkkppkk']))
  it('rows are shown in viewing order, mirrored from working order', () =>
    expect(look(knit(5, ['K1, *P1; rep from *'], 'round').rows)).toEqual(['ppppk']))
})

describe('working direction', () => {
  it('only odd rows of flat knitting are wrong-side rows', () => {
    const flat = knit(4, ['K1', 'K1'], 'flat'), round = knit(4, ['K1', 'K1'], 'round')
    expect([0, 1].map((r) => isWrongSideRow(flat, r))).toEqual([false, true])
    expect([0, 1].map((r) => isWrongSideRow(round, r))).toEqual([false, false])
  })
})

describe('yarn path', () => {
  it('labels the eight parts of each loop left to right', () =>
    expect(yarnSpans(knit(2, ['K1'], 'round')).spans.map((s) => s.part)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]))
  const z = (type: string) => yarnSpans(knit(1, [type], 'round')).spans.map((s) => s.z)
  it('knit: legs in front, sinkers behind', () => expect(z('K1')).toEqual([-1, 1, 0, 0, 0, 0, 1, -1]))
  it('purl is the exact mirror in depth', () => expect(z('P1')).toEqual(z('K1').map((v) => -v || 0)))
  it('draws eight spans per stitch as one unbroken strand per row', () => {
    const { spans } = yarnSpans(knit(6, ['K2, P1', 'K1'], 'round'))
    expect(spans).toHaveLength(2 * 6 * 8)
    const row0 = spans.filter((s) => s.row === 0)
    for (let i = 1; i < row0.length; i++) {
      expect(row0[i].d.slice(1, row0[i].d.indexOf('C'))).toBe(row0[i - 1].d.split(' ').pop())
    }
  })
  it('says so instead of drawing a stitch it cannot draw correctly', () =>
    expect(() => yarnSpans(knit(4, ['*K1, M1L, K1; rep from *'], 'round'))).toThrow(/chart view/))
})

describe('shaping in the yarn path', () => {
  const headZ = (f: ReturnType<typeof yarnSpans>, row: number, col: number) => f.spans.find((s) => s.row === row && s.col === col && s.part === 3)!.z
  it('k2tog passes through two loops and the left one lies on top (leans right)', () => {
    const f = yarnSpans(knit(4, ['K1', '*K2, k2tog; rep from *'], 'round'))
    // Rows are in viewing order, so the k2tog worked last sits at the left: columns 0 and 1 below feed it.
    const dec = f.stitches[1].find((s) => s.type === 'k2tog')!
    expect(dec.parents).toHaveLength(2)
    const [l, r] = dec.parents
    expect(headZ(f, 0, l)).toBeGreaterThan(headZ(f, 0, r))
    expect(f.stitches[0][l].headX).toBe(dec.x)
    expect(f.stitches[0][r].headX).toBe(dec.x)
    expect(dec.x).toBe((f.stitches[0][l].x + f.stitches[0][r].x) / 2)
  })
  it('ssk is the mirror: the right loop lies on top (leans left)', () => {
    const f = yarnSpans(knit(4, ['K1', '*K2, ssk; rep from *'], 'round'))
    const [l, r] = f.stitches[1].find((s) => s.type === 'ssk')!.parents
    expect(headZ(f, 0, r)).toBeGreaterThan(headZ(f, 0, l))
  })
  it('the new loop of a decrease still comes out in front of both loops below', () => {
    const f = yarnSpans(knit(4, ['K1', '*K2, k2tog; rep from *'], 'round'))
    const dec = f.stitches[1].find((s) => s.type === 'k2tog')!
    const leg = f.spans.find((s) => s.row === 1 && s.col === dec.col && s.part === 1)!.z
    for (const p of dec.parents) expect(leg).toBeGreaterThan(headZ(f, 0, p))
  })
  it('yarn over is refused for now rather than drawn crowded', () =>
    expect(() => yarnSpans(knit(4, ['K1', '*K2, yo, k2tog; rep from *'], 'round'))).toThrow(/chart view/))
  it('every loop below a row is claimed by exactly one stitch above', () => {
    const f = yarnSpans(knit(12, ['K1', '*K2, k2tog; rep from *', 'K1', '*K1, ssk; rep from *', 'K1'], 'round'))
    for (let r = 0; r < f.stitches.length - 1; r++) {
      expect(f.stitches[r].every((s) => s.child !== null)).toBe(true)
      expect(f.stitches[r + 1].flatMap((s) => s.parents)).toEqual(f.stitches[r].map((s) => s.col))
    }
  })
})

describe('beanie template', () => {
  it.each([[22, 108, 9], [18, 88, 8], [14, 72, 8]])('gauge %i casts on %i in %i wedges', (gauge, castOn, sections) => {
    const b = beanie({ gauge, headCm: 56 })
    expect([b.castOn, b.sections]).toEqual([castOn, sections])
  })
  it('works for every sensible gauge and head size, and the crown really knits down to the stated count', () => {
    for (let gauge = 10; gauge <= 34; gauge++) for (let headCm = 36; headCm <= 64; headCm += 2) {
      const b = beanie({ gauge, headCm })
      expect(b.castOn % 4).toBe(0)
      expect(b.finishedCm).toBeLessThan(headCm)
      expect(b.finishedCm).toBeGreaterThan(headCm * 0.75)
      const f = knit(b.castOn, crownRecipes(b), 'round') // throws if any round does not fit
      expect(f.rows[f.rows.length - 1]).toHaveLength(b.crownCounts[b.crownCounts.length - 1])
      expect(f.rows[0]).toHaveLength(b.crownCounts[0])
    }
  })
})

describe('every project and lesson the app ships', () => {
  const settings = (gauge: number) => ({ gauge, headCm: 56, handCm: 19, yarn: 'Test', needle: needleFor(gauge) })
  it('each pattern can be worked from cast-on to the last row at every gauge', () => {
    for (const p of PROJECTS) if (p.build) for (let gauge = 10; gauge <= 34; gauge++) {
      const pattern = p.build(settings(gauge))
      const f = knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), pattern.construction)
      expect(f.rows.length).toBeGreaterThan(10)
      expect(pattern.kit.length).toBeGreaterThan(2)
    }
  })
  it('the beanie text quotes the counts the engine actually reaches', () => {
    const pattern = PROJECTS.find((p) => p.id === 'beanie')!.build!(settings(18))
    const f = knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), 'round')
    expect(pattern.steps[0].text).toContain('88')
    expect(f.rows[f.rows.length - 1]).toHaveLength(8)
    expect(pattern.steps[5].text).toContain('remaining 8 stitches')
  })
  it('the scarf keeps its stitch count and ends on a whole ridge', () => {
    const pattern = PROJECTS.find((p) => p.id === 'scarf')!.build!(settings(18))
    const rows = pattern.steps.flatMap((s) => s.rows ?? [])
    expect(pattern.castOn).toBe(32)
    expect(rows.length % 2).toBe(0)
  })
  it('flat ribbing lines up: every column is the same stitch on every row, with knit columns at both edges', () => {
    for (const id of ['ribscarf', 'mitts']) for (const gauge of [12, 18, 22, 30]) {
      const pattern = PROJECTS.find((p) => p.id === id)!.build!(settings(gauge))
      const ribRows = knit(pattern.castOn, pattern.steps[1].rows!, 'flat').rows
      for (const row of ribRows) expect(row).toEqual(ribRows[0])
      expect(ribRows[0].slice(0, 2).join('') + ribRows[0].slice(-2).join('')).toBe('kkkk')
    }
  })
  it('the mitts are stockinette between two bands of ribbing, with every section an even number of rows', () => {
    const pattern = PROJECTS.find((p) => p.id === 'mitts')!.build!(settings(18))
    const [cuff, hand, top] = [1, 2, 3].map((i) => pattern.steps[i].rows!)
    for (const rows of [cuff, hand, top]) expect(rows.length % 2).toBe(0)
    const f = knit(pattern.castOn, [...cuff, ...hand, ...top], 'flat')
    for (const row of f.rows.slice(cuff.length, cuff.length + hand.length)) expect(row.every((s) => s === 'k')).toBe(true)
    expect(pattern.castOn % 4).toBe(2)
    expect(pattern.castOn / 18 * 10).toBeLessThan(19)
  })
  it('every lesson drawing is valid knit and purl fabric', () => {
    for (const l of LESSONS) if (l.see) expect(() => yarnSpans(knit(l.see!.castOn, l.see!.rows, l.see!.construction))).not.toThrow()
  })
  it('lesson ids are unique and every stage is defined', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    for (const l of LESSONS) expect(STAGES.some((s) => s.n === l.stage)).toBe(true)
  })
  it('the stockinette lesson really draws stockinette, the knit lesson garter', () => {
    const draw = (id: string) => { const s = LESSONS.find((l) => l.id === id)!.see!; return knit(s.castOn, s.rows, s.construction).rows.map((r) => r[0]).join('') }
    expect(draw('stockinette')).toBe('kkkkkkkk')
    expect(draw('knit')).toBe('kpkpkpkp')
  })
})

describe('technique diagrams', () => {
  const both = [KNIT, PURL]
  it('the working yarn is one unbroken strand in every keyframe', () => {
    for (const t of both) for (const f of t.frames) for (let i = 1; i < 4; i++) {
      expect(f.yarn[i].pts[0]).toEqual(f.yarn[i - 1].pts[f.yarn[i - 1].pts.length - 1])
    }
  })
  it('keyframes have matching shapes, so every in-between scene is well formed', () => {
    for (const t of both) for (let i = 1; i < t.frames.length; i++) {
      const mid = between(t.frames[i - 1], t.frames[i], 0.5)
      expect(mid.yarn.flatMap((s) => s.pts.flat()).every(Number.isFinite)).toBe(true)
      expect(mid.old.front.pts).toHaveLength(5)
      expect(mid.old.back.pts).toHaveLength(4)
    }
  })
  it('knit keeps the yarn behind the work, purl keeps it in front', () => {
    expect(KNIT.frames.every((f) => f.yarn[3].z === Z.behind)).toBe(true)
    expect(PURL.frames.every((f) => f.yarn[3].z === Z.front)).toBe(true)
  })
  it('the wrap passes in front of the right needle but behind the left needle side it should', () => {
    const k = KNIT.frames[2], p = PURL.frames[2]
    expect(k.yarn[1].z).toBeGreaterThan(k.needleZ)
    expect(k.yarn[1].z).toBeLessThan(Z.leftNeedle) // knit wrap runs between the needles
    expect(p.yarn[1].z).toBeGreaterThan(p.needleZ) // purl wrap goes over the top of the right needle
    expect(p.yarn[2].z).toBeLessThan(p.needleZ) // then down behind it
    expect(p.yarn[2].z).toBeGreaterThan(Z.leftNeedle) // between the two needles
  })
  it('the needle enters behind the front leg of the stitch: knit ends behind the left needle, purl in front of it', () => {
    expect(KNIT.frames[1].needleZ).toBeLessThan(Z.leftNeedle)
    expect(PURL.frames[1].needleZ).toBeGreaterThan(Z.leftNeedle)
    for (const t of both) expect(t.frames[1].needleZ).toBeLessThan(Z.frontLeg)
  })
  it('the finished stitch is mounted with its leading leg in front of the needle', () => {
    for (const t of both) {
      const f = t.frames[t.frames.length - 1]
      expect(f.yarn[1].z).toBeGreaterThan(f.needleZ)
      expect(f.yarn[2].z).toBeLessThan(f.needleZ)
    }
  })
  it('a finished knit lies in front of the old stitch, a finished purl has the old stitch top in front', () => {
    const k = KNIT.frames[4], p = PURL.frames[4]
    expect(Math.max(k.old.back.z, k.old.front.z)).toBeLessThan(Math.min(...k.yarn.map((s) => s.z)))
    expect(p.old.front.z).toBeGreaterThan(Math.max(...p.yarn.map((s) => s.z)))
  })
})

describe('generic diagrams', () => {
  it('every step has a 5:3 view, and its arrow and labels sit inside that view', () => {
    for (const d of Object.values(DIAGRAMS)) for (const step of d.steps) {
      const [x, y, w, h] = step.view
      expect(w / h).toBeCloseTo(5 / 3, 1)
      const inside = (p: number[]) => p[0] >= x && p[0] <= x + w && p[1] >= y && p[1] <= y + h
      for (const p of step.arrow ?? []) expect(inside(p), `${d.id} ${step.title} arrow`).toBe(true)
      for (const l of step.labels ?? []) {
        expect(inside(l.at), `${d.id} ${step.title} label ${l.text}`).toBe(true)
        // Rough text width, so a label never runs off the edge of the picture.
        const reach = l.text.length * 3.3 * (w / 150)
        const far = l.side === 'start' ? l.at[0] + reach : l.at[0] - reach
        expect(far >= x && far <= x + w, `${d.id} ${step.title} label "${l.text}" fits`).toBe(true)
      }
    }
  })
  it('every step of a diagram has the same parts, so steps can blend into each other', () => {
    for (const d of Object.values(DIAGRAMS)) for (let i = 1; i < d.steps.length; i++) {
      const a = d.steps[i - 1].scene, b = d.steps[i].scene
      expect(b.needles).toHaveLength(a.needles.length)
      expect(b.strands.map((s) => [s.pts.length, s.cls])).toEqual(a.strands.map((s) => [s.pts.length, s.cls]))
      expect(blend(a, b, 0.5).strands.flatMap((s) => s.pts.flat()).every(Number.isFinite)).toBe(true)
    }
  })
  it('bind-off: the lifted stitch encloses the newer stitch and the needle it is passed over', () => {
    for (const step of BINDOFF.steps) {
      const lifted = step.scene.strands.filter((s) => s.cls === 'old')
      const rightNeedle = step.scene.needles[1].z
      const newer = step.scene.strands.filter((s) => s.cls === 'work').map((s) => s.z)
      expect(Math.min(...lifted.map((s) => s.z))).toBeLessThan(Math.min(rightNeedle, ...newer.filter((z) => z > 0)))
      expect(Math.max(...lifted.map((s) => s.z))).toBeGreaterThan(Math.max(rightNeedle, ...newer))
    }
  })
  it('bind-off: the left needle works in front of the right needle', () => {
    for (const step of BINDOFF.steps) expect(step.scene.needles[0].z).toBeGreaterThan(step.scene.needles[1].z)
  })
  it('bind-off: the lifted stitch keeps its feet in the fabric while its top moves', () => {
    const feet = (i: number) => BINDOFF.steps[i].scene.strands.filter((s) => s.cls === 'old').map((s, n) => (n === 0 ? s.pts[0] : s.pts[s.pts.length - 1]))
    expect(feet(2)).toEqual(feet(0))
  })
})

describe('games', () => {
  it('chart reader: right-side rows read right to left as drawn', () =>
    expect(workingOrder(['k', 'k', 'p'], false)).toEqual(['p', 'k', 'k']))
  it('chart reader: wrong-side rows read left to right with every symbol flipped', () =>
    expect(workingOrder(['k', 'k', 'p'], true)).toEqual(['p', 'p', 'k']))
  it('chart reader agrees with the fabric engine about what a flat row looks like from the front', () => {
    // Work row 2 of a chart on the wrong side and check the engine shows the charted symbols on the right side.
    const charted: ('k' | 'p')[] = ['k', 'p', 'p', 'k']
    const worked = workingOrder(charted, true).map((s) => s.toUpperCase() + '1').join(', ')
    expect(knit(4, ['K1', worked], 'flat').rows[1]).toEqual(charted)
  })
  it('spot the mistake changes exactly one stitch and leaves the original alone', () => {
    const clean = knit(12, Array(8).fill('K2, P2'), 'round')
    const bad = withMistake(clean, 3, 5)
    const diff = bad.rows.flatMap((r, i) => r.map((s, j) => (s === clean.rows[i][j] ? 0 : 1) as number)).reduce((a, b) => a + b, 0)
    expect(diff).toBe(1)
    expect(clean.rows[3][5]).not.toBe(bad.rows[3][5])
  })
})

describe('follow-along text', () => {
  it('turns shorthand into plain sentences', () => {
    expect(inWords('K1')).toBe('Knit every stitch.')
    expect(inWords('P1')).toBe('Purl every stitch.')
    expect(inWords('K2, P2')).toBe('Knit 2 and purl 2, and repeat to the end.')
    expect(inWords('*K9, k2tog; rep from *')).toBe('Repeat knit 9 and knit 2 together across.')
    expect(inWords('*k2tog; rep from *')).toBe('Repeat knit 2 together across.')
    expect(inWords('*K2, P2; rep from *, K2')).toBe('Repeat knit 2 and purl 2 across, then finish with knit 2.')
  })
  it('row tiles collapse runs of knit or purl but keep each decrease separate', () => {
    expect(runs(parseRow('*K9, k2tog; rep from *', 22))).toEqual([{ type: 'k', count: 9 }, { type: 'k2tog', count: 1 }, { type: 'k', count: 9 }, { type: 'k2tog', count: 1 }])
    expect(runs(['k', 'k', 'p', 'p'])).toEqual([{ type: 'k', count: 2 }, { type: 'p', count: 2 }])
    expect(runs(['k2tog', 'k2tog'])).toHaveLength(2)
  })
  it('every row of every shipped pattern can be put into words', () => {
    const settings = { gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }
    for (const p of PROJECTS) if (p.build) for (const step of p.build(settings).steps) for (const row of step.rows ?? []) {
      expect(inWords(row)).toMatch(/^[A-Z].*\.$/)
    }
  })
  it('every lesson has a drill and troubleshooting, and nothing is orphaned', () => {
    for (const l of LESSONS) {
      expect(EXTRAS[l.id], l.id).toBeDefined()
      expect(EXTRAS[l.id].troubles.length).toBeGreaterThanOrEqual(2)
    }
    expect(Object.keys(EXTRAS).sort()).toEqual(LESSONS.map((l) => l.id).sort())
  })
  it('projects only point at lessons and stages that exist', () => {
    const ids = new Set(LESSONS.map((l) => l.id))
    const settings = { gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }
    for (const p of PROJECTS) {
      for (const n of p.needs ?? []) expect(ids.has(n), `${p.id} needs ${n}`).toBe(true)
      if (p.build) for (const step of p.build(settings).steps) for (const h of step.help ?? []) expect(ids.has(h), `${p.id} ${step.title}`).toBe(true)
    }
    for (const st of STAGES) for (const id of st.projects) expect(PROJECTS.some((p) => p.id === id && p.build)).toBe(true)
  })
  it('a project never needs a lesson from a later stage than its own', () => {
    for (const p of PROJECTS) for (const n of p.needs ?? []) expect(LESSONS.find((l) => l.id === n)!.stage, `${p.id} needs ${n}`).toBeLessThanOrEqual(p.stage)
  })
})

describe('3D shape', () => {
  const settings = { gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }
  const hat = () => {
    const pattern = PROJECTS.find((p) => p.id === 'beanie')!.build!(settings)
    const fabric = knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), 'round')
    return profile(product(pattern, fabric, 18))
  }
  it('the brim ring has the circumference of the cast-on stitches', () =>
    expect(hat()[0][0] * 2 * Math.PI).toBeCloseTo((88 / 18) * 10, 5))
  it('the surface is never longer than the knitting: each step along the profile covers at most the row length it represents', () => {
    const p = hat()
    for (let i = 1; i < p.length; i++) {
      const along = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])
      expect(along).toBeLessThanOrEqual(p[i][2] - p[i - 1][2] + 1e-9)
    }
  })
  it('the sides rise straight and the crown curves over: height gained per cm is less in the crown than in the body', () => {
    const p = hat()
    const rise = (from: number, to: number) => (p.find((q) => q[2] >= to)![1] - p.find((q) => q[2] >= from)![1]) / (to - from)
    expect(rise(6, 12)).toBeCloseTo(1, 5)
    expect(rise(16, 21)).toBeLessThan(0.9)
    expect(p[p.length - 1][0]).toBeLessThan(p[0][0] / 4)
  })
})

describe('hat as worn', () => {
  const settings = { gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }
  const shape = (headCm = 56) => {
    const pattern = PROJECTS.find((p) => p.id === 'beanie')!.build!({ ...settings, headCm })
    return product(pattern, knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), 'round'), 18)
  }
  it('the head is as big around as its measurement', () => expect(headForm(56).a * 2 * Math.PI).toBeCloseTo(56, 6))
  it('the worn hat keeps its knitted length: the path over the head is as long as the hat', () => {
    const p = shape(), w = wornProfile(p, 56)
    let along = 0
    for (let i = 1; i < w.length; i++) along += Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1])
    expect(along).toBeGreaterThan(p.lengthCm * 0.93)
    expect(along).toBeLessThan(p.lengthCm * 1.05)
  })
  it('it starts at the brim, ends at the crown, and sits on the head, never inside it', () => {
    const p = shape(), w = wornProfile(p, 56), { a, b } = headForm(56)
    expect(w[0][2]).toBeCloseTo(0, 1)
    expect(w[w.length - 1][2]).toBe(p.lengthCm)
    for (let i = 1; i < w.length; i++) expect(w[i][2]).toBeGreaterThanOrEqual(w[i - 1][2])
    for (const [r, y] of w) if (y <= b) expect((r / a) ** 2 + (y / b) ** 2).toBeGreaterThanOrEqual(1 - 1e-6)
  })
  it('the brim is stretched: wider worn than relaxed, and no wider than the head', () => {
    const p = shape(), brim = wornProfile(p, 56)[0][0], relaxed = profile(p)[0][0]
    expect(brim).toBeGreaterThan(relaxed)
    expect(brim).toBeLessThan(headForm(56).a + 0.5)
  })
  it('works across head sizes', () => {
    for (const cm of [40, 48, 56, 62]) expect(wornProfile(shape(cm), cm).flat().every(Number.isFinite)).toBe(true)
  })
})

describe('finished-product picture', () => {
  const settings = { gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }
  const make = (id: string) => {
    const pattern = PROJECTS.find((p) => p.id === id)!.build!(settings)
    const fabric = knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), pattern.construction)
    return { pattern, fabric, shape: product(pattern, fabric, settings.gauge) }
  }
  it('every project has a shape whose sections cover all its rows and all its length, in order', () => {
    for (const p of PROJECTS) if (p.build) {
      const { fabric, shape } = make(p.id)
      expect(shape.sections[0].rows[0]).toBe(0)
      expect(shape.sections[shape.sections.length - 1].rows[1]).toBe(fabric.rows.length)
      for (let i = 1; i < shape.sections.length; i++) {
        expect(shape.sections[i].rows[0]).toBe(shape.sections[i - 1].rows[1])
        expect(shape.sections[i].cm[0]).toBe(shape.sections[i - 1].cm[1])
      }
      expect(shape.outline.flat().every(Number.isFinite)).toBe(true)
    }
  })
  it('the beanie is a hat: half the circumference wide, ribbed brim, plain body, crown that narrows', () => {
    const { shape } = make('beanie')
    expect(shape.widthCm).toBeCloseTo(88 / 18 * 10 / 2, 5)
    expect(shape.sections.map((s) => s.texture)).toEqual(['rib', 'stockinette', 'stockinette'])
    const widths = shape.outline.slice(shape.outline.length / 2).map(([, v]) => v)
    expect(widths[0]).toBeLessThan(widths[widths.length - 1] / 4) // top of the crown is far narrower than the brim
    expect(shape.lengthCm).toBeGreaterThan(19)
    expect(shape.lengthCm).toBeLessThan(24)
  })
  it('the scarves know their texture and the mitts mark the thumb gap inside their length', () => {
    expect(make('scarf').shape.sections[0].texture).toBe('garter')
    expect(make('ribscarf').shape.sections[0].texture).toBe('rib')
    const mitts = make('mitts').shape
    expect(mitts.sections.map((s) => s.texture)).toEqual(['rib', 'stockinette', 'rib'])
    expect(mitts.marks[0].fromCm).toBeGreaterThan(0)
    expect(mitts.marks[0].toCm).toBeLessThan(mitts.lengthCm)
  })
  it('the progress marker moves from the cast-on edge to the far end, never backwards', () => {
    const { fabric, shape } = make('beanie')
    expect(reached(shape, 0)).toBe(0)
    expect(reached(shape, fabric.rows.length)).toBe(shape.lengthCm)
    let last = -1
    for (let r = 0; r <= fabric.rows.length; r++) { const u = reached(shape, r); expect(u).toBeGreaterThanOrEqual(last); last = u }
    expect(reached(shape, shape.sections[0].rows[1])).toBe(5) // the brim ends 5 cm up
  })
})

describe('stitch-pattern library', () => {
  const view = (chart: string[], r: number, n: number) => Array.from({ length: n }, (_, c) => chart[r % chart.length][c % chart[0].length])
  it('every pattern, worked from its derived instructions, reproduces its own chart flat and in the round', () => {
    for (const p of STITCH_PATTERNS) for (const how of ['flat', 'round'] as const) for (const n of [repeatWidth(p) * 3, balanced(p, 24), 17, 30]) {
      if (how === 'round' && n % repeatWidth(p) !== 0) continue // a round must hold whole repeats
      const rows = rowsFor(p, n, p.chart.length * 2, how)
      const f = knit(n, rows, how)
      f.rows.forEach((row, r) => expect(row, `${p.id} ${how} over ${n}, row ${r + 1}`).toEqual(view(p.chart, r, n)))
    }
  })
  it('charts are rectangular and use only knit and purl', () => {
    for (const p of STITCH_PATTERNS) {
      expect(new Set(p.chart.map((r) => r.length)).size, p.id).toBe(1)
      expect(p.chart.join(''), p.id).toMatch(/^[kp]+$/)
    }
  })
  it('a balanced cast-on has matching edges on the right side', () => {
    for (const p of STITCH_PATTERNS) {
      const n = balanced(p, 30), w = repeatWidth(p)
      const first = view(p.chart, 0, n)
      if (w > 1) expect(first.slice(0, w / 2), p.id).toEqual(first.slice(-w / 2))
    }
  })
  it('recognises the surface each chart makes', () => {
    const kind = (id: string) => classify(STITCH_PATTERNS.find((p) => p.id === id)!.chart)
    expect([kind('stockinette'), kind('garter'), kind('rib2'), kind('seed'), kind('basket'), kind('ridge')]).toEqual(['stockinette', 'garter', 'rib', 'textured', 'textured', 'textured'])
  })
  it('every project works in every stitch it offers, at every gauge, and its rows go into words', () => {
    for (const p of PROJECTS) for (const style of p.styles ?? []) for (let gauge = 10; gauge <= 34; gauge += 2) {
      const settings = { gauge, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }
      let pattern
      try { pattern = p.build!(settings, style) } catch (e) { expect((e as Error).message, `${p.id} ${style}`).toMatch(/Choose another stitch/); continue }
      const f = knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), pattern.construction)
      expect(f.rows.length).toBeGreaterThan(10)
      for (const step of pattern.steps) for (const row of new Set(step.rows ?? [])) expect(inWords(row)).toMatch(/\.$/)
      // The styled section really is knitted in that stitch.
      const styled = pattern.steps.find((s) => s.chart && s.rows && JSON.stringify(s.chart) === JSON.stringify(STITCH_PATTERNS.find((x) => x.id === style)!.chart))
      expect(styled, `${p.id} ${style}`).toBeDefined()
    }
  })
  it('the default stitch of every project is one it can always make', () => {
    for (const p of PROJECTS) if (p.styles) for (let gauge = 10; gauge <= 34; gauge++) {
      expect(() => p.build!({ gauge, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }, p.styles![0])).not.toThrow()
    }
  })
})

describe('photo coach', () => {
  it('uses the Responses API, stores the call so it shows in the logs, and turns reasoning on', () => {
    const body = checkRequest({ project: 'Ribbed beanie', step: 'Knit the body', stitchName: 'Seed stitch', construction: 'round', stitches: 88 }, 'data:image/jpeg;base64,AAAA')
    expect(body.store).toBe(true)
    expect(body.reasoning.effort).toBe('medium')
    expect(body.instructions).toMatch(/Never give stitch counts/)
    expect(JSON.stringify(body)).not.toContain('88')
    expect(body.input[0].content[1]).toEqual({ type: 'input_image', image_url: 'data:image/jpeg;base64,AAAA' })
  })
  it('reads the answer out of a Responses reply, skipping the reasoning', () =>
    expect(replyText({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: '{"a":1}' }] }] })).toBe('{"a":1}'))
  it('keeps a well-formed reply', () => {
    const r = parseCheck(JSON.stringify({ photo_ok: true, photo_advice: '', fabric_seen: 'seed', matches_expected: 'yes', issues: [{ problem: 'A dropped stitch', where: 'third column', fix: 'Hook it back up', confidence: 'high' }], going_well: ['Even edges'], next: 'Carry on' }))
    expect(r.fabricSeen).toBe('seed')
    expect(r.issues).toEqual([{ problem: 'A dropped stitch', where: 'third column', fix: 'Hook it back up', confidence: 'high' }])
  })
  it('drops anything outside the expected shape instead of showing it', () => {
    const r = parseCheck(JSON.stringify({ photo_ok: 'yes', fabric_seen: 'cables <b>', matches_expected: 'definitely', issues: [{ problem: '' }, 'nonsense', { problem: 'x'.repeat(900), confidence: 'certain' }, 1, 2, 3, 4], going_well: [5, 'ok'], next: { a: 1 }, cast_on: 120 }))
    expect(r.fabricSeen).toBe('unclear')
    expect(r.issues).toHaveLength(1)
    expect(r.issues[0].confidence).toBe('low')
    expect(r.goingWell).toEqual(['ok'])
    expect(JSON.stringify(r)).not.toContain('120')
  })
  it('refuses a reply that is not a JSON object', () => expect(() => parseCheck('Sure! Here is what I see')).toThrow(/could not be read/))
  it('explains service errors in plain words', () => {
    expect(explain(401, '')).toMatch(/did not accept the key/)
    expect(explain(429, '')).toMatch(/limit/)
  })
})

describe('design agent: the plan', () => {
  // The fixture is real agent output in the first, one-piece format, so it also proves old saved plans still load.
  const plan = normalise(beaniePlan)
  const ids = LESSONS.map((l) => l.id)
  const copy = (): Plan => JSON.parse(JSON.stringify(plan))
  it('a plan the live agent produced passes every check and knits to the count it claims', () => {
    expect(checkPlan(plan, ids)).toEqual([])
    const c = checkPattern(plan.pieces[0])
    expect(c.ok).toBe(true)
    expect(c.after[c.after.length - 1].stitches).toBeLessThanOrEqual(16) // the crown really closes
  })
  it('becomes a pattern the builder and the finished-item picture can use', () => {
    const p = toPattern(plan, { gauge: 18, headCm: 56, handCm: 19, yarn: 'Worsted', needle: '5 mm' })
    const f = knit(p.castOn, p.steps.flatMap((s) => s.rows ?? []), p.construction)
    const shape = product(p, f, 18)
    expect(shape.sections.length).toBe(p.steps.filter((s) => s.rows).length)
    expect(shape.lengthCm).toBeGreaterThan(20)
    expect(p.kit.length).toBe(plan.tools.length + 1)
    for (const st of p.steps) if (st.until) expect(st.until).toMatch(/^[^A-Z].*[^.]$/) // reads on after "Stop when"
    for (const s of p.steps) for (const r of new Set(s.rows ?? [])) expect(inWords(r)).toMatch(/\.$/)
  })
  it('pinpoints the row that does not fit', () => {
    const bad = copy(); bad.pieces[0].sections[2].row_groups = [{ rows: ['K3, P2'], repeat: 4 }]
    const c = checkPattern(bad.pieces[0])
    expect(c.ok).toBe(false)
    expect(c.errors[0]).toMatch(/Deep folded brim.*row 1.*92 stitches/)
  })
  it('catches wrong-side rows that break the count in flat knitting', () => {
    const c = checkPattern({ construction: 'flat', cast_on: 10, sections: [{ title: 'Body', instructions: 'x', row_groups: [{ rows: ['K1', '*K2, k2tog; rep from *, K2', 'K3'], repeat: 1 }], length_cm: 2, until: '', tip: '' }] })
    expect(c.ok).toBe(false)
    expect(c.errors[0]).toMatch(/row 3/)
  })
  it('refuses a skill with no lesson, a lesson id that does not exist, and a lesson with too few steps', () => {
    const a = copy(); a.new_lessons = []
    expect(checkPlan(a, ids).join(' ')).toMatch(/has no existing lesson/)
    const b = copy(); b.skills[0].lesson_id = 'made-up'
    expect(checkPlan(b, ids).join(' ')).toMatch(/does not exist/)
    const c = copy(); c.new_lessons[0].steps = ['Do it']
    expect(checkPlan(c, ids).join(' ')).toMatch(/at least 3 steps/)
  })
  it('refuses runaway patterns', () => {
    const big = copy(); big.pieces[0].sections[2].row_groups = [{ rows: ['P2, K2'], repeat: 5000 }]
    expect(checkPattern(big.pieces[0]).errors[0]).toMatch(/under 3000/)
  })
  it('expands row groups in order', () =>
    expect(expand({ title: '', instructions: '', row_groups: [{ rows: ['A', 'B'], repeat: 2 }, { rows: ['C'], repeat: 1 }], length_cm: 1, until: '', tip: '' })).toEqual(['A', 'B', 'A', 'B', 'C']))
})

describe('design agent: tools', () => {
  it('does the arithmetic from the knitter\'s own gauge', () => {
    expect(runTool('stitches_for_width', { width_cm: 51, multiple: 4, plus: 0 }, INITIAL).output).toEqual({ stitches: 92, actual_width_cm: 51.1 })
    expect((runTool('rows_for_length', { length_cm: 10, fabric: 'garter' }, INITIAL).output as { rows: number }).rows).toBe(36)
  })
  it('hands out library rows that really make the pattern, and refuses a count that cannot hold whole repeats', () => {
    const { rows } = runTool('library_rows', { pattern_id: 'seed', stitches: 92, construction: 'round' }, INITIAL).output as { rows: string[] }
    expect(knit(92, rows, 'round').rows.map((r) => r.slice(0, 2).join(''))).toEqual(['kp', 'pk'])
    expect(JSON.stringify(runTool('library_rows', { pattern_id: 'basket', stitches: 92, construction: 'round' }, INITIAL).output)).toMatch(/multiple of 8/)
  })
  it('tells the agent which lessons exist and which the knitter has done', () => {
    const o = runTool('knitter_profile', {}, { ...INITIAL, lessons: { knit: true } }).output as { lessons_finished: string[]; lessons_in_app: unknown[] }
    expect(o.lessons_finished).toEqual(['knit'])
    expect(o.lessons_in_app).toHaveLength(LESSONS.length)
  })
  it('only accepts a plan that passes, and returns the problems otherwise', () => {
    const plan = normalise(beaniePlan)
    expect(runTool('submit_plan', plan as unknown as Record<string, unknown>, INITIAL).plan).toBeDefined()
    const bad = JSON.parse(JSON.stringify(plan)); bad.pieces[0].cast_on = 91
    const r = runTool('submit_plan', bad, INITIAL)
    expect(r.plan).toBeUndefined()
    expect((r.output as { fix_these: string[] }).fix_these.length).toBeGreaterThan(0)
  })
  it('every tool has a schema the service accepts: an object with all properties required', () => {
    for (const t of TOOLS) expect((t.parameters as { type: string }).type).toBe('object')
  })
})

describe('design agent: the loop', () => {
  const plan = normalise(beaniePlan)
  const call = (name: string, args: object, id: string) => ({ type: 'function_call', name, arguments: JSON.stringify(args), call_id: id })
  it('feeds tool results back, lets the agent recover from a failed check, and stops when a plan is accepted', async () => {
    const bad = JSON.parse(JSON.stringify(plan)); bad.pieces[0].cast_on = 91
    const script = [
      { id: 'r1', output: [{ type: 'reasoning', summary: [{ text: '**Looking at the request**\n\nA hat.' }] }, call('knitter_profile', {}, 'c1')] },
      { id: 'r2', output: [call('submit_plan', bad, 'c2')] },
      { id: 'r3', output: [call('submit_plan', plan, 'c3')] },
    ]
    const sent: Record<string, unknown>[] = []
    const seen: string[] = []
    const out = await design({ request: 'a slouchy hat' }, INITIAL, async (b) => { sent.push(b); return script[sent.length - 1] }, (a) => seen.push(a.kind))
    expect(out.title).toBe(plan.title)
    expect(sent).toHaveLength(3)
    expect(sent[0].instructions).toBe(DESIGNER)
    expect((sent[0].reasoning as { effort: string }).effort).toBe('high')
    expect(sent[0].store).toBe(true)
    expect(sent[1].previous_response_id).toBe('r1')
    expect(JSON.stringify(sent[2].input)).toMatch(/fix_these/)
    expect(seen).toEqual(['thinking', 'tool', 'problem', 'done'])
  })
  it('sends the photo once, with the request', async () => {
    const sent: Record<string, unknown>[] = []
    await design({ request: '', photo: 'data:image/jpeg;base64,AAAA' }, INITIAL, async (b) => { sent.push(b); return { id: 'r', output: [call('submit_plan', plan, 'c')] } })
    expect(JSON.stringify(sent[0].input)).toContain('input_image')
  })
  it('gives up after a fixed number of turns instead of spending without end', async () => {
    let n = 0
    await expect(design({ request: 'x' }, INITIAL, async () => { n++; return { id: 'r', output: [call('knitter_profile', {}, 'c')] } })).rejects.toThrow(/could not finish/)
    expect(n).toBe(MAX_TURNS)
  })
  it('reports a service error instead of looping', async () =>
    expect(design({ request: 'x' }, INITIAL, async () => ({ error: { message: 'No credit left' } }))).rejects.toThrow('No credit left'))
})

describe('coach relay', () => {
  const env = { OPENAI_API_KEY: 'sk-test', ALLOWED_ORIGIN: 'https://app.example' }
  const good = () => JSON.stringify(checkRequest({ project: 'Scarf', step: 'Knit', stitchName: 'Garter', construction: 'flat', stitches: 30 }, 'data:image/jpeg;base64,AAAA'))
  const call = async (init: { origin?: string; method?: string; body?: string }, e: object = env) => {
    // The relay lives outside the app, as plain JavaScript that can be pasted into Cloudflare.
    const path = new URL('../../../server/coach-worker.js', import.meta.url).href
    const { handle } = await import(/* @vite-ignore */ path)
    const sent: { url: string; init: { headers: Record<string, string>; body: string } }[] = []
    const res: Response = await handle(
      new Request('https://relay.example', { method: init.method ?? 'POST', headers: init.origin === undefined ? { Origin: 'https://app.example' } : { Origin: init.origin }, body: init.method === 'OPTIONS' ? undefined : init.body ?? good() }),
      e,
      async (url: string, i: { headers: Record<string, string>; body: string }) => { sent.push({ url, init: i }); return new Response(JSON.stringify({ id: 'r', output: [] }), { status: 200 }) },
    )
    return { res, sent }
  }
  const forwarded = (sent: { init: { body: string } }[]) => JSON.parse(sent[0].init.body)
  it('passes the photo check on to the Responses API with the stored key, a fixed model and logging on', async () => {
    const { res, sent } = await call({})
    expect(res.status).toBe(200)
    expect(sent[0].url).toBe('https://api.openai.com/v1/responses')
    expect(sent[0].init.headers.Authorization).toBe('Bearer sk-test')
    expect(forwarded(sent)).toMatchObject({ model: 'gpt-6.1-terra', store: true, reasoning: { effort: 'medium' } })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example')
  })
  it('passes the design agent on too, with its tools and its place in the conversation', async () => {
    const body = JSON.stringify({ model: 'x', instructions: DESIGNER, tools: TOOLS, reasoning: { effort: 'high' }, previous_response_id: 'resp_1', input: [{ type: 'function_call_output', call_id: 'c', output: '{}' }] })
    const f = forwarded((await call({ body })).sent)
    expect(f.tools).toHaveLength(TOOLS.length)
    expect(f.reasoning.effort).toBe('high')
    expect(f.previous_response_id).toBe('resp_1')
  })
  it('never shows the key to the caller', async () => {
    const { res } = await call({})
    expect(await res.text()).not.toContain('sk-test')
  })
  it('refuses other websites, and refuses everyone if no address has been allowed', async () => {
    expect((await call({ origin: 'https://evil.example' })).res.status).toBe(403)
    expect((await call({ origin: '' })).res.status).toBe(403)
    expect((await call({}, { OPENAI_API_KEY: 'sk-test' })).res.status).toBe(403)
  })
  it('refuses anything that is not one of the app\'s two jobs, and sends nothing to OpenAI', async () => {
    const other = JSON.stringify({ model: 'gpt-6.2-sol', instructions: 'You are a general assistant.', input: [{ role: 'user', content: 'Write me an essay' }] })
    const none = JSON.stringify({ input: [{ role: 'user', content: 'hi' }] })
    for (const body of [other, none, 'not json']) {
      const { res, sent } = await call({ body })
      expect(res.status).toBe(400)
      expect(sent).toHaveLength(0)
    }
  })
  it('ignores the caller\'s model, spending settings and any tool that is not one of the app\'s own', async () => {
    const tampered = JSON.parse(good())
    Object.assign(tampered, { model: 'gpt-5.5-pro', max_output_tokens: 900000, store: false, tools: [{ type: 'web_search' }, { type: 'function', name: 'x', parameters: {} }], reasoning: { effort: 'extreme' } })
    const f = forwarded((await call({ body: JSON.stringify(tampered) })).sent)
    expect(f.model).toBe('gpt-6.1-terra')
    expect(f.max_output_tokens).toBe(30000)
    expect(f.store).toBe(true)
    expect(f.tools).toEqual([{ type: 'function', name: 'x', parameters: {} }])
    expect(f.reasoning.effort).toBe('medium')
  })
  it('refuses oversized photos and reports a missing key plainly', async () => {
    const huge = JSON.parse(good()); huge.input[0].content[1].image_url = 'data:image/jpeg;base64,' + 'A'.repeat(1_600_000)
    expect((await call({ body: JSON.stringify(huge) })).res.status).toBe(413)
    expect((await call({}, { ALLOWED_ORIGIN: 'https://app.example' })).res.status).toBe(503)
  })
  it('answers the browser\'s permission check', async () => expect((await call({ method: 'OPTIONS' })).res.status).toBe(204))
})

describe('designs made of several pieces', () => {
  const sec = (title: string, rows: string[], repeat: number, cm: number) => ({ title, instructions: 'Work as shown.', row_groups: [{ rows, repeat }], length_cm: cm, until: 'it measures right', tip: '' })
  const place = { x_cm: 0, y_cm: 0, z_cm: 0, tilt_deg: 0, lean_deg: 0 }
  const toy = (): Plan => ({
    ...normalise(beaniePlan), title: 'Bunny',
    pieces: [
      { name: 'Body', quantity: 1, colour_hex: '#c9737a', construction: 'round', cast_on: 8, stuffed: true, place,
        sections: [sec('Base', ['kfb'], 1, 1), sec('Widen', ['*K1, kfb; rep from *', 'K1'], 1, 1), sec('Sides', ['K1'], 12, 6), sec('Narrow', ['*K1, k2tog; rep from *', 'K1'], 1, 1)] },
      { name: 'Ear', quantity: 2, colour_hex: '#c9737a', construction: 'flat', cast_on: 6, stuffed: false, place: { ...place, x_cm: 2, y_cm: 14, lean_deg: 10 },
        sections: [sec('Ear', ['K1'], 20, 6)] },
    ],
    assembly: ['Stuff the body.', 'Sew on the ears.'],
  })
  const ids = LESSONS.map((l) => l.id)
  it('a toy passes when every piece knits correctly, including increases with kfb', () => {
    expect(checkPlan(toy(), ids)).toEqual([])
    const body = checkPattern(toy().pieces[0])
    expect(body.after.map((a) => a.stitches)).toEqual([16, 24, 24, 16])
  })
  it('a row always has one entry per stitch left on the needle, even after kfb', () => {
    const f = knit(4, ['kfb', 'K1'], 'round')
    expect(f.rows.map((r) => r.length)).toEqual([8, 8])
  })
  it('names the piece when one of several fails', () => {
    const bad = toy(); bad.pieces[1].sections[0].row_groups = [{ rows: ['K4'], repeat: 3 }]
    expect(checkPlan(bad, ids).join(' ')).toMatch(/Piece "Ear".*does not fit 6/)
  })
  it('insists on assembly steps and sensible placement for a many-piece design', () => {
    const a = toy(); a.assembly = []
    expect(checkPlan(a, ids).join(' ')).toMatch(/assembly must say how to join/)
    const b = toy(); (b.pieces[0].place as unknown as Record<string, unknown>).y_cm = 'high'
    expect(checkPlan(b, ids).join(' ')).toMatch(/Piece "Body": place needs/)
  })
  it('each piece is its own project in the builder, and the whole design is one card in the list', () => {
    const custom = [{ id: 'custom-1', plan: toy() }]
    expect(projectsFor(custom).filter((p) => p.id.startsWith('custom-'))).toHaveLength(1)
    const ear = findProject('custom-1#1', custom)!
    expect(ear.name).toBe('Ear')
    const pattern = ear.build!({ gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' })
    expect([pattern.castOn, pattern.construction, pattern.halved]).toEqual([6, 'flat', false])
    expect(pattern.fits).toMatch(/Make 2/)
    expect(pattern.steps.some((s) => s.title === 'Finishing')).toBe(false) // assembly belongs to the overview
    expect(findProject('custom-1#9', custom)).toBeUndefined()
    expect(findProject('beanie', custom)!.name).toBe('Ribbed beanie')
  })
  it('a stuffed piece that starts from a few stitches becomes a closed, rounded solid', () => {
    const pattern = toPattern(toy(), { gauge: 18, headCm: 56, handCm: 19, yarn: 'Test', needle: '5 mm' }, 0)
    const p = profile(product(pattern, knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), 'round'), 18))
    const widest = Math.max(...p.map((q) => q[0]))
    expect(p[0][0]).toBeLessThan(widest)
    expect(p[p.length - 1][0]).toBeLessThan(widest)
    expect(p.flat().every(Number.isFinite)).toBe(true)
  })
})
