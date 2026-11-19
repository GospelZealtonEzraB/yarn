import { beaniePattern } from './beanie'
import { mittsPattern } from './mitts'
import { ribScarfPattern } from './ribScarf'
import { scarfPattern } from './scarf'
import type { Pattern, Settings } from './types'

export interface ProjectDef {
  id: string
  name: string
  stage: number
  hours: string
  blurb: string
  /** Outline for the picker card, drawn in a 100 x 70 box. */
  outline: string
  /** Lessons to finish before starting. */
  needs?: string[]
  /** Missing while the pattern template is still being written and tested. */
  build?: (s: Settings) => Pattern
}

export const PROJECTS: ProjectDef[] = [
  { id: 'scarf', needs: ['caston', 'knit', 'bindoff', 'weave'], name: 'Garter scarf', stage: 1, hours: '8 to 10 hours', blurb: 'Knit every row. Nothing else to learn.', outline: 'M36 6h28v50l-4 8-5-8-5 8-5-8-5 8-4-8z', build: scarfPattern },
  { id: 'beanie', needs: ['caston', 'knit', 'purl', 'rib', 'round', 'k2tog', 'dpn', 'weave'], name: 'Ribbed beanie', stage: 3, hours: '6 to 8 hours', blurb: 'Your first project in the round, with a shaped crown.', outline: 'M22 50C22 24 34 8 50 8s28 16 28 42v10H22z M22 50h56', build: beaniePattern },
  { id: 'ribscarf', needs: ['caston', 'knit', 'purl', 'rib', 'read', 'bindoff', 'weave'], name: 'Ribbed scarf', stage: 2, hours: '12 to 15 hours', blurb: 'Knit 2, purl 2. Stretchy and the same on both sides.', outline: 'M34 6h32v52H34zM42 6v52M50 6v52M58 6v52', build: ribScarfPattern },
  { id: 'mitts', needs: ['caston', 'knit', 'purl', 'stockinette', 'rib', 'bindoff', 'weave'], name: 'Fingerless mitts', stage: 2, hours: '5 to 6 hours', blurb: 'A flat rectangle, seamed with a gap left for the thumb.', outline: 'M36 62V22h28v12l8-6 5 6-13 14v14z', build: mittsPattern },
  { id: 'mittens', name: 'Mittens', stage: 4, hours: '9 hours', blurb: 'Adds a thumb gusset and a rounded top.', outline: 'M36 62V26c0-22 28-22 28 0v8l8-6 5 6-13 14v14z' },
  { id: 'gloves', name: 'Gloves', stage: 5, hours: '14 hours', blurb: 'Five small tubes on one hand.', outline: 'M34 62V34l-8-10 5-5 7 8V10h6v16h3V6h6v20h3V10h6v18h2l8-6 4 6-12 14v20z' },
  { id: 'socks', name: 'Socks', stage: 6, hours: '16 hours', blurb: 'Turning a heel is the party trick.', outline: 'M38 6h24v32l14 12c8 8-2 16-10 12L38 46z' },
  { id: 'sweater', name: 'Raglan sweater', stage: 6, hours: '40 hours', blurb: 'Top-down, tried on as you go.', outline: 'M38 8h24l22 14-8 14-10-6v32H34V30l-10 6-8-14z' },
]

export const YARNS: Record<string, { label: string; gauge: number; needle: string }> = {
  dk: { label: 'DK', gauge: 22, needle: '4 mm' },
  worsted: { label: 'Worsted', gauge: 18, needle: '5 mm' },
  chunky: { label: 'Chunky', gauge: 14, needle: '6 mm' },
}

/** Needle size that usually gives this gauge. A starting point for the swatch, not a promise. */
export function needleFor(gauge: number): string {
  const table: [number, string][] = [[26, '3 mm'], [23, '3.5 mm'], [21, '4 mm'], [19, '4.5 mm'], [17, '5 mm'], [15, '5.5 mm'], [13, '6 mm'], [11, '8 mm']]
  return (table.find(([g]) => gauge >= g) ?? [0, '10 mm'])[1]
}
