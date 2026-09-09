const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { z } = require('zod');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { JUDGE_SYSTEM_PROMPT } = require('./judge-prompt');
const { ART_STYLE_TEMPLATE } = require('./art-style');

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env
const openai = new OpenAI(); // reads OPENAI_API_KEY from env

const VerdictSchema = z.object({
  winner: z.string(),
  reasoning: z.string(),
});

// ponytail: in-memory rate limit, per-instance only — resets on cold start and
// isn't shared across concurrent serverless instances. Fine for local/single-
// instance use; move to Vercel KV/Upstash if this needs to hold under real traffic.
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;
const hits = new Map(); // ip -> timestamps[]

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

class ModerationBlockedError extends Error {}
class ImageGenerationError extends Error {}

// One image per fighter, whatever the input ("10 cows" still gets one image,
// not ten) — that's on the model to honor from the prompt text itself.
async function generateFighterImage(fighterText) {
  try {
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `A single character portrait representing: ${fighterText}. ${ART_STYLE_TEMPLATE}`,
      size: '1024x1024',
      n: 1,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new ImageGenerationError('No image returned');
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    const code = err?.code || err?.error?.code;
    if (code === 'moderation_blocked' || code === 'content_policy_violation') {
      throw new ModerationBlockedError(fighterText);
    }
    throw new ImageGenerationError(err?.message || 'Image generation failed');
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many fights — wait a minute and try again.' });
    return;
  }

  const { fighterA, fighterB } = req.body || {};
  if (!fighterA || !fighterB) {
    res.status(400).json({ error: 'Both fighters are required.' });
    return;
  }

  let verdict;
  try {
    const response = await anthropic.messages.parse({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      output_config: { effort: 'low', format: zodOutputFormat(VerdictSchema) },
      system: JUDGE_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Fighter A: ${fighterA}\nFighter B: ${fighterB}` },
      ],
    });
    if (!response.parsed_output) {
      res.status(502).json({ error: 'Judge failed to reach a verdict. Try again.' });
      return;
    }
    verdict = response.parsed_output;
  } catch (err) {
    console.error('Verdict call failed:', err);
    res.status(502).json({ error: 'Verdict service is unavailable. Try again.' });
    return;
  }

  let imageA, imageB;
  try {
    [imageA, imageB] = await Promise.all([
      generateFighterImage(fighterA),
      generateFighterImage(fighterB),
    ]);
  } catch (err) {
    console.error('Image generation failed:', err);
    if (err instanceof ModerationBlockedError) {
      res.status(422).json({ error: `"${err.message}" was blocked by content moderation — try a different fighter.` });
      return;
    }
    res.status(502).json({ error: 'Character art failed to generate. Try again.' });
    return;
  }

  res.status(200).json({ ...verdict, imageA, imageB });
};
