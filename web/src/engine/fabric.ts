import { STITCHES, type StitchId } from './stitch'
import { parseRow, produced } from './recipe'

export type Construction = 'flat' | 'round'

/**
 * A piece of fabric as seen from the right side: rows[0] is the first row
 * worked, and each row reads left to right as it appears to someone looking at
 * the finished front.
 */
export interface Fabric {
  construction: Construction
  castOn: number
  rows: StitchId[][]
}

/**
 * Works a list of row recipes into fabric.
 *
 * Flat knitting turns the work after each row, so even rows are worked on the
 * wrong side: a knit there shows as a purl on the front, and the row runs the
 * other way. In the round every row is a right-side row. Stitches are worked
 * right to left, so every row is mirrored into left-to-right viewing order.
 */
export function knit(castOn: number, recipes: string[], construction: Construction): Fabric {
  let onNeedle = castOn
  const rows = recipes.map((recipe, i) => {
    const worked = parseRow(recipe, onNeedle)
    onNeedle = produced(worked)
    // Every entry in a row stands for one stitch left on the needle. A kfb leaves two, so it is
    // shown as the knit it starts as, followed by the extra stitch it makes.
    const made: StitchId[] = worked.flatMap((s): StitchId[] => (s === 'kfb' ? ['k', 'kfb'] : [s]))
    const wrongSide = construction === 'flat' && i % 2 === 1
    return wrongSide ? made.map((s) => STITCHES[s].reverse) : [...made].reverse()
  })
  return { construction, castOn, rows }
}

/**
 * Which way a row was worked, as seen from the right side. Knitters work right
 * to left; a wrong-side row in flat knitting therefore runs left to right when
 * viewed from the front.
 */
export const isWrongSideRow = (f: Fabric, row: number) => f.construction === 'flat' && row % 2 === 1
export const workedLeftToRight = isWrongSideRow
