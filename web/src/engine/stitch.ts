/**
 * The stitch vocabulary. Every picture and every instruction in the app is
 * derived from these definitions, so the two cannot disagree.
 *
 * `consumes` = loops taken off the left needle, `produces` = loops put on the
 * right needle. Row validation relies on these numbers.
 */
export type StitchId = 'k' | 'p' | 'k2tog' | 'ssk' | 'yo' | 'm1l' | 'm1r' | 'kfb'

export interface StitchDef {
  id: StitchId
  abbr: string
  name: string
  consumes: number
  produces: number
  /** What the same stitch looks like from the other side of the fabric. */
  reverse: StitchId
  /** Craft Yarn Council style chart symbol, drawn in a 0..1 box. */
  symbol: string
}

export const STITCHES: Record<StitchId, StitchDef> = {
  k: { id: 'k', abbr: 'K', name: 'knit', consumes: 1, produces: 1, reverse: 'p', symbol: '' },
  p: { id: 'p', abbr: 'P', name: 'purl', consumes: 1, produces: 1, reverse: 'k', symbol: 'M.5 .38a.12 .12 0 1 0 .001 0z' },
  k2tog: { id: 'k2tog', abbr: 'k2tog', name: 'knit 2 together', consumes: 2, produces: 1, reverse: 'k2tog', symbol: 'M.2 .8L.8 .2' },
  ssk: { id: 'ssk', abbr: 'ssk', name: 'slip, slip, knit', consumes: 2, produces: 1, reverse: 'ssk', symbol: 'M.2 .2L.8 .8' },
  yo: { id: 'yo', abbr: 'yo', name: 'yarn over', consumes: 0, produces: 1, reverse: 'yo', symbol: 'M.5 .22a.28 .28 0 1 0 .001 0z' },
  m1l: { id: 'm1l', abbr: 'M1L', name: 'make 1 left', consumes: 0, produces: 1, reverse: 'm1l', symbol: 'M.5 .2V.8M.5 .8L.25 .55' },
  kfb: { id: 'kfb', abbr: 'kfb', name: 'knit front and back', consumes: 1, produces: 2, reverse: 'kfb', symbol: 'M.5 .8V.2M.5 .5L.8 .25' },
  m1r: { id: 'm1r', abbr: 'M1R', name: 'make 1 right', consumes: 0, produces: 1, reverse: 'm1r', symbol: 'M.5 .2V.8M.5 .8L.75 .55' },
}

export const isStitch = (s: string): s is StitchId => s in STITCHES
