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
const patternSchema: Schema = obj({
  construction: { type: 'string', enum: ['flat', 'round'] },
  cast_on: { type: 'integer' },
  halved: { type: 'boolean', description: 'True if the finished item is a tube or is folded in half, so it is seen doubled when laid flat.' },
  sections: { type: 'array', items: obj({
    title: { type: 'string' },
    instructions: { type: 'string', description: 'What to do in this section, in plain words for the knitter.' },
    row_groups: rowGroups,
    length_cm: { type: 'number', description: 'Finished length of this section. 0 if it has no rows.' },
    until: { type: 'string', description: 'What tells the knitter to stop, e.g. "the piece measures 14 cm". Empty if not needed.' },
    tip: { type: 'string' },
  }, ['title', 'instructions', 'row_groups', 'length_cm', 'until', 'tip']) },
}, ['construction', 'cast_on', 'halved', 'sections'])

const str = { type: 'string' }
const strs = { type: 'array', items: str }

export const TOOLS = [
  { type: 'function', name: 'knitter_profile', description: 'This knitter\'s gauge, needle size, body measurements, the lessons they have finished, and every lesson the app already has. Call this first.', parameters: obj({}, []) },
  { type: 'function', name: 'stitches_for_width', description: 'How many stitches make a given width at this knitter\'s gauge, rounded to a multiple. Use this instead of doing the arithmetic yourself.', parameters: obj({ width_cm: { type: 'number' }, multiple: { type: 'integer', description: 'Stitch count must be a multiple of this. 1 if it does not matter.' }, plus: { type: 'integer', description: 'Extra stitches added after rounding, e.g. 2 for "multiple of 4 plus 2".' } }, ['width_cm', 'multiple', 'plus']) },
  { type: 'function', name: 'rows_for_length', description: 'About how many rows or rounds make a given length at this knitter\'s gauge, for a kind of fabric. An estimate: always also tell the knitter what to measure.', parameters: obj({ length_cm: { type: 'number' }, fabric: { type: 'string', enum: ['stockinette', 'rib', 'garter', 'textured'] } }, ['length_cm', 'fabric']) },
  { type: 'function', name: 'stitch_library', description: 'The knit-and-purl stitch patterns the app knows, with the stitch multiple each needs.', parameters: obj({}, []) },
  { type: 'function', name: 'library_rows', description: 'Correct row recipes for one stitch pattern from the library, over a given number of stitches, flat or in the round. Returns one full repeat to use as a row group.', parameters: obj({ pattern_id: str, stitches: { type: 'integer' }, construction: { type: 'string', enum: ['flat', 'round'] } }, ['pattern_id', 'stitches', 'construction']) },
  { type: 'function', name: 'check_pattern', description: 'Knits a draft pattern stitch by stitch and reports the stitch count after each section, or the exact row that does not fit. Call it until the pattern passes.', parameters: obj({ pattern: patternSchema }, ['pattern']) },
  { type: 'function', name: 'submit_plan', description: 'Hand in the finished plan. It is checked again; if anything fails you get the problems back and must fix them and resubmit.', parameters: obj({
    title: str, summary: { type: 'string', description: 'Two sentences: what it is and how it fits.' }, what_i_saw: { type: 'string', description: 'What you understood from the photo and request.' },
    difficulty: { type: 'string', enum: ['beginner', 'easy', 'intermediate', 'advanced'] },
    assumptions: strs,
    yarn: obj({ weight: str, amount: str, colours: strs, note: str }, ['weight', 'amount', 'colours', 'note']),
    tools: { type: 'array', items: obj({ name: str, size_or_qty: str, why: str }, ['name', 'size_or_qty', 'why']) },
    skills: { type: 'array', description: 'Every skill the design needs, in the order to learn them, prerequisites first.', items: obj({ name: str, why: str, lesson_id: { type: ['string', 'null'], description: 'Id of the existing lesson that teaches it, or null.' } }, ['name', 'why', 'lesson_id']) },
    new_lessons: { type: 'array', description: 'One lesson for every skill whose lesson_id is null.', items: obj({ skill: { type: 'string', description: 'Exactly the skill name it teaches.' }, title: str, goal: str, steps: strs, check: { type: 'string', description: 'How the knitter can tell it worked.' }, watch: { type: 'string', description: 'The most common mistake and its fix.' } }, ['skill', 'title', 'goal', 'steps', 'check', 'watch']) },
    pattern: patternSchema,
    finishing: strs,
    not_checked: { type: 'array', items: str, description: 'Every part of the design the engine could not verify, in plain words.' },
  }, ['title', 'summary', 'what_i_saw', 'difficulty', 'assumptions', 'yarn', 'tools', 'skills', 'new_lessons', 'pattern', 'finishing', 'not_checked']) },
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
        row_recipes: 'Rows use this shorthand only: K<n>, P<n>, k2tog, ssk, yo, M1L, M1R, separated by commas. A recipe without stars repeats to the end of the row ("K2, P2"). With stars the part between * and "; rep from *" repeats, with optional stitches before and after ("K1, *K2, P2; rep from *, K1"). "K1" alone means knit every stitch. Anything else (cables, colour changes, picking up stitches, binding off mid-row) cannot be written as rows: describe it in the section instructions and list it in not_checked.',
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
    case 'check_pattern':
      return { output: checkPattern(args.pattern as Plan['pattern']) }
    case 'submit_plan': {
      const plan = args as unknown as Plan
      const errors = checkPlan(plan, LESSONS.map((l) => l.id))
      return errors.length ? { output: { accepted: false, fix_these: errors } } : { output: { accepted: true }, plan }
    }
    default:
      return { output: { error: `There is no tool called ${name}.` } }
  }
}
