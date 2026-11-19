import { createContext, useContext } from 'react'
import { needleFor, YARNS } from './patterns/catalog'
import bunny from './agent/fixtures/bunny.json'
import { normalise, type Plan } from './agent/plan'
import type { Settings } from './patterns/types'

export interface State {
  yarn: string
  gauge: number
  headCm: number
  handCm: number
  lessons: Record<string, boolean>
  projects: Record<string, { step: number; count: number }>
  quiz: { right: number; asked: number }
  /** How many times each project has been finished. */
  made: Record<string, number>
  /** The stitch pattern chosen for each project. */
  styles: Record<string, string>
  /** Plans the design agent has made for this knitter. */
  custom: { id: string; plan: Plan }[]
}

/** A finished example of what the design coach produces, so the feature can be seen before it is switched on. */
export const SAMPLE_ID = 'custom-sample-bunny'
const SAMPLE = { id: SAMPLE_ID, plan: normalise(bunny) }
const withSample = (custom: State['custom']) => [SAMPLE, ...custom.filter((c) => c.id !== SAMPLE_ID)]

export const INITIAL: State = { yarn: 'worsted', gauge: 18, headCm: 56, handCm: 19, lessons: {}, projects: {}, quiz: { right: 0, asked: 0 }, made: {}, styles: {}, custom: [SAMPLE] }
const KEY = 'loopwise.v1'

/** Progress lives on this device only. Storage can be unavailable, and the app must still work. */
export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return INITIAL
    const s: State = { ...INITIAL, ...JSON.parse(raw) }
    return { ...s, custom: withSample(s.custom.map((c) => ({ ...c, plan: normalise(c.plan) }))) }
  } catch { return INITIAL }
}
export function save(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode or blocked storage */ }
}

export const settingsOf = (s: State): Settings => ({
  gauge: s.gauge,
  headCm: s.headCm,
  handCm: s.handCm,
  yarn: Object.values(YARNS).find((y) => y.gauge === s.gauge)?.label ?? 'Your',
  needle: needleFor(s.gauge),
})

export interface Store { state: State; set: (patch: Partial<State>) => void }
export const StoreContext = createContext<Store>({ state: INITIAL, set: () => {} })
export const useStore = () => useContext(StoreContext)
