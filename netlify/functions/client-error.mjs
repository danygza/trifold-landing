import { createLimiter, reportIssue } from '../lib/operations.mjs';
export const config = { path: '/api/client-error', rateLimit: { action: 'rate_limit', windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
const admit = createLimiter();
export default async (req, context = {}) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response(null, { status: 403 });
  if (!admit(context.ip)) return new Response(null, { status: 429 });
  try {
    const raw = await req.text();
    if (raw.length > 128) return new Response(null, { status: 413 });
    const { kind } = JSON.parse(raw);
    if (!['script_error', 'unhandled_rejection', 'angular_error'].includes(kind)) return new Response(null, { status: 400 });
    await reportIssue(kind, { notify: true });
    return new Response(null, { status: 202 });
  } catch { return new Response(null, { status: 400 }); }
};
