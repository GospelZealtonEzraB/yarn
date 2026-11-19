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

const WORDS: Record<string, (n: number) => string> = {
  k: (n) => `knit ${n}`, p: (n) => `purl ${n}`,
  k2tog: () => 'knit 2 together', ssk: () => 'slip, slip, knit', yo: () => 'yarn over',
  m1l: () => 'make 1 left', m1r: () => 'make 1 right', kfb: () => 'knit into the front and back',
}
function words(part: string): string[] {
  return part.split(/[,\s]+/).filter(Boolean).map((raw) => {
    const whole = raw.toLowerCase()
    if (WORDS[whole]) return WORDS[whole](1)
    const m = raw.match(/^([a-z]+?)(\d*)$/i)
    const f = m && WORDS[m[1].toLowerCase()]
    if (!f) throw new Error(`"${raw}" is not a stitch this app knows yet.`)
    return f(Number(m![2] || 1))
  })
}
const sentence = (t: string) => t.charAt(0).toUpperCase() + t.slice(1) + '.'

/** One row of shorthand as a plain sentence, for a knitter who cannot read shorthand yet. */
export function inWords(recipe: string): string {
  const m = recipe.match(/^(.*?)\*(.*?);\s*rep(?:eat)? from \*(.*)$/i)
  const [head, body, tail] = m ? [words(m[1]), words(m[2]), words(m[3])] : [[], words(recipe), []]
  if (!m && body.length === 1 && /^(knit|purl) 1$/.test(body[0])) return sentence(`${body[0].split(' ')[0]} every stitch`)
  const repeat = body.length > 1 ? `${body.slice(0, -1).join(', ')} and ${body[body.length - 1]}` : body[0]
  const middle = m ? `repeat ${repeat} across` : `${repeat}, and repeat to the end`
  return sentence([head.join(', '), middle, tail.length ? `finish with ${tail.join(', ')}` : ''].filter(Boolean).join(', then '))
}

/** A recipe split into the part before the repeat, the repeat itself, and the part after, as stitches in working order. */
export function parts(recipe: string): { head: StitchId[]; body: StitchId[]; tail: StitchId[] } {
  const m = recipe.match(/^(.*?)\*(.*?);\s*rep(?:eat)? from \*(.*)$/i)
  return m ? { head: tokens(m[1]), body: tokens(m[2]), tail: tokens(m[3]) } : { head: [], body: tokens(recipe), tail: [] }
}
/** How many times the repeat is worked over `available` stitches. */
export function repeats(recipe: string, available: number): number {
  const { head, body, tail } = parts(recipe)
  const need = (xs: StitchId[]) => xs.reduce((n, st) => n + STITCHES[st].consumes, 0)
  return (available - need(head) - need(tail)) / need(body)
}

/** Neighbouring identical stitches collapsed into runs, so "knit 9" is one tile, not nine. */
export function runs(stitches: StitchId[]): { type: StitchId; count: number }[] {
  const out: { type: StitchId; count: number }[] = []
  for (const st of stitches) {
    const last = out[out.length - 1]
    if (last && last.type === st && (st === 'k' || st === 'p')) last.count++
    else out.push({ type: st, count: 1 })
  }
  return out
}

