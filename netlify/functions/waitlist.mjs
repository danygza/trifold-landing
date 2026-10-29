import { createHash } from 'node:crypto';

export const config = {
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip'] },
};

const json = (status, body) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

// Dependency injection keeps tests offline and prevents test emails being sent.
export function createHandler({ env = process.env, request = fetch } = {}) {
  return async (req) => {
    if (req.method !== 'POST') return json(405, { success: false });
    const origin = req.headers.get('origin');
    if (!origin || origin !== new URL(req.url).origin) return json(403, { success: false });
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return json(415, { success: false });
    }
    let body;
    try {
      const raw = await req.text();
      if (raw.length > 2048) return json(413, { success: false });
      body = JSON.parse(raw);
    } catch { return json(400, { success: false }); }
    if (!body || typeof body !== 'object') return json(400, { success: false });
    if (body.botcheck) return json(200, { success: true });
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(400, { success: false, error: 'invalid_email' });
    }
    if (!env.RESEND_API_KEY || !env.RESEND_SEGMENT_ID) {
      return json(503, { success: false, error: 'unavailable' });
    }
    async function resend(path, options = {}) {
      return request(`https://api.resend.com${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json', ...options.headers },
        signal: AbortSignal.timeout(8000),
      });
    }
    try {
      // Preserve existing unsubscribe preferences, and avoid duplicate receipts.
      const existing = await resend(`/contacts/${encodeURIComponent(email)}`);
      if (existing.ok) {
        const contact = await existing.json();
        if (!contact.id || typeof contact.unsubscribed !== 'boolean') throw new Error('invalid_contact');
        if (!contact.unsubscribed) {
          const added = await resend(`/contacts/${encodeURIComponent(contact.id)}/segments/${encodeURIComponent(env.RESEND_SEGMENT_ID)}`, { method: 'POST' });
          if (!added.ok) throw new Error('segment_failed');
        }
        return json(200, { success: true });
      }
      if (existing.status !== 404) throw new Error('lookup_failed');
      const created = await resend('/contacts', {
        method: 'POST',
        body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: env.RESEND_SEGMENT_ID }] }),
      });
      const contact = await created.json();
      if (!created.ok || !contact.id) throw new Error('save_failed');

      // Email delivery must not undo a persisted signup. Send independent alerts
      // concurrently so adding an owner alert does not extend the signup timeout.
      async function sendEmail(payload, key, kind) {
        try {
          const sent = await resend('/emails', {
            method: 'POST',
            headers: { 'Idempotency-Key': key },
            body: JSON.stringify(payload),
          });
          const result = await sent.json();
          if (!sent.ok || !result.id) console.warn(`Trifold waitlist ${kind} failed`);
        } catch { console.warn(`Trifold waitlist ${kind} failed`); }
      }
      const deliveries = [];
      if (env.RESEND_NOTIFY_EMAIL) {
        deliveries.push(sendEmail({
          from: env.RESEND_FROM_EMAIL || 'Trifold <onboarding@resend.dev>',
          to: [env.RESEND_NOTIFY_EMAIL],
          subject: 'Nuevo registro en la lista de espera de Trifold',
          text: 'Se guardó un nuevo registro en la lista de espera de Trifold. Revisa tu segmento de Trifold en Resend para ver los detalles.',
        }, `trifold-owner/${contact.id}`, 'owner notification'));
      }
      if (env.RESEND_FROM_EMAIL) {
        const hash = createHash('sha256').update(email).digest('hex');
        deliveries.push(sendEmail({
          from: env.RESEND_FROM_EMAIL, to: [email],
          ...(env.RESEND_REPLY_TO ? { reply_to: env.RESEND_REPLY_TO } : {}),
          subject: "You're on the Trifold waitlist",
          text: "Thanks for joining the Trifold waitlist! We'll email you when early access is available.\n\nTrifold — shared finances, simplified.",
        }, `trifold-welcome/${hash}`, 'receipt'));
      }
      await Promise.all(deliveries);
      return json(200, { success: true });
    } catch {
      // Never log addresses, keys, or provider response bodies.
      console.error('Trifold waitlist provider request failed');
      return json(502, { success: false, error: 'provider_error' });
    }
  };
}
export default createHandler();
