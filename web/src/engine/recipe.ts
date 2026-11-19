import { STITCHES, isStitch, type StitchId } from './stitch'

/**
 * Parses one row of knitter's shorthand into stitches, as worked.
 *
 *   "K2, P2"                   -> repeated across the whole row
 *   "K1, *K2, P2; rep from *, K1" -> edge stitches plus a repeat
 *
 * `available` is the number of loops on the needle before the row. The parser
 * throws if the recipe cannot consume exactly that many, which is the same
 * mistake a knitter would hit at the end of the row.
 */
export function parseRow(recipe: string, available: number): StitchId[] {
  const m = recipe.match(/^(.*?)\*(.*?);\s*rep(?:eat)? from \*(.*)$/i)
  const [head, body, tail] = m ? [m[1], m[2], m[3]] : ['', recipe, '']
  const h = tokens(head), b = tokens(body), t = tokens(tail)
  if (b.length === 0) throw new Error('The recipe has no stitches to repeat.')
  const need = (xs: StitchId[]) => xs.reduce((n, s) => n + STITCHES[s].consumes, 0)
  const room = available - need(h) - need(t)
  const per = need(b)
  if (per === 0) throw new Error('The repeat uses no stitches, so it would never end.')
  if (room < 0 || room % per !== 0) {
    throw new Error(`"${recipe.trim()}" does not fit ${available} stitches: the repeat uses ${per} and ${Math.max(room, 0) % per || room} would be left over.`)
  }
  return [...h, ...Array.from({ length: room / per }, () => b).flat(), ...t]
}

function tokens(part: string): StitchId[] {
  const out: StitchId[] = []
  for (const raw of part.split(/[,\s]+/).filter(Boolean)) {
    const m = raw.match(/^([a-z][a-z0-9]*?)(\d*)$/i)
    const id = m && [m[1].toLowerCase(), raw.toLowerCase()].find(isStitch)
    if (!m || !id) throw new Error(`"${raw}" is not a stitch this app knows yet.`)
    const n = id === raw.toLowerCase() ? 1 : Number(m[2] || 1)
    for (let i = 0; i < n; i++) out.push(id)
  }
  return out
}

/** Stitches on the needle after working `row`. */
export const produced = (row: StitchId[]) => row.reduce((n, s) => n + STITCHES[s].produces, 0)
