const kinds = new Set(['provider_error', 'notification_error', 'receipt_error', 'script_error', 'unhandled_rejection', 'angular_error', 'healthcheck_error', 'delivery_error']);

export async function reportIssue(kind, { env = process.env, request = fetch, notify = false } = {}) {
  if (!kinds.has(kind)) return;
  console.error(JSON.stringify({ service: 'trifold-waitlist', issue: kind }));
  const deliveries = [];
  if (env.POSTHOG_PUBLIC_KEY) {
    const host = env.POSTHOG_HOST === 'https://eu.i.posthog.com' ? env.POSTHOG_HOST : 'https://us.i.posthog.com';
    deliveries.push(request(`${host}/capture/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: env.POSTHOG_PUBLIC_KEY, event: 'waitlist_operational_error',
        properties: { distinct_id: 'trifold-operations', kind, $process_person_profile: false } }),
      signal: AbortSignal.timeout(1500),
    }));
  }
  if (notify && env.RESEND_API_KEY && env.RESEND_NOTIFY_EMAIL) {
    deliveries.push(request('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `trifold-alert/${kind}/${new Date().toISOString().slice(0, 10)}` },
      body: JSON.stringify({ from: env.RESEND_FROM_EMAIL || 'Trifold <onboarding@resend.dev>', to: [env.RESEND_NOTIFY_EMAIL],
        subject: 'Trifold: revisa el registro de la lista de espera',
        text: `Se detectó un problema de tipo ${kind}. Revisa los registros de funciones en Netlify y el panel de Resend. Este aviso no contiene datos de suscriptores.` }),
      signal: AbortSignal.timeout(3000),
    }));
  }
  await Promise.allSettled(deliveries);
}

// A local backstop complements Netlify's distributed edge limit. No raw IPs are logged.
export function createLimiter(limit = 5, windowMs = 60000, clock = Date.now) {
  const entries = new Map();
  return (ip) => {
    if (!ip) return true; // Only trust the platform-provided context.ip, not request headers.
    const now = clock();
    for (const [key, value] of entries) if (value.until <= now) entries.delete(key);
    const entry = entries.get(ip) || { count: 0, until: now + windowMs };
    if (entries.size >= 2000 && !entries.has(ip)) return false;
    entry.count += 1; entries.set(ip, entry);
    return entry.count <= limit;
  };
}
