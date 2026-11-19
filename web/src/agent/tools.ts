import { LESSONS } from '../content/lessons'
import { needleFor } from '../patterns/catalog'
import { repeatWidth, rowsFor, STITCH_PATTERNS, stitchPattern } from '../patterns/stitches'
import { garterRows, stockinetteRows } from '../patterns/types'
import type { State } from '../store'
import { checkPattern, checkPlan, type Plan } from './plan'

/**
 * The tools the design agent can call. They give it facts about this knitter
 * and let it test its own arithmetic against the knitting engine, so numbers
 * in a plan are measured or proven rather than guessed.
 */
type Schema = Record<string, unknown>
const obj = (properties: Schema, required: string[]): Schema => ({ type: 'object', properties, required, additionalProperties: false })
const rowGroups: Schema = {
  type: 'array',
  description: 'Rows of this section. Each group is a list of row recipes worked in order, the whole list repeated `repeat` times. Empty for steps with no row-by-row knitting.',
  items: obj({ rows: { type: 'array', items: { type: 'string' } }, repeat: { type: 'integer' } }, ['rows', 'repeat']),
}
const sections: Schema = { type: 'array', items: obj({
  title: { type: 'string' },
  instructions: { type: 'string', description: 'What to do in this section, in plain words for the knitter.' },
  row_groups: rowGroups,
  length_cm: { type: 'number', description: 'Finished length of this section. 0 if it has no rows.' },
  until: { type: 'string', description: 'What tells the knitter to stop, e.g. "the piece measures 14 cm". Empty if not needed.' },
  tip: { type: 'string' },
}, ['title', 'instructions', 'row_groups', 'length_cm', 'until', 'tip']) }
const draftSchema: Schema = obj({ construction: { type: 'string', enum: ['flat', 'round'] }, cast_on: { type: 'integer' }, sections }, ['construction', 'cast_on', 'sections'])
const pieceSchema: Schema = obj({
  name: { type: 'string', description: 'What this part is, e.g. "Head", "Ear", "Scarf".' },
  quantity: { type: 'integer', description: 'How many identical ones to make.' },
  colour_hex: { type: 'string', description: 'Its main colour as #rrggbb, taken from the photo or request.' },
  construction: { type: 'string', enum: ['flat', 'round'] },
  cast_on: { type: 'integer' },
  stuffed: { type: 'boolean' },
  form: { type: 'string', enum: ['solid', 'panel', 'wrap'], description: 'What the piece is when finished, however it was knitted. solid: a tube, or a flat piece seamed into a tube or pouch and usually stuffed (head, body, limb). panel: stays flat fabric (ear, patch, pocket). wrap: a strip wrapped in a ring around the item (scarf, collar, band).' },
  wrap_radius_cm: { type: 'number', description: 'For a wrap: radius of the part it goes around, e.g. the neck. 0 for other forms.' },
  sections,
  place: obj({
    x_cm: { type: 'number' }, y_cm: { type: 'number' }, z_cm: { type: 'number' },
    tilt_deg: { type: 'number', description: 'Rotation toward the front (+) or back (-) from pointing straight up.' },
    lean_deg: { type: 'number', description: 'Rotation toward the item\'s left (+) or right (-) from pointing straight up.' },
  }, ['x_cm', 'y_cm', 'z_cm', 'tilt_deg', 'lean_deg']),
}, ['name', 'quantity', 'colour_hex', 'construction', 'cast_on', 'stuffed', 'form', 'wrap_radius_cm', 'sections', 'place'])

const str = { type: 'string' }
const strs = { type: 'array', items: str }

export const TOOLS = [
  { type: 'function', name: 'knitter_profile', description: 'This knitter\'s gauge, needle size, body measurements, the lessons they have finished, and every lesson the app already has. Call this first.', parameters: obj({}, []) },
  { type: 'function', name: 'stitches_for_width', description: 'How many stitches make a given width at this knitter\'s gauge, rounded to a multiple. Use this instead of doing the arithmetic yourself.', parameters: obj({ width_cm: { type: 'number' }, multiple: { type: 'integer', description: 'Stitch count must be a multiple of this. 1 if it does not matter.' }, plus: { type: 'integer', description: 'Extra stitches added after rounding, e.g. 2 for "multiple of 4 plus 2".' } }, ['width_cm', 'multiple', 'plus']) },
  { type: 'function', name: 'rows_for_length', description: 'About how many rows or rounds make a given length at this knitter\'s gauge, for a kind of fabric. An estimate: always also tell the knitter what to measure.', parameters: obj({ length_cm: { type: 'number' }, fabric: { type: 'string', enum: ['stockinette', 'rib', 'garter', 'textured'] } }, ['length_cm', 'fabric']) },
  { type: 'function', name: 'stitch_library', description: 'The knit-and-purl stitch patterns the app knows, with the stitch multiple each needs.', parameters: obj({}, []) },
  { type: 'function', name: 'library_rows', description: 'Correct row recipes for one stitch pattern from the library, over a given number of stitches, flat or in the round. Returns one full repeat to use as a row group.', parameters: obj({ pattern_id: str, stitches: { type: 'integer' }, construction: { type: 'string', enum: ['flat', 'round'] } }, ['pattern_id', 'stitches', 'construction']) },
  { type: 'function', name: 'check_pattern', description: 'Knits one draft piece stitch by stitch and reports the stitch count after each section, or the exact row that does not fit. Call it for every piece until each passes.', parameters: obj({ piece: draftSchema }, ['piece']) },
  { type: 'function', name: 'submit_plan', description: 'Hand in the finished plan. It is checked again; if anything fails you get the problems back and must fix them and resubmit.', parameters: obj({
    title: str, summary: { type: 'string', description: 'Two sentences: what it is and how it fits.' }, what_i_saw: { type: 'string', description: 'What you understood from the photo and request.' },
    difficulty: { type: 'string', enum: ['beginner', 'easy', 'intermediate', 'advanced'] },
    assumptions: strs,
    yarn: obj({ weight: str, amount: str, colours: strs, note: str }, ['weight', 'amount', 'colours', 'note']),
    tools: { type: 'array', items: obj({ name: str, size_or_qty: str, why: str }, ['name', 'size_or_qty', 'why']) },
    skills: { type: 'array', description: 'Every skill the design needs, in the order to learn them, prerequisites first.', items: obj({ name: str, why: str, lesson_id: { type: ['string', 'null'], description: 'Id of the existing lesson that teaches it, or null.' } }, ['name', 'why', 'lesson_id']) },
    new_lessons: { type: 'array', description: 'One lesson for every skill whose lesson_id is null.', items: obj({ skill: { type: 'string', description: 'Exactly the skill name it teaches.' }, title: str, goal: str, steps: strs, check: { type: 'string', description: 'How the knitter can tell it worked.' }, watch: { type: 'string', description: 'The most common mistake and its fix.' } }, ['skill', 'title', 'goal', 'steps', 'check', 'watch']) },
    pieces: { type: 'array', description: 'Every separately knitted part. One for a hat or scarf, several for a toy or anything sewn together. Identical parts are one piece with a quantity.', items: pieceSchema },
    assembly: { type: 'array', items: str, description: 'In order: stuffing, joining the pieces, embroidery and finishing.' },
    not_checked: { type: 'array', items: str, description: 'Every part of the design the engine could not verify, in plain words.' },
  }, ['title', 'summary', 'what_i_saw', 'difficulty', 'assumptions', 'yarn', 'tools', 'skills', 'new_lessons', 'pieces', 'assembly', 'not_checked']) },
] as const

export type ToolName = (typeof TOOLS)[number]['name']

/** Runs one tool call. Returns what the agent is told, and the plan if it was accepted. */
export function runTool(name: string, args: Record<string, unknown>, state: State): { output: unknown; plan?: Plan } {
  const g = state.gauge
  switch (name) {
    case 'knitter_profile':
      return { output: {
        gauge_stitches_per_10cm: g, suggested_needle: needleFor(g), head_around_cm: state.headCm, hand_around_cm: state.handCm,
        lessons_finished: LESSONS.filter((l) => state.lessons[l.id]).map((l) => l.id),
        lessons_in_app: LESSONS.map((l) => ({ id: l.id, title: l.title, stage: l.stage })),
        projects_finished: Object.keys(state.made),
        row_recipes: 'Rows use this shorthand only: K<n>, P<n>, k2tog, ssk, yo, M1L, M1R, kfb (knit front and back: 1 stitch becomes 2), separated by commas. A recipe without stars repeats to the end of the row ("K2, P2"). With stars the part between * and "; rep from *" repeats, with optional stitches before and after ("K1, *K2, P2; rep from *, K1"). "K1" alone means knit every stitch. Anything else (cables, colour changes, picking up stitches, binding off mid-row) cannot be written as rows: describe it in the section instructions and list it in not_checked.',
      } }
    case 'stitches_for_width': {
      const m = Math.max(1, Math.round(Number(args.multiple) || 1)), plus = Math.round(Number(args.plus) || 0)
      const stitches = Math.max(Math.round((Number(args.width_cm) * g) / 10 / m), 1) * m + plus
      return { output: { stitches, actual_width_cm: Math.round((stitches / g) * 100) / 10 } }
    }
    case 'rows_for_length': {
      const per10 = { stockinette: stockinetteRows(g), rib: stockinetteRows(g), garter: garterRows(g), textured: Math.round(g * 1.6) }[String(args.fabric)] ?? stockinetteRows(g)
      return { output: { rows: Math.max(Math.round((Number(args.length_cm) * per10) / 10), 1), rows_per_10cm: per10, note: 'Estimate. Tell the knitter what to measure as well.' } }
    }
    case 'stitch_library':
      return { output: STITCH_PATTERNS.map((p) => ({ id: p.id, name: p.name, multiple_of: repeatWidth(p), rows_in_repeat: p.chart.length, lies_flat: p.liesFlat, note: p.note })) }
    case 'library_rows': {
      try {
        const p = stitchPattern(String(args.pattern_id)), n = Math.round(Number(args.stitches)), how = args.construction === 'round' ? 'round' : 'flat'
        if (how === 'round' && n % repeatWidth(p) !== 0) return { output: { error: `In the round, ${p.name} needs a multiple of ${repeatWidth(p)} stitches. ${n} is not.` } }
        // A flat repeat must cover whole right-side and wrong-side pairs.
        const count = how === 'flat' && p.chart.length % 2 ? p.chart.length * 2 : p.chart.length
        return { output: { rows: rowsFor(p, n, count, how), note: `One full repeat (${count} rows). Use it as a row group and set repeat for the length. Must start on a right-side row when flat.` } }
      } catch (e) { return { output: { error: (e as Error).message } } }
    }
    case 'check_pattern': {
      const draft = (args.piece ?? args.pattern) as Plan['pieces'][number]
      const result = checkPattern(draft)
      if (!result.ok) return { output: result }
      // Finished size, so the agent can place pieces from real measurements instead of guessing.
      const widest = Math.max(draft.cast_on, ...result.after.map((a) => a.stitches))
      const width = Math.round((widest / g) * 100) / 10
      // Fabric that widens or narrows faster than it grows in length cannot lie smooth: it ruffles or puckers.
      // A circle's edge grows by 2π for every unit of radius, which sets the fastest smooth change per section.
      const warnings: string[] = []
      let from = draft.cast_on
      result.after.forEach((a, i) => {
        const sec = draft.sections[i], limit = Math.max(Math.round((2 * Math.PI * sec.length_cm * g) / 10), 2)
        if (a.rows && Math.abs(a.stitches - from) > limit) warnings.push(`Section "${sec.title}" goes from ${from} to ${a.stitches} stitches in ${sec.length_cm} cm. That is too fast to lie smooth: at this gauge it can change by about ${limit} stitches over that length. Spread the shaping over more rows, or change fewer stitches.`)
        from = a.stitches
      })
      return { output: { ...result, shaping_warnings: warnings, finished_size: {
        length_cm: Math.round(draft.sections.reduce((n, sec) => n + (sec.length_cm > 0 ? sec.length_cm : 0), 0) * 10) / 10,
        widest_width_flat_cm: width,
        if_solid: { widest_distance_around_cm: width, widest_radius_cm: Math.round((width / (2 * Math.PI)) * 10) / 10 },
        note: 'A solid piece is this long along its length and this far across at its widest. Use these when placing pieces so they touch.',
      } } }
    }
    case 'submit_plan': {
      const plan = args as unknown as Plan
      const errors = checkPlan(plan, LESSONS.map((l) => l.id))
      return errors.length ? { output: { accepted: false, fix_these: errors } } : { output: { accepted: true }, plan }
    }
    default:
      return { output: { error: `There is no tool called ${name}.` } }
  }
}
