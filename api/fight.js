const Anthropic = require('@anthropic-ai/sdk');
const { z } = require('zod');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { JUDGE_SYSTEM_PROMPT } = require('./judge-prompt');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

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

  try {
    const response = await client.messages.parse({
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

    res.status(200).json(response.parsed_output);
  } catch (err) {
    console.error('Verdict call failed:', err);
    res.status(502).json({ error: 'Verdict service is unavailable. Try again.' });
  }
};
