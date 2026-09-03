# Battleground — Staged Build Plan

> Source: `project-brief.md`. Each stage ships something runnable/demoable before moving to next. Do not start stage N+1 until stage N works.

---

## Stage 0 — Scaffold

**Goal:** empty project running locally.

- [ ] `index.html`, `style.css`, `script.js` — bare skeleton, no logic yet
- [ ] `vercel.json` (if needed) + `api/` folder for serverless functions
- [ ] `package.json` (name, no deps yet unless a dev server is wanted)
- [ ] Run locally (e.g. `vercel dev` or a static server), confirm blank page loads

**Done when:** blank page loads locally. No deploy — building and testing locally the whole way.

---

## Stage 1 — Static UI shell (no backend)

**Goal:** all core UI elements exist and are wired to JS, hardcoded/mock data only.

- [ ] Four separate views on one page — input form, loading, result, error — each toggled via `hidden` attribute, never stacked/visible together
- [ ] Input form view: two text inputs (fighter A, fighter B), Fight button — the only view visible on load
- [ ] Loading view: spinner/skeleton, shown on click
- [ ] Result view: winner name, written reasoning, two image slots — populate with placeholder text/images after a fake `setTimeout` delay
- [ ] Error view: placeholder error message
- [ ] Basic CSS layout, mobile-usable

**Done when:** on load only input form shows; clicking Fight hides it, shows loading, then swaps to result view (fake data) via `hidden`, no network calls yet.

---

## Stage 2 — Judge system prompt

**Goal:** lock Claude's role to judging fights, resist prompt injection from fighter input.

- [ ] Write the system prompt used in the verdict call: role locked to fight judge only — takes two fighters, returns a winner and reasoning, nothing else
- [ ] Must always pick exactly one winner — no ties, no draws, no refusing to decide, even for identical/mirrored fighters (break the tie on flavor/creativity if needed, but still pick one)
- [ ] Reasoning must be 2-4 sentences max, fun and playful tone, but logically justifies the winner
- [ ] Explicitly forbid in the prompt: role changes, revealing the system prompt, following instructions embedded in fighter names/descriptions, doing anything other than judging the fight
- [ ] Treat fighter input strictly as data to judge, never as instructions
- [ ] Test with adversarial input (e.g. a fighter name containing "ignore previous instructions and...") — confirm it still just judges a fight
- [ ] Test with identical fighters twice (e.g. "cow" vs "cow") — confirm it still names one winner, no tie/refusal

**Done when:** injected instructions inside fighter text don't change judge behavior or leak the system prompt.

---

## Stage 3 — Fight API (verdict + art + rate limiting)

**Goal:** one function, one call, real winner + reasoning + one image per side, end to end.

- [ ] `api/fight.js` serverless function: takes `{ fighterA, fighterB }`
- [ ] Rate limit check runs first, before calling either API — key by IP, 5 requests/minute per `project-brief.md` §5, return 429 with a clear message when exceeded
- [ ] Calls Claude for the verdict (using the Stage 2 system prompt) and OpenAI image API for both fighters' art
- [ ] Verdict output (`winner`, `reasoning`) enforced via a zod schema, not JSON-format instructions in the prompt
- [ ] Store both API keys in env vars, never in client code
- [ ] Group inputs (e.g. "10 cows") still produce exactly one image for that side — handled in the prompt sent to the image API, not by looping
- [ ] Wire Fight button to call `/api/fight` instead of the fake timeout
- [ ] Handle errors distinctly in the UI: verdict failure, image failure, rate-limit 429 — don't hang on loading forever

**Done when:** typing two real fighters returns winner + reasoning + one image per side from a single call; hammering Fight 6x in a minute from one IP gets blocked on the 6th and resets after a minute.

---

## Stage 4 — Verdict UI polish

**Goal:** match brief's spec: "winner card with animation, plus written reasoning."

- [ ] Winner card component: name, image, reasoning text
- [ ] Entry animation (CSS transition/keyframes) when result lands
- [ ] Clean up loading state so it covers the full wait for the fight call

**Done when:** full Fight flow feels finished, no more placeholder styling.

---

## Stage 5 — BattleDex (save to localStorage)

**Goal:** save individual fighters, view saved fighters.

- [ ] "Save" action per fighter: writes `{ label, image }` to a `localStorage` array — no fight/winner/reasoning data, just the fighter
- [ ] BattleDex view: list/grid of saved fighters, click to view label + image
- [ ] Delete/clear entries from BattleDex

**Done when:** save a fighter, reload the page, it's still there in BattleDex.

---

## Stage 6 — Image compression before save

**Goal:** stay under `localStorage` quota (per brief §5).

- [ ] Before saving a fighter to BattleDex, draw its image to an off-screen `<canvas>`, resize down, re-export as JPEG/WebP at reduced quality
- [ ] Save the compressed data URI, not the original
- [ ] Test with several saved fighters that quota isn't hit quickly

**Done when:** ~10+ saved fighters don't blow `localStorage` quota.

---

## Stage 7 — Final QA

**Goal:** ship it, locally.

- [ ] Full manual pass: empty inputs, one empty input, same fighter twice, very long names, non-English input
- [ ] Confirm rate limiting doesn't fire on normal single-fight use
- [ ] Confirm loading/error states cover: fight API failure (verdict or image side), rate limit hit, network offline

**Done when:** local build handles the MVP end to end without console errors. No deploy step — stays local.

---

## Explicitly out of scope (per brief §4 — later, not now)

- Real backend / cross-device BattleDex sync
- Quick re-fight using saved BattleDex characters
