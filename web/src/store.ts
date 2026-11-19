import { createContext, useContext } from 'react'
import { needleFor, YARNS } from './patterns/catalog'
import type { Plan } from './agent/plan'
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

export const INITIAL: State = { yarn: 'worsted', gauge: 18, headCm: 56, handCm: 19, lessons: {}, projects: {}, quiz: { right: 0, asked: 0 }, made: {}, styles: {}, custom: [] }
const KEY = 'loopwise.v1'

/** Progress lives on this device only. Storage can be unavailable, and the app must still work. */
export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL
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
