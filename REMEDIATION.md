# Landing quality changes

Implemented October 29, 2026.

## Website and accessibility

- Responsive phone preview, form fields and buttons fit 320px viewports. Mobile section navigation remains visible.
- Darker text/status colors and primary buttons improve contrast; keyboard focus, skip navigation and at-least-44px main controls are provided.
- Loading announcements are outside the busy form so assistive technology can announce them while the request is pending.
- Production builds include meaningful initial HTML generated from current feature/FAQ copy. Visitors without JavaScript can read the page and email a manual signup request.
- Privacy, contact and manual waitlist-removal instructions are linked beside both forms and in the footer. Removal is a manual request, not automatic unsubscribe. The operator must process these requests in Resend and include unsubscribe functionality in future Broadcasts.
- Launch timing, founder pricing and unsupported export/deletion/security promises have been replaced with factual waitlist information.
- Canonical/social metadata, a social image, robots and sitemap are included.

## Services and observability

- The public signup route is now `/api/waitlist`; the legacy function URL refuses direct requests. Netlify applies a per-IP/domain edge rate rule, with a per-instance server backstop. Edge rate decisions can have propagation delays; a local backstop alone is not distributed protection.
- Existing `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `RESEND_NOTIFY_EMAIL`, `POSTHOG_PUBLIC_KEY` and `POSTHOG_HOST` variables remain in use. No new secret is required. `RESEND_FROM_EMAIL` remains unset unless the operator intentionally enables subscriber receipts with a verified sender.
- Browser errors are sent as fixed categories only; raw messages, addresses and form contents are excluded.
- Provider failures emit a `waitlist_operational_error` event under a fixed operational identity, and attempt a daily deduplicated owner alert. Successful contact persistence is never undone by an alert failure.
- An hourly Netlify function checks the configured Resend segment and the latest 100 email delivery outcomes. It alerts on recent Trifold delivery failures. This sampling is appropriate for the current small waitlist; it is not an exhaustive delivery ledger or a retry queue. Resend email acceptance is still not proof of inbox delivery.
- If Resend itself is unavailable, the Resend alert may also fail. PostHog operational events and Netlify logs provide an additional diagnostic path; GitHub smoke checks independently detect public-site failures. They do not guarantee email delivery.
- Optional visitor analytics only initializes after explicit consent; browser privacy signals are respected. Recording/autocapture stays off, properties use an allowlist, and identity is memory-only. Your analytics preference is the only browser-stored value.

## Builds and verification

- Angular 21 and the current application builder replace unsupported Angular 19 and the legacy build dependency tree. Node 24 is selected for Netlify and CI.
- The slim PostHog SDK loads only after consent. External Google Fonts requests have been removed.
- Netlify runs backend tests before building. GitHub quality checks cover npm audit, builds, three browser engines, accessibility, mobile sizing, 200% CSS zoom reflow, no-JavaScript content, and offline signup failure handling.
- Production smoke checks run after eligible successful deployment events and every six hours; they never create contacts or send subscriber emails.
- Enforced security headers include CSP, framing protection, MIME-type protection, referrer and permissions policies. CSP allows inline styles because Angular binds style attributes and injects component styles; scripts are restricted to same-origin.

## Remaining human/account checks

- A physical phone and its on-screen keyboard, actual VoiceOver/NVDA announcements, and Safari/Firefox desktop UI zoom still need human/device verification. Browser-engine automation and CSS zoom tests do not replace these checks.
- GitHub workflow failure email depends on the account's GitHub notification settings. Netlify scheduled-function support and execution should be confirmed in the deployed Functions page.
- Check the inbox for an operational test alert and inspect Resend delivery logs. Do not mark all 50 items verified solely because code was added.
- Review the published privacy notice and process removal requests as the operator. This implementation does not certify legal compliance.

## Sources

- https://angular.dev/reference/versions
- https://docs.netlify.com/build/functions/api/
- https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- https://docs.netlify.com/build/functions/scheduled-functions/
- https://resend.com/docs/api-reference/emails/list-emails
