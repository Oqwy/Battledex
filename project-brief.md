# Battleground — Project Brief
## 1. What are we actually building? (Scope)

A web app where you type in two fighters and get an AI generated verdict on who'd win, plus AI generated character art for both.

## 2. What's the smallest, simplest version worth shipping (MVP)?

Two text inputs, a Fight button, a working verdict with art, a loading state while we wait on the API, and a basic BattleDex saved to localStorage. Type two fighters, get a real result, save it if you want.

## 3. What are we building this with (tech stack)?

HTML, CSS, and vanilla JS for the frontend. Vercel for hosting and serverless functions. Claude's API for the verdict. OpenAI's image API for the character art. localStorage for saving BattleDex.

## 4. What's the long-term vision, beyond just the MVP?

I would eventually like a real backend where BattleDex characters sync across devices instead of just living in localStorage. I'd also want a quick re-fight option using characters already saved in the BattleDex, instead of typing two new ones every time.

## 5. Who is it for, and what does "done" mean?

- **Audience, in two phases**:
  1. **Friends phase** — me and friends play with it and work out the initial feedback.
  2. **Public phase** — once that feedback is addressed, the link is shared publicly.
- **Done (MVP)**: deployed to Vercel with a link I can share with friends.
- **Before going public**: a real (shared-store) rate limit and a monthly spend cap must be in place — the friends-phase shortcuts below don't hold up to public traffic.
- **Not a use case**: real people or famous/copyrighted characters. If the image API refuses one, that's acceptable — no prompt workarounds.

## 6. Details decided so far

- **Rate limiting**: 5 requests per minute per IP. Soft limit — in-memory per serverless instance, resets on cold start. Fine for the friends phase; must move to a shared store (e.g. Vercel KV / Upstash) before the public phase.
- **Spend limit**: none yet; a monthly cap will be added before the public phase.
- **Fighter input**: max 50 characters per fighter.
- **Verdict rules**: always exactly one winner (no ties, even for identical fighters); reasoning 2-4 sentences. Fighter text is treated strictly as data, never as instructions (prompt-injection defense).
- **Partial failure**: if the verdict succeeds but an image fails or is moderation-blocked, still show the verdict, with placeholder text in that fighter's image slot instead of failing the whole fight.
- **Art style**: every image uses one shared 16-bit pixel-art style template (see `api/art-style.js`).
- **BattleDex**: lives on its own page (`battledex.html`).
- **Verdict format**: winner card with animation, plus written reasoning for the win.
- **Character art**: one image per side. Group inputs (e.g. "10 cows vs 10 lions") still get one image per side, not one per unit.
- **Image storage**: images downsized/compressed client-side (canvas resize + JPEG/WebP quality) before saving to localStorage, to stay under browser storage quota.