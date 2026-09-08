# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Battleground: type two fighters, get an AI-generated verdict on who'd win plus AI-generated character art for both. Vanilla HTML/CSS/JS frontend, Vercel serverless functions for the backend, no framework, no build step. See `project-brief.md` for full scope/decisions and `project-build.md` for the staged build plan — **check `project-build.md` before starting work to see what stage the project is on and what's done/not done.**

## Commands

- `vercel dev` — run locally (serves static files + `api/` functions together). No separate frontend build.
- No test suite, no linter configured yet.

## Architecture

- **Frontend is one page, four views**: `index.html` has `#view-form`, `#view-loading`, `#view-result`, `#view-error` sections, each toggled via the `hidden` attribute by `showView()` in `script.js`. Never show more than one at once — don't add a fifth ad-hoc state without going through `showView`.
- **`script.js` owns all view transitions and DOM wiring.** `runFight(fighterA, fighterB)` is the single entry point that drives form → loading → result/error. It calls `fetch('/api/fight')` for the verdict (winner/reasoning); image URLs are still placeholders until art generation is wired in.
- **`showResult({ winner, reasoning, imageA, imageB })`** is the fixed shape the backend must return: `winner` must be the exact verbatim text of one of the two fighter inputs (not paraphrased), `reasoning` a short string, `imageA`/`imageB` image URLs/data URIs.
- **`api/` holds serverless functions**, one file per endpoint (Vercel convention — each file is its own route, no router). `api/judge-prompt.js` exports `JUDGE_SYSTEM_PROMPT`, the locked system prompt for the verdict call; import it into `api/fight.js` rather than inlining prompt text there.
- **Judge prompt design** (`api/judge-prompt.js`): treats fighter text strictly as data to be judged, never as instructions — this is the prompt-injection defense, don't weaken it when editing. Must always name exactly one winner (no ties/refusals, even for identical fighters), reasoning capped at 2-4 sentences. Output shape (winner/reasoning) is enforced via a zod schema in the API call, not via JSON-formatting instructions in the prompt text itself.
- **Two external APIs, both server-side only**: Claude for the verdict, OpenAI's image API for character art. Keys live in env vars, never in client code (`script.js` or `index.html`) — all calls to these APIs happen inside `api/` functions.
- **Rate limiting**: 5 requests/minute per IP, checked first in `api/fight.js` before either external API call, returns 429.
- **Group inputs** (e.g. "10 cows") get exactly one image per side — enforce this in the prompt sent to the image API, not by looping over units.
- **BattleDex** (Stage 5+): saved fighters live in `localStorage` only, as `{ label, image }` — no fight/winner/reasoning data. Images are downsized via off-screen `<canvas>` and re-exported as compressed JPEG/WebP before saving, to stay under storage quota (Stage 6).
- No routing/state library — everything is direct DOM manipulation by element ID.
