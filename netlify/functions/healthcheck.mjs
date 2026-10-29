import { reportIssue } from '../lib/operations.mjs';
export const config = { schedule: '@hourly' };

export function createHealthcheck({ env = process.env, request = fetch } = {}) {
  return async () => {
    try {
      if (!env.RESEND_API_KEY || !env.RESEND_SEGMENT_ID) throw new Error('configuration');
      const headers = { Authorization: `Bearer ${env.RESEND_API_KEY}` };
      const segment = await request(`https://api.resend.com/segments/${encodeURIComponent(env.RESEND_SEGMENT_ID)}`, { headers, signal: AbortSignal.timeout(6000) });
      if (!segment.ok || !(await segment.json()).id) throw new Error('provider');
      // Check recent delivery outcomes without logging addresses or copying message bodies.
      const emails = await request('https://api.resend.com/emails?limit=100', { headers, signal: AbortSignal.timeout(6000) });
      const list = await emails.json();
      if (!emails.ok || !Array.isArray(list.data)) throw new Error('delivery_status');
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const failed = list.data.some(item => typeof item.subject === 'string' && item.subject.includes('Trifold') &&
        !item.subject.startsWith('Trifold: revisa') && new Date(item.created_at).getTime() >= cutoff &&
        ['bounced', 'failed', 'delivery_failed', 'suppressed'].includes(item.last_event));
      if (failed) await reportIssue('delivery_error', { env, request, notify: true });
      return Response.json({ healthy: !failed });
    } catch {
      await reportIssue('healthcheck_error', { env, request, notify: true });
      return Response.json({ healthy: false }, { status: 503 });
    }
  };
}
export default createHealthcheck();
