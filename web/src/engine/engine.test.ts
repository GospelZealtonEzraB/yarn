import { describe, expect, it } from 'vitest'
import { parseRow, produced } from './recipe'
import { isWrongSideRow, knit } from './fabric'
import { yarnSpans } from './yarnPath'
import { between, KNIT, PURL, Z } from './technique'
import { beanie, crownRecipes } from '../patterns/beanie'
import { needleFor, PROJECTS } from '../patterns/catalog'
import { LESSONS, STAGES } from '../content/lessons'

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
  const settings = (gauge: number) => ({ gauge, headCm: 56, yarn: 'Test', needle: needleFor(gauge) })
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
