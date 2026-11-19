import type { Construction } from '../engine/fabric'

export interface KitItem { name: string; qty: string }

export interface Step {
  title: string
  text: string
  /** Knitter's shorthand shown under the step. */
  recipe: string
  tip?: string
  /** A drawn picture for steps that are not row-by-row knitting. */
  picture?: 'caston' | 'ring' | 'bindoff' | 'seam' | 'done'
  /** Lessons that teach what this step needs. */
  help?: string[]
  /** One recipe per row or round in this step. The engine works these to draw the piece and to prove the counts. */
  rows?: string[]
  /** What tells the knitter to stop, since row counts are estimates. */
  until?: string
}

export interface Pattern {
  castOn: number
  construction: Construction
  fits: string
  kit: KitItem[]
  steps: Step[]
}

export interface Settings {
  /** Stitches per 10 cm in stockinette. */
  gauge: number
  needle: string
  yarn: string
  headCm: number
  /** Around the hand at the knuckles, in cm. */
  handCm: number
}

/** Typical row gauge when the knitter has not measured one. Always presented as an estimate. */
export const stockinetteRows = (gauge: number) => Math.round(gauge * 1.35)
export const garterRows = (gauge: number) => gauge * 2
