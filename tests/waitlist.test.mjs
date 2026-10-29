import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, config } from '../netlify/functions/waitlist.mjs';

const env = { RESEND_API_KEY: 'test-secret', RESEND_SEGMENT_ID: 'waitlist-segment', RESEND_FROM_EMAIL: 'Trifold <hello@example.com>' };
const response = (status, body) => Response.json(body, { status });
const req = (body = { email: '  USER@example.com  ' }, options = {}) => new Request('https://trifold.example/api/waitlist', {
  method: 'POST', headers: { origin: 'https://trifold.example', 'content-type': 'application/json', ...options.headers },
  body: JSON.stringify(body),
});
function setup(replies, vars = env) {
  const calls = [];
  const handler = createHandler({ env: vars, request: async (url, opts) => {
    calls.push({ url, ...opts });
    assert.ok(replies.length, 'unexpected outbound request');
    const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return reply;
  }});
  return { handler, calls };
}

test('new signup persists normalized contact in segment before sending receipt', async () => {
  const { handler, calls } = setup([response(404, {}), response(200, { id: 'contact-1' }), response(200, { id: 'email-1' })]);
  const res = await handler(req());
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
  assert.deepEqual(JSON.parse(calls[1].body), { email: 'user@example.com', unsubscribed: false, segments: [{ id: 'waitlist-segment' }] });
  assert.deepEqual(JSON.parse(calls[2].body).to, ['user@example.com']);
  assert.match(calls[2].headers['Idempotency-Key'], /^trifold-welcome\/[a-f0-9]{64}$/);
  assert.equal(calls[0].headers.Authorization, 'Bearer test-secret');
  assert.ok(calls.every(c => c.signal instanceof AbortSignal));
});

test('repeat signup preserves unsubscribe and does not send another receipt', async () => {
  const { handler, calls } = setup([response(200, { id: 'contact-1', unsubscribed: true })]);
  assert.equal((await handler(req())).status, 200);
  assert.equal(calls.length, 1);
});

test('existing subscribed contact joins waitlist segment without a receipt', async () => {
  const { handler, calls } = setup([response(200, { id: 'contact-1', unsubscribed: false }), response(200, { id: 'membership' })]);
  assert.equal((await handler(req())).status, 200);
  assert.match(calls[1].url, /contacts\/contact-1\/segments\/waitlist-segment$/);
  assert.equal(calls[1].method, 'POST');
});

test('invalid email never reaches provider', async () => {
  const { handler, calls } = setup([]);
  assert.equal((await handler(req({ email: 'invalid' }))).status, 400);
  assert.equal(calls.length, 0);
});

test('cross-origin requests are rejected', async () => {
  const { handler, calls } = setup([]);
  assert.equal((await handler(req({}, { headers: { origin: 'https://other.example' } }))).status, 403);
  assert.equal(calls.length, 0);
});

test('honeypot never reaches provider', async () => {
  const { handler, calls } = setup([]);
  assert.equal((await handler(req({ email: 'bot@example.com', botcheck: true }))).status, 200);
  assert.equal(calls.length, 0);
});

test('missing configuration fails closed', async () => {
  const { handler, calls } = setup([], {});
  assert.equal((await handler(req())).status, 503);
  assert.equal(calls.length, 0);
});

test('provider HTTP errors never become signup success', async () => {
  const { handler } = setup([response(404, {}), response(400, { message: 'bad request' })]);
  assert.equal((await handler(req())).status, 502);
});

test('provider 200 without contact ID never becomes signup success', async () => {
  const { handler } = setup([response(404, {}), response(200, { error: 'failed' })]);
  assert.equal((await handler(req())).status, 502);
});

test('lookup timeout returns retryable failure', async () => {
  const { handler } = setup([new DOMException('Timed out', 'TimeoutError')]);
  assert.equal((await handler(req())).status, 502);
});

test('receipt failure preserves successful persisted signup', async () => {
  const { handler } = setup([response(404, {}), response(200, { id: 'contact-1' }), response(503, {})]);
  assert.equal((await handler(req())).status, 200);
});

test('sender can be omitted for contact-only setup', async () => {
  const { handler, calls } = setup([response(404, {}), response(200, { id: 'contact-1' })], { ...env, RESEND_FROM_EMAIL: '' });
  assert.equal((await handler(req())).status, 200);
  assert.equal(calls.length, 2);
});

test('malformed, oversized, null and non-JSON requests rejected', async () => {
  const { handler, calls } = setup([]);
  assert.equal((await handler(req(null))).status, 400);
  assert.equal((await handler(req({ email: 'x'.repeat(3000) }))).status, 413);
  assert.equal((await handler(req({}, { headers: { 'content-type': 'text/plain' } }))).status, 415);
  const malformed = new Request('https://trifold.example/api/waitlist', { method: 'POST', headers: { origin: 'https://trifold.example', 'content-type': 'application/json' }, body: '{' });
  assert.equal((await handler(malformed)).status, 400);
  assert.equal(calls.length, 0);
});

test('only POST accepted and platform rate limit configured', async () => {
  const { handler } = setup([]);
  assert.equal((await handler(new Request('https://trifold.example/api/waitlist'))).status, 405);
  assert.deepEqual(config.rateLimit, { action: 'rate_limit', windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] });
});

const notifyEnv = { RESEND_API_KEY: 'test-secret', RESEND_SEGMENT_ID: 'waitlist-segment', RESEND_NOTIFY_EMAIL: 'owner@example.com' };
test('owner alert works without enabling subscriber welcome emails', async () => {
  const { handler, calls } = setup([response(404, {}), response(200, { id: 'contact-1' }), response(200, { id: 'owner-email' })], notifyEnv);
  assert.equal((await handler(req())).status, 200);
  assert.equal(calls.length, 3);
  const sent = JSON.parse(calls[2].body);
  assert.deepEqual(sent.to, ['owner@example.com']);
  assert.equal(sent.from, 'Trifold <onboarding@resend.dev>');
  assert.ok(!sent.text.includes('user@example.com'));
  assert.equal(calls[2].headers['Idempotency-Key'], 'trifold-owner/contact-1');
});
test('failed owner alert preserves saved signup', async () => {
  const { handler } = setup([response(404, {}), response(200, { id: 'contact-1' }), response(403, {})], notifyEnv);
  assert.equal((await handler(req())).status, 200);
});
test('repeated signup sends no owner alert', async () => {
  const { handler, calls } = setup([response(200, { id: 'contact-1', unsubscribed: false }), response(200, {})], notifyEnv);
  assert.equal((await handler(req())).status, 200);
  assert.equal(calls.length, 2);
});
test('failed persistence sends an operational alert, not a new-signup notification', async () => {
  const { handler, calls } = setup([response(404, {}), response(500, {}), response(200, {id:'alert'})], notifyEnv);
  assert.equal((await handler(req())).status, 502);
  assert.equal(calls.length, 3);
  assert.match(JSON.parse(calls[2].body).subject, /revisa/);
});

test('trusted platform IP gets a local backstop after five requests', async () => {
 const { handler, calls } = setup([]);
 for (let i = 0; i < 5; i++) assert.equal((await handler(req({email:'invalid'}), {ip:'192.0.2.1'})).status,400);
 assert.equal((await handler(req({email:'invalid'}), {ip:'192.0.2.1'})).status,429);
 assert.equal(calls.length,0);
});
test('legacy function endpoint cannot bypass the protected public route', async () => {
 const {handler}=setup([]);
 const request=new Request('https://trifold.example/.netlify/functions/waitlist');
 assert.equal((await handler(request)).status,404);
});
