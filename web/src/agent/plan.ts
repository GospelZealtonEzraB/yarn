import { knit, type Construction } from '../engine/fabric'
import { stockinetteRows, type Pattern, type Settings, type Step } from '../patterns/types'

/**
 * A design plan, as the agent writes it. Everything a knitter needs for one
 * custom item: what it is, what to buy, what to learn first, lessons for
 * skills the app does not teach yet, and the pattern itself.
 *
 * The agent writes this freely, but the pattern's rows are in the engine's
 * shorthand, so the app can knit them stitch by stitch and prove the counts
 * before the knitter ever sees the plan.
 */
export interface RowGroup { rows: string[]; repeat: number }
export interface PlanSection {
  title: string
  instructions: string
  /** Empty for steps that are not row-by-row knitting: casting on, joining, seaming. */
  row_groups: RowGroup[]
  length_cm: number
  until: string
  tip: string
}
export interface PlanSkill { name: string; why: string; lesson_id: string | null }
export interface PlanLesson { skill: string; title: string; goal: string; steps: string[]; check: string; watch: string }
export interface Plan {
  title: string
  summary: string
  what_i_saw: string
  difficulty: 'beginner' | 'easy' | 'intermediate' | 'advanced'
  assumptions: string[]
  yarn: { weight: string; amount: string; colours: string[]; note: string }
  tools: { name: string; size_or_qty: string; why: string }[]
  skills: PlanSkill[]
  new_lessons: PlanLesson[]
  pattern: { construction: Construction; cast_on: number; halved: boolean; sections: PlanSection[] }
  finishing: string[]
  not_checked: string[]
}

export const MAX_ROWS = 3000

export function expand(section: PlanSection): string[] {
  return section.row_groups.flatMap((g) => Array.from({ length: Math.max(0, Math.floor(g.repeat)) }, () => g.rows).flat())
}

export interface PatternCheck {
  ok: boolean
  errors: string[]
  /** Stitches on the needle after each section, when the pattern works. */
  after: { section: string; rows: number; stitches: number }[]
}

/** Knits the pattern stitch by stitch and reports exactly where it stops working. */
export function checkPattern(p: Plan['pattern']): PatternCheck {
  const errors: string[] = []
  if (!Number.isInteger(p?.cast_on) || p.cast_on < 2 || p.cast_on > 600) errors.push('cast_on must be a whole number between 2 and 600.')
  if (p?.construction !== 'flat' && p?.construction !== 'round') errors.push('construction must be "flat" or "round".')
  if (!Array.isArray(p?.sections) || p.sections.length === 0) errors.push('The pattern needs at least one section.')
  if (errors.length) return { ok: false, errors, after: [] }
  const total = p.sections.reduce((n, s) => n + (Array.isArray(s.row_groups) ? expand(s).length : 0), 0)
  if (total === 0) errors.push('No section has any rows. At least one section must be row-by-row knitting.')
  if (total > MAX_ROWS) errors.push(`The pattern has ${total} rows. Keep it under ${MAX_ROWS}.`)
  if (errors.length) return { ok: false, errors, after: [] }

  const after: PatternCheck['after'] = []
  let onNeedle = p.cast_on, done = 0
  for (const s of p.sections) {
    const rows = expand(s)
    for (let i = 0; i < rows.length; i++) {
      try {
        // Work one row on the stitches left by everything before it. Row parity matters for flat knitting.
        const f = knit(onNeedle, done % 2 === 1 && p.construction === 'flat' ? ['K1', rows[i]] : [rows[i]], p.construction)
        onNeedle = f.rows[f.rows.length - 1].length
        done++
      } catch (e) {
        errors.push(`Section "${s.title}", row ${i + 1} ("${rows[i]}") with ${onNeedle} stitches on the needle: ${(e as Error).message}`)
        return { ok: false, errors, after }
      }
    }
    if (rows.length && !(s.length_cm > 0)) errors.push(`Section "${s.title}" has rows but no length_cm.`)
    after.push({ section: s.title, rows: rows.length, stitches: onNeedle })
  }
  return { ok: errors.length === 0, errors, after }
}

const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0

/** Everything that must be true before a plan is shown. Returns problems worded for the agent to fix. */
export function checkPlan(plan: Plan, lessonIds: string[]): string[] {
  const errors: string[] = []
  if (!plan || typeof plan !== 'object') return ['The plan is missing.']
  for (const k of ['title', 'summary', 'what_i_saw'] as const) if (!text(plan[k])) errors.push(`"${k}" is empty.`)
  if (!Array.isArray(plan.tools) || plan.tools.length === 0) errors.push('List the tools the knitter needs.')
  if (!plan.yarn || !text(plan.yarn.weight) || !text(plan.yarn.amount)) errors.push('yarn.weight and yarn.amount are required.')
  if (!Array.isArray(plan.skills) || plan.skills.length === 0) errors.push('List the skills this design needs, in the order to learn them.')
  const lessons = Array.isArray(plan.new_lessons) ? plan.new_lessons : []
  for (const s of plan.skills ?? []) {
    if (s.lesson_id && !lessonIds.includes(s.lesson_id)) errors.push(`Skill "${s.name}" points at lesson "${s.lesson_id}", which does not exist. Use an id from knitter_profile, or null and write a new lesson.`)
    if (!s.lesson_id && !lessons.some((l) => l.skill === s.name)) errors.push(`Skill "${s.name}" has no existing lesson, so new_lessons must contain a lesson whose "skill" is exactly "${s.name}".`)
  }
  for (const l of lessons) {
    if (!text(l.title) || !text(l.goal) || !text(l.check)) errors.push(`New lesson for "${l.skill}" needs a title, goal and check.`)
    if (!Array.isArray(l.steps) || l.steps.length < 3) errors.push(`New lesson "${l.title}" needs at least 3 steps.`)
  }
  for (const s of plan.pattern?.sections ?? []) if (!text(s.title) || !text(s.instructions)) errors.push('Every section needs a title and instructions.')
  return [...errors, ...checkPattern(plan.pattern).errors]
}

/** The plan as a pattern the builder can run: steps, rows, lengths and a kit list. */
export function toPattern(plan: Plan, settings: Settings): Pattern {
  const rowG = stockinetteRows(settings.gauge)
  const steps: Step[] = plan.pattern.sections.map((s) => {
    const rows = expand(s)
    const first = s.row_groups[0]
    return {
      title: s.title,
      text: s.instructions,
      recipe: rows.length ? (first.rows.length === 1 ? first.rows[0] : `${first.rows.length}-row repeat`) : 'See the instructions',
      tip: s.tip || undefined,
      // Shown after "Stop when", so it reads as part of that sentence.
      until: s.until ? s.until.trim().replace(/[.\s]+$/, '').replace(/^[A-Z](?=[a-z ])/, (c) => c.toLowerCase()) : undefined,
      ...(rows.length ? { rows, cm: s.length_cm > 0 ? s.length_cm : Math.max(Math.round((rows.length / rowG) * 100) / 10, 0.5) } : {}),
    }
  })
  for (const f of plan.finishing ?? []) steps.push({ title: 'Finishing', text: f, recipe: 'Finish', picture: 'done' })
  return {
    castOn: plan.pattern.cast_on,
    construction: plan.pattern.construction,
    halved: !!plan.pattern.halved,
    fits: plan.summary,
    kit: [{ name: `${plan.yarn.weight} yarn`, qty: plan.yarn.amount }, ...plan.tools.map((t) => ({ name: t.name, qty: t.size_or_qty || '1' }))],
    steps,
  }
}
