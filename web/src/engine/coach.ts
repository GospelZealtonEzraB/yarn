import { STITCH_PATTERNS } from '../patterns/stitches'

/**
 * The photo coach: what is sent to the vision model and how its answer is
 * checked before anything is shown.
 *
 * The model only ever describes what it sees. It is never asked for stitch
 * counts or sizing, and anything it returns outside the expected shape is
 * dropped. Patterns always come from the app's own tested templates.
 */
export const DEFAULT_MODEL = 'gpt-6.1-terra'
export const OPENAI_URL = 'https://api.openai.com/v1/responses'

const STITCH_IDS = STITCH_PATTERNS.map((s) => s.id)
const stitchList = STITCH_PATTERNS.map((s) => `"${s.id}" (${s.name})`).join(', ')

export interface CheckContext { project: string; step: string; stitchName: string; construction: 'flat' | 'round'; stitches: number }
export type Level = 'high' | 'medium' | 'low'
export interface Issue { problem: string; where: string; fix: string; confidence: Level }
export interface CheckResult {
  photoOk: boolean
  photoAdvice: string
  fabricSeen: string // a stitch id, "other" or "unclear"
  matchesExpected: 'yes' | 'no' | 'unclear'
  issues: Issue[]
  goingWell: string[]
  next: string
}
const RULES = `You help a beginner hand-knitter by looking at one photo.
Rules:
- Describe only what is clearly visible in the photo. If you are not sure, say so and use "unclear" or "low".
- Never invent problems. An empty list is a good answer.
- Never give stitch counts, sizes or a pattern. The app supplies those.
- Use plain words a beginner knows. Keep every text field under 240 characters.
- Reply with one JSON object and nothing else.`

/** One Responses API request: stored so it shows in the account's logs, with real reasoning switched on. */
function request(model: string, system: string, text: string, imageDataUrl: string) {
  return {
    model,
    instructions: system,
    reasoning: { effort: 'medium' },
    store: true,
    text: { format: { type: 'json_object' } },
    input: [{ role: 'user', content: [{ type: 'input_text', text }, { type: 'input_image', image_url: imageDataUrl }] }],
  }
}

/** The text of the model's answer in a Responses API reply. */
export function replyText(res: { output?: { type: string; content?: { type: string; text?: string }[] }[] }): string {
  return (res.output ?? []).filter((o) => o.type === 'message').flatMap((o) => o.content ?? []).map((c) => c.text ?? '').join('')
}

export function checkRequest(ctx: CheckContext, imageDataUrl: string, model = DEFAULT_MODEL) {
  return request(model, RULES, `The knitter is making: ${ctx.project}.
Current step: ${ctx.step}.
The fabric in this step should be: ${ctx.stitchName}, worked ${ctx.construction === 'flat' ? 'flat (back and forth)' : 'in the round'}.
Check the photo for mistakes a beginner makes: a dropped stitch or ladder, a stitch knitted where it should be purled or the reverse, an accidental extra stitch or hole, twisted stitches, uneven edges, very uneven tension.
JSON shape:
{
  "photo_ok": boolean,            // false if too dark, blurry or far away to judge stitches
  "photo_advice": string,         // how to retake it, or "" if fine
  "fabric_seen": one of ${stitchList}, "other", "unclear",
  "matches_expected": "yes" | "no" | "unclear",
  "issues": [ { "problem": string, "where": string, "fix": string, "confidence": "high" | "medium" | "low" } ],   // at most 4
  "going_well": [ string ],       // at most 3 specific things that look right
  "next": string                  // one sentence on what to do now
}`, imageDataUrl)
}

const text = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback)
const level = (v: unknown): Level => oneOf(v, ['high', 'medium', 'low'] as const, 'low')
const stitch = (v: unknown) => oneOf(v, [...STITCH_IDS, 'other', 'unclear'], 'unclear')

/** The model's reply as plain data. Throws only when it is not JSON at all. */
function object(raw: string): Record<string, unknown> {
  let v: unknown
  try { v = JSON.parse(raw) } catch { throw new Error('The reply could not be read. Try again.') }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('The reply could not be read. Try again.')
  return v as Record<string, unknown>
}

export function parseCheck(raw: string): CheckResult {
  const o = object(raw)
  const issues = (Array.isArray(o.issues) ? o.issues : []).slice(0, 4).flatMap((i): Issue[] => {
    if (!i || typeof i !== 'object') return []
    const r = i as Record<string, unknown>
    const problem = text(r.problem)
    return problem ? [{ problem, where: text(r.where), fix: text(r.fix), confidence: level(r.confidence) }] : []
  })
  return {
    photoOk: o.photo_ok !== false,
    photoAdvice: text(o.photo_advice),
    fabricSeen: stitch(o.fabric_seen),
    matchesExpected: oneOf(o.matches_expected, ['yes', 'no', 'unclear'] as const, 'unclear'),
    issues,
    goingWell: (Array.isArray(o.going_well) ? o.going_well : []).map((g) => text(g)).filter(Boolean).slice(0, 3),
    next: text(o.next),
  }
}

/** A plain message for the ways a call to the service can fail. */
export function explain(status: number, body: string): string {
  if (status === 401) return 'OpenAI did not accept the key. Check it was copied in full.'
  if (status === 429) return 'OpenAI says the limit for this key has been reached, or it has no credit. Check your OpenAI billing page.'
  if (status === 404 || /model/i.test(body)) return 'OpenAI does not offer that model on this key. Change the model name in the settings below.'
  if (status >= 500) return 'OpenAI is having trouble right now. Try again in a minute.'
  return `OpenAI returned an error (${status}).`
}
