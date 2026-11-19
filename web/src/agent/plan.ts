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
/** Where a piece sits in the finished item, for the assembled 3D picture. */
export interface Place { x_cm: number; y_cm: number; z_cm: number; tilt_deg: number; lean_deg: number }
/** One separately knitted part: a hat is one piece, a toy is several. */
export interface PlanPiece {
  name: string
  /** How many identical ones to make, e.g. 2 ears. */
  quantity: number
  colour_hex: string
  construction: Construction
  cast_on: number
  /** True for parts that are filled, so they are round rather than flat. */
  stuffed: boolean
  /**
   * What the piece is once finished, whatever way it was knitted:
   * solid = a tube or a seamed and stuffed shape, round in cross-section;
   * panel = stays a flat piece of fabric, like an ear or a patch;
   * wrap  = a strip wrapped in a ring around the item, like a scarf, collar or band.
   */
  form: 'solid' | 'panel' | 'wrap'
  /** For a wrap: the radius of the ring it makes. 0 otherwise. */
  wrap_radius_cm: number
  sections: PlanSection[]
  place: Place
}
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
  pieces: PlanPiece[]
  /** How the pieces are stuffed, joined and finished, in order. */
  assembly: string[]
  not_checked: string[]
  /** The knitter's reference photo, kept small, so the target is always in view. */
  photo?: string
}

const NO_PLACE: Place = { x_cm: 0, y_cm: 0, z_cm: 0, tilt_deg: 0, lean_deg: 0 }

/** Brings a plan saved in the earlier one-piece format up to the current shape. */
export function normalise(raw: unknown): Plan {
  const p = raw as Plan & { pattern?: { construction: Construction; cast_on: number; sections: PlanSection[] }; finishing?: string[] }
  // Plans saved before pieces had a form: a tube or stuffed piece is a solid, anything else a panel.
  if (Array.isArray(p.pieces)) return { ...p, pieces: p.pieces.map((x) => ({ ...x, form: x.form ?? (x.stuffed || x.construction === 'round' ? 'solid' : 'panel'), wrap_radius_cm: x.wrap_radius_cm ?? 0 })) }
  const { pattern, finishing, ...rest } = p
  return { ...rest, pieces: [{ name: p.title, quantity: 1, colour_hex: '', stuffed: false, form: pattern!.construction === 'round' ? 'solid' : 'panel', wrap_radius_cm: 0, place: NO_PLACE, construction: pattern!.construction, cast_on: pattern!.cast_on, sections: pattern!.sections }], assembly: finishing ?? [] }
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
export function checkPattern(p: Pick<PlanPiece, 'construction' | 'cast_on' | 'sections'>): PatternCheck {
  const errors: string[] = []
  if (!Number.isInteger(p?.cast_on) || p.cast_on < 2 || p.cast_on > 600) errors.push('cast_on must be a whole number between 2 and 600.')
  if (p?.construction !== 'flat' && p?.construction !== 'round') errors.push('construction must be "flat" or "round".')
  if (!Array.isArray(p?.sections) || p.sections.length === 0) errors.push('The pattern needs at least one section.')
  if (errors.length) return { ok: false, errors, after: [] }
  for (const sec of p.sections) if (!Array.isArray(sec.row_groups)) return { ok: false, errors: [`Section "${sec.title}" needs row_groups (an empty list if it has no rows).`], after: [] }
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
  if (!Array.isArray(plan.pieces) || plan.pieces.length === 0) return [...errors, 'The plan needs at least one piece.']
  if (plan.pieces.length > 12) errors.push('Keep it to 12 pieces or fewer. Use quantity for identical pieces.')
  for (const piece of plan.pieces) {
    const where = `Piece "${piece.name}": `
    if (!text(piece.name)) errors.push('Every piece needs a name.')
    if (!(piece.quantity >= 1 && piece.quantity <= 8)) errors.push(`${where}quantity must be between 1 and 8.`)
    if (!piece.place || !['x_cm', 'y_cm', 'z_cm', 'tilt_deg', 'lean_deg'].every((k) => Number.isFinite(piece.place[k as keyof Place]))) errors.push(`${where}place needs x_cm, y_cm, z_cm, tilt_deg and lean_deg as numbers.`)
    if (!['solid', 'panel', 'wrap'].includes(piece.form)) errors.push(`${where}form must be "solid", "panel" or "wrap".`)
    if (piece.form === 'wrap' && !(piece.wrap_radius_cm > 0)) errors.push(`${where}a wrap needs wrap_radius_cm, the radius of the part it goes around.`)
    for (const s of piece.sections ?? []) if (!text(s.title) || !text(s.instructions)) errors.push(`${where}every section needs a title and instructions.`)
    errors.push(...checkPattern(piece).errors.map((e) => where + e))
  }
  if (plan.pieces.length > 1 && !(Array.isArray(plan.assembly) && plan.assembly.length > 0)) errors.push('With more than one piece, assembly must say how to join them.')
  return errors
}

/** One piece of the plan as a pattern the builder can run: steps, rows, lengths and a kit list. */
export function toPattern(plan: Plan, settings: Settings, pieceIndex = 0): Pattern {
  const piece = plan.pieces[pieceIndex]
  const rowG = stockinetteRows(settings.gauge)
  const steps: Step[] = piece.sections.map((s) => {
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
  // A one-piece item is finished in the builder. A many-piece item is assembled from the overview.
  if (plan.pieces.length === 1) for (const f of plan.assembly ?? []) steps.push({ title: 'Finishing', text: f, recipe: 'Finish', picture: 'done' })
  return {
    castOn: piece.cast_on,
    construction: piece.construction,
    // Seen doubled when laid flat: anything knitted as a tube, or seamed into one.
    halved: piece.construction === 'round' || piece.form === 'solid',
    fits: plan.pieces.length === 1 ? plan.summary : `${piece.name}${piece.quantity > 1 ? `. Make ${piece.quantity}, all the same.` : '.'}`,
    kit: [{ name: `${plan.yarn.weight} yarn`, qty: plan.yarn.amount }, ...plan.tools.map((t) => ({ name: t.name, qty: t.size_or_qty || '1' }))],
    steps,
  }
}
