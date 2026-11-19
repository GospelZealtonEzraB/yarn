/**
 * Photo coach relay, for Cloudflare Workers (free plan is enough).
 *
 * The app sends its request here instead of to OpenAI. This worker adds the
 * OpenAI key, which is stored as a secret on Cloudflare and never reaches the
 * browser, and passes the answer back.
 *
 * It is deliberately narrow so it cannot be used as a general-purpose OpenAI
 * proxy: it only accepts requests from the app's own address, only the coach's
 * own instructions, exactly one photo, a size limit and a fixed model.
 *
 * Settings on Cloudflare:
 *   OPENAI_API_KEY  secret   the OpenAI key
 *   ALLOWED_ORIGIN  variable the app's address, e.g. https://gospelzealtonezrab.github.io
 *   MODEL           variable optional, defaults to gpt-6.1-terra
 */
const MAX_BYTES = 1_500_000
const RULES_START = 'You help a beginner hand-knitter by looking at one photo.'

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

  const messages = Array.isArray(body.messages) ? body.messages : []
  const system = messages[0], user = messages[1]
  const parts = Array.isArray(user?.content) ? user.content : []
  const ok = messages.length === 2
    && system?.role === 'system' && typeof system.content === 'string' && system.content.startsWith(RULES_START)
    && user?.role === 'user' && parts.length === 2
    && parts[0]?.type === 'text' && typeof parts[0].text === 'string'
    && parts[1]?.type === 'image_url' && String(parts[1].image_url?.url).startsWith('data:image/jpeg;base64,')
  if (!ok) return reply(400, { error: { message: 'Only the knitting coach may use this service.' } }, allowed)

  // Rebuilt from the checked parts, so nothing else the caller sent is passed on.
  const upstream = await send('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: env.MODEL || 'gpt-6.1-terra', response_format: { type: 'json_object' }, messages: [system, user] }),
  })
  const text = await upstream.text()
  let data
  try { data = JSON.parse(text) } catch { data = { error: { message: 'OpenAI sent an unreadable reply.' } } }
  return reply(upstream.status, data, allowed)
}

export default { fetch: (request, env) => handle(request, env) }
