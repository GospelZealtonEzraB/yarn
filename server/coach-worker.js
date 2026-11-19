/**
 * Coach relay, for Cloudflare Workers (free plan is enough).
 *
 * The app sends its requests here instead of to OpenAI. This worker adds the
 * OpenAI key, which is stored as a secret on Cloudflare and never reaches the
 * browser, and passes the answer back.
 *
 * It is deliberately narrow so it cannot be used as a general-purpose OpenAI
 * proxy: it only accepts requests from the app's own address, only with the
 * app's own two sets of instructions, with a fixed model, a size limit and a
 * cap on how much one reply may cost.
 *
 * Settings on Cloudflare:
 *   OPENAI_API_KEY  secret   the OpenAI key
 *   ALLOWED_ORIGIN  variable the app's address, e.g. https://gospelzealtonezrab.github.io
 *   MODEL           variable optional, defaults to gpt-6.1-terra
 */
const MAX_BYTES = 1_500_000
const MAX_OUTPUT_TOKENS = 30_000
// The opening words of the app's two jobs: checking a photo, and designing a pattern.
const JOBS = ['You help a beginner hand-knitter by looking at one photo.', 'You are a knitting designer and teacher working inside a learn-to-knit app.']
const EFFORTS = ['low', 'medium', 'high']

// A 204 reply must not carry a body.
const reply = (status, body, origin) => new Response(status === 204 ? null : JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  },
})

/** Kept separate from the Cloudflare entry point so it can be tested with a stand-in for OpenAI. */
export async function handle(request, env, send = fetch) {
  const allowed = env.ALLOWED_ORIGIN || ''
  const origin = request.headers.get('Origin') || ''
  if (!allowed || origin !== allowed) return reply(403, { error: { message: 'This address may not use the coach.' } }, allowed)
  if (request.method === 'OPTIONS') return reply(204, {}, allowed)
  if (request.method !== 'POST') return reply(405, { error: { message: 'Send a POST request.' } }, allowed)
  if (!env.OPENAI_API_KEY) return reply(503, { error: { message: 'The coach has no OpenAI key set.' } }, allowed)

  const raw = await request.text()
  if (raw.length > MAX_BYTES) return reply(413, { error: { message: 'The photo is too large.' } }, allowed)
  let body
  try { body = JSON.parse(raw) } catch { return reply(400, { error: { message: 'The request could not be read.' } }, allowed) }

  const ok = typeof body.instructions === 'string' && JOBS.some((j) => body.instructions.startsWith(j)) && Array.isArray(body.input) && body.input.length > 0
  if (!ok) return reply(400, { error: { message: 'Only the knitting coach may use this service.' } }, allowed)

  // Rebuilt from named parts, so nothing else the caller sent is passed on, and the model and spending cap are ours.
  const forward = {
    model: env.MODEL || 'gpt-6.1-terra',
    instructions: body.instructions,
    input: body.input,
    store: true,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    reasoning: { effort: EFFORTS.includes(body.reasoning?.effort) ? body.reasoning.effort : 'medium', summary: 'auto' },
  }
  if (Array.isArray(body.tools)) forward.tools = body.tools.filter((t) => t?.type === 'function') // the app's own tools only: no web search, no code
  if (typeof body.previous_response_id === 'string') forward.previous_response_id = body.previous_response_id
  if (body.text?.format?.type === 'json_object') forward.text = { format: { type: 'json_object' } }

  const upstream = await send('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify(forward),
  })
  const text = await upstream.text()
  let data
  try { data = JSON.parse(text) } catch { data = { error: { message: 'OpenAI sent an unreadable reply.' } } }
  return reply(upstream.status, data, allowed)
}

export default { fetch: (request, env) => handle(request, env) }
