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
export const MAX_TURNS = 14

export const DESIGNER = `You are a knitting designer and teacher working inside a learn-to-knit app.
The knitter shows you a photo, a description, or both, of something they want to make. Design it for THEM: a custom pattern in their gauge and measurements, plus what they must learn and buy to make it.

How to work:
1. Study the photo and request. Work out the item, its shape, how it is constructed, its stitch patterns and colours.
2. Call knitter_profile. Design for this knitter's gauge, measurements and current skills.
3. Decide the construction and split the item into sections in knitting order, including non-knitting steps (cast on, join, seam, bind off).
4. Get every stitch and row count from the tools. Never guess arithmetic.
5. Call check_pattern and fix what it reports. Repeat until it passes.
6. List every skill the design needs, in the order to learn them, prerequisites first. Where an existing lesson teaches a skill, give its id. For every other skill write a new lesson: a goal, 4 to 8 concrete steps a beginner can follow with needles in hand (yarn held in the right hand, English style), how to tell it worked, and the most common mistake with its fix.
7. Choose the tools and yarn for this design: needle type, size and length, and anything else needed, each with the reason.
8. Call submit_plan. If it comes back with problems, fix them and submit again.

Rules:
- Design what was asked for. Do not swap it for something simpler. If it is well beyond the knitter's skills, say so plainly in the summary, and still give the full plan with the skills in learning order.
- Be honest about uncertainty. Put what you assumed from the photo in assumptions.
- Rows can only use the shorthand described by knitter_profile. Anything it cannot express, explain in the section's instructions and list in not_checked so the knitter knows that part was not machine-verified.
- Row counts are estimates: every knitted section needs an "until" the knitter can measure.
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
  if (name === 'check_pattern') return o.ok ? { kind: 'tool', text: 'Knitted the draft pattern in the engine: every row fits' } : { kind: 'problem', text: `Test-knitting found a problem, revising: ${(o.errors as string[])[0]}` }
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
