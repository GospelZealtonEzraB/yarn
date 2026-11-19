import type { State } from '../store'
import type { Plan } from './plan'
import { runTool, TOOLS } from './tools'

/**
 * The design agent's loop. The model reasons, calls tools, reads the results
 * and tries again until its plan passes every check. Nothing here knows about
 * networks: `send` posts one request and returns the parsed reply, so the
 * same loop runs in the browser, behind the relay, or in a test.
 */
export const DESIGN_MODEL = 'gpt-6.1-terra'
export const MAX_TURNS = 24

export const DESIGNER = `You are a knitting designer and teacher working inside a learn-to-knit app.
The knitter shows you a photo, a description, or both, of something they want to make. Design it for THEM: a custom pattern in their gauge and measurements, plus what they must learn and buy to make it.

How to work:
1. Study the photo and request. Work out what the item is, every separate part it is made of, how each part is constructed, its stitch patterns and its colours.
2. Call knitter_profile. Design for this knitter's gauge, measurements and current skills.
3. Break the item into pieces the way a knitter would make it. A hat or scarf is one piece. A toy, a garment or anything sewn together is several: for a stuffed animal that means head, body, ears, arms, legs and any accessories, each its own piece. Identical parts are one piece with a quantity. Never merge a many-part item into one tube.
4. For each piece decide the construction and its sections in knitting order, including non-knitting steps. Shape each piece so it matches the photo's proportions: compare how big the head is to the body, how long the ears and limbs are, and size the pieces to match. Where a part widens, increase; where it narrows, decrease. A round head needs increases to a wide middle and decreases back, not a straight tube.
5. Get every stitch and row count from the tools. Never guess arithmetic.
6. Call check_pattern for every piece and fix what it reports. Repeat until each passes. If it returns shaping_warnings, the piece widens or narrows too abruptly to look right: respread the shaping and check again until the warnings are gone.
7. Place every piece for the assembled 3D picture (see Placement).
8. Write the assembly: stuffing, joining, embroidered or attached details, finishing, in order.
9. List every skill the design needs, in the order to learn them, prerequisites first. Where an existing lesson teaches a skill, give its id. For every other skill write a new lesson: a goal, 4 to 8 concrete steps a beginner can follow with needles in hand (yarn held in the right hand, English style), how to tell it worked, and the most common mistake with its fix.
10. Choose the tools and yarn for this design: needle type, size and length, stuffing, safety notes for toys, and anything else needed, each with the reason.
11. Call submit_plan. If it comes back with problems, fix them and submit again.

Placement:
- Axes in centimetres: x runs to the item's left (viewer's right), y is up, z is toward the viewer. The origin is the centre of the base of the whole item.
- Each piece grows from its cast-on edge. place gives where the centre of that cast-on edge sits in the finished item, and tilt_deg and lean_deg turn the direction it grows away from straight up: tilt toward the viewer (+) or away (-), lean toward the item's left (+) or right (-). A piece that hangs down has a lean or tilt near 180. A leg sticking out toward the viewer has tilt near 90.
- Give every piece its form. A solid is drawn as a rounded shape whose width around is the piece's stitch count, whether it was knitted in the round or knitted flat and seamed: its cast-on edge is one end and it grows along its length. A panel is drawn flat, standing on its cast-on edge. A wrap is drawn as a ring around the item at the height you place it, with wrap_radius_cm the radius of what it goes around; any spare length hangs down the front.
- For a quantity of 2, place the one on the item's left (positive x). The app mirrors it for the other side.
- check_pattern returns each piece's finished length and radius. Place pieces from those numbers so parts touch where they are sewn and nothing floats or is buried: a head sits at the body's length up, ears start at the head's top, and so on. A stuffed solid is drawn rounded at both ends.

Rules:
- Design what was asked for. Do not swap it for something simpler. If it is well beyond the knitter's skills, say so plainly in the summary, and still give the full plan with the skills in learning order.
- Say what the photo really shows. If the item is crocheted, woven, sewn or machine-made rather than hand-knitted, say that first in what_i_saw, then design the closest hand-knitted version and explain how it will differ.
- Be honest about uncertainty. Put what you assumed from the photo in assumptions.
- Rows can only use the shorthand described by knitter_profile. Anything it cannot express, explain in the section's instructions and list in not_checked so the knitter knows that part was not machine-verified.
- Row counts are estimates: every knitted section needs an "until" the knitter can measure.
- Give colour_hex for every piece from what you see.
- Plain words. Metric units. No brand names.
- Finish by calling submit_plan. Do not write the plan as a message.`

export type Send = (body: Record<string, unknown>) => Promise<Record<string, unknown>>
export interface Activity { kind: 'thinking' | 'tool' | 'problem' | 'done'; text: string }

interface OutputItem { type: string; name?: string; arguments?: string; call_id?: string; summary?: { text?: string }[]; content?: { text?: string }[] }

const describe = (name: string, output: unknown): Activity => {
  const o = output as Record<string, unknown>
  if (name === 'knitter_profile') return { kind: 'tool', text: 'Read your gauge, measurements and finished lessons' }
  if (name === 'stitches_for_width') return { kind: 'tool', text: `Worked out a width: ${o.stitches} stitches is ${o.actual_width_cm} cm` }
  if (name === 'rows_for_length') return { kind: 'tool', text: `Estimated a length: about ${o.rows} rows` }
  if (name === 'stitch_library') return { kind: 'tool', text: 'Looked through the stitch-pattern library' }
  if (name === 'library_rows') return o.error ? { kind: 'problem', text: `A stitch pattern did not fit: ${o.error}` } : { kind: 'tool', text: 'Fetched the rows for a stitch pattern' }
  if (name === 'check_pattern' && o.ok && (o.shaping_warnings as string[])?.length) return { kind: 'problem', text: `A piece changes shape too abruptly, reshaping: ${(o.shaping_warnings as string[])[0]}` }
  if (name === 'check_pattern') return o.ok ? { kind: 'tool', text: 'Test-knitted a piece in the engine: every row fits' } : { kind: 'problem', text: `Test-knitting found a problem, revising: ${(o.errors as string[])[0]}` }
  if (name === 'submit_plan') return o.accepted ? { kind: 'done', text: 'Plan passed every check' } : { kind: 'problem', text: `The plan was sent back to be fixed: ${(o.fix_these as string[])[0]}` }
  return { kind: 'tool', text: name }
}

export async function design(input: { request: string; photo?: string }, state: State, send: Send, onActivity: (a: Activity) => void = () => {}, model = DESIGN_MODEL): Promise<Plan> {
  const content: Record<string, unknown>[] = [{ type: 'input_text', text: input.request.trim() || 'Design a pattern for the item in this photo.' }]
  if (input.photo) content.push({ type: 'input_image', image_url: input.photo })
  let next: Record<string, unknown> = { input: [{ role: 'user', content }] }

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await send({ model, instructions: DESIGNER, tools: TOOLS, reasoning: { effort: 'high', summary: 'auto' }, store: true, ...next })
    if (res.error) throw new Error(String((res.error as { message?: string }).message ?? 'The design service returned an error.'))
    const output = (res.output ?? []) as OutputItem[]
    for (const item of output) if (item.type === 'reasoning') for (const s of item.summary ?? []) {
      const headline = s.text?.match(/\*\*(.+?)\*\*/)?.[1] ?? s.text?.split('\n')[0]
      if (headline) onActivity({ kind: 'thinking', text: headline.slice(0, 120) })
    }
    const calls = output.filter((o) => o.type === 'function_call')
    if (calls.length === 0) {
      // The agent replied in words instead of handing in a plan. Send it back to finish the job.
      next = { previous_response_id: res.id, input: [{ role: 'user', content: [{ type: 'input_text', text: 'Hand in the plan by calling submit_plan.' }] }] }
      continue
    }
    const results: Record<string, unknown>[] = []
    for (const call of calls) {
      let args: Record<string, unknown> = {}
      try { args = JSON.parse(call.arguments || '{}') } catch { /* the tool will report what is missing */ }
      const { output: out, plan } = runTool(call.name ?? '', args, state)
      onActivity(describe(call.name ?? '', out))
      if (plan) return plan
      results.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(out) })
    }
    next = { previous_response_id: res.id, input: results }
  }
  throw new Error('The designer could not finish a plan that passes its checks. Try describing the item more simply.')
}
