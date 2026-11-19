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
export const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

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
export interface IdentifyResult {
  item: 'scarf' | 'hat' | 'mitts' | 'other'
  itemOther: string
  stitch: string // a stitch id, "other" or "unclear"
  stitchOther: string
  colours: number
  worked: 'flat' | 'round' | 'unclear'
  confidence: Level
  notes: string
}

const RULES = `You help a beginner hand-knitter by looking at one photo.
Rules:
- Describe only what is clearly visible in the photo. If you are not sure, say so and use "unclear" or "low".
- Never invent problems. An empty list is a good answer.
- Never give stitch counts, sizes or a pattern. The app supplies those.
- Use plain words a beginner knows. Keep every text field under 240 characters.
- Reply with one JSON object and nothing else.`

function request(model: string, system: string, text: string, imageDataUrl: string) {
  return {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: imageDataUrl } }] },
    ],
  }
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

export function identifyRequest(imageDataUrl: string, model = DEFAULT_MODEL) {
  return request(model, RULES, `The photo shows a finished knitted item the knitter would like to make.
Say what it is and what stitch pattern its main fabric uses.
JSON shape:
{
  "item": "scarf" | "hat" | "mitts" | "other",
  "item_other": string,           // what it is, if "other"; else ""
  "stitch": one of ${stitchList}, "other", "unclear",
  "stitch_other": string,         // name it if "other" (for example cables, lace, colourwork); else ""
  "colours": number,              // how many yarn colours
  "worked": "flat" | "round" | "unclear",
  "confidence": "high" | "medium" | "low",
  "notes": string                 // anything that affects whether a beginner could make it
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

export function parseIdentify(raw: string): IdentifyResult {
  const o = object(raw)
  const colours = Number(o.colours)
  return {
    item: oneOf(o.item, ['scarf', 'hat', 'mitts', 'other'] as const, 'other'),
    itemOther: text(o.item_other, 80),
    stitch: stitch(o.stitch),
    stitchOther: text(o.stitch_other, 80),
    colours: Number.isFinite(colours) && colours >= 1 && colours <= 20 ? Math.round(colours) : 1,
    worked: oneOf(o.worked, ['flat', 'round', 'unclear'] as const, 'unclear'),
    confidence: level(o.confidence),
    notes: text(o.notes),
  }
}

/** Which of the app's projects, in which stitch, comes closest to what was identified. */
export function closestProject(r: IdentifyResult, styles: Record<string, string[] | undefined>): { project: string; style?: string; exact: boolean } | null {
  const pick = (project: string): { project: string; style?: string; exact: boolean } => {
    const offered = styles[project] ?? []
    const has = offered.includes(r.stitch)
    return { project, style: has ? r.stitch : offered[0], exact: has && r.colours === 1 }
  }
  if (r.item === 'scarf') return r.stitch === 'garter' ? { project: 'scarf', exact: r.colours === 1 } : pick('ribscarf')
  if (r.item === 'hat') return pick('beanie')
  if (r.item === 'mitts') return pick('mitts')
  return null
}

/** A plain message for the ways a call to the service can fail. */
export function explain(status: number, body: string): string {
  if (status === 401) return 'OpenAI did not accept the key. Check it was copied in full.'
  if (status === 429) return 'OpenAI says the limit for this key has been reached, or it has no credit. Check your OpenAI billing page.'
  if (status === 404 || /model/i.test(body)) return 'OpenAI does not offer that model on this key. Change the model name in the settings below.'
  if (status >= 500) return 'OpenAI is having trouble right now. Try again in a minute.'
  return `OpenAI returned an error (${status}).`
}
