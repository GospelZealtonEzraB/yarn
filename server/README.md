# Photo coach relay

A small Cloudflare Worker that holds the OpenAI key so the app does not need
one. Free plan is enough.

## Set up (about ten minutes, once)

1. Create a free account at cloudflare.com.
2. In the dashboard: **Workers & Pages → Create → Worker**. Name it
   `loopwise-coach` and create it.
3. Open **Edit code**, replace everything with the contents of
   `coach-worker.js` from this folder, and **Deploy**.
4. In the worker's **Settings → Variables and Secrets**, add:
   - `OPENAI_API_KEY` as a **Secret**: your OpenAI key.
   - `ALLOWED_ORIGIN` as text: `https://gospelzealtonezrab.github.io`
5. Copy the worker's address. It looks like
   `https://loopwise-coach.<your-name>.workers.dev`.
6. On GitHub, open the repository's **Settings → Secrets and variables →
   Actions → Variables**, and add a variable named `COACH_URL` with that
   address.
7. Re-run the latest "Deploy to GitHub Pages" workflow. The Coach tab now
   works with no key.

## Keeping the bill small

Set a monthly spending limit in your OpenAI account. The worker only accepts
requests from the app's own address and only the coach's own instructions, but
it has no per-person limit, so the spending cap is the real safety net.
