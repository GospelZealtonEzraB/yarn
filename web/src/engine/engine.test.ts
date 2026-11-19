import { describe, expect, it } from 'vitest'
import { parseRow, produced } from './recipe'
import { isWrongSideRow, knit } from './fabric'
import { yarnSpans } from './yarnPath'
import { beanie, crownRecipes } from '../patterns/beanie'

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
    expect(() => yarnSpans(knit(4, ['*K2, k2tog; rep from *'], 'round'))).toThrow(/chart view/))
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
