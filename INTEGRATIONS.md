# Trifold: Resend + PostHog

## Resend setup

1. Create/sign into your Resend account. Under Contacts, create a **Trifold waitlist** segment and copy its ID.
2. Create a dedicated API key with permission to read/create contacts, add segment memberships, and (if enabled) send emails. A sending-only key cannot manage contacts. Store the key in Netlify, never in Angular or chat.
3. For welcome receipts, add a domain in Resend, publish the exact DNS records Resend supplies at your DNS host, and wait for verification. Choose a sender such as `Trifold <hello@YOUR-VERIFIED-DOMAIN>` and a monitored reply-to address. Without a verified sender, leave `RESEND_FROM_EMAIL` empty: signups will still be saved to Contacts.
4. Add the following to the Netlify site's environment variables, with **Functions** scope:
   - `RESEND_API_KEY`: private key
   - `RESEND_SEGMENT_ID`: Trifold waitlist segment ID
   - `RESEND_FROM_EMAIL`: optional verified sender
   - `RESEND_REPLY_TO`: optional monitored email
5. Redeploy after configuring variables.

Flow: the browser submits to `/.netlify/functions/waitlist`; the function validates the request, checks for an existing contact, and saves new contacts in the waitlist segment. Only a persisted contact produces success. New contacts optionally receive a transactional signup receipt. Existing subscribed contacts are added to the segment; existing unsubscribed contacts retain their preference and receive no receipt. Repeated submissions never intentionally resubscribe someone. If an unsubscribed person wants to rejoin, handle that explicitly in a future subscription-preferences flow.

Receipt delivery is best effort after persistence: a receipt failure logs a generic warning without undoing the signup. Existing contacts do not trigger another receipt, including after an earlier delivery failure. Failed contact requests return a retryable error. Concurrent submissions may require a retry if the provider rejects a duplicate create. The browser preserves the address on failure. No existing Web3Forms subscribers are migrated automatically.

For launch updates, use Resend **Broadcasts** targeted at the Trifold segment, with unsubscribe functionality. The `/emails` call here is only the requested signup receipt, not a marketing campaign. Before launch, review signup wording/privacy disclosures and suppression preferences. Do not send updates through a raw loop of transactional emails.

## PostHog setup

1. Create a PostHog project for the landing page. Select US or EU hosting.
2. Copy the **public project token** from project settings. Do not use a personal API key.
3. Add these Netlify environment variables with **Functions** scope, preferably only for the production deploy context:
   - `POSTHOG_PUBLIC_KEY`
   - `POSTHOG_HOST`: `https://us.i.posthog.com` or `https://eu.i.posthog.com`
4. Redeploy. The public analytics-config function exposes only that token and host. Missing configuration disables analytics without blocking the website.

Tracked events:
- `$pageview`: one per page load
- `waitlist_submit`: valid submission attempted
- `waitlist_success`: server confirmed persistence (or honeypot accepted silently)
- `waitlist_error`: invalid email, rate limit, or request failure

Signup events include `placement` (`default` = hero, `centered` = final CTA). Error reasons are fixed strings. No email addresses or form contents are sent to PostHog. URL query strings, fragments and referrers are removed; event properties use an allowlist. Autocapture, replay, surveys, exception capture and persistent storage are disabled. Do Not Track and Global Privacy Control disable initialization. PostHog still receives network metadata such as IP addresses; these settings are not a legal compliance determination. Decide on the appropriate analytics disclosure/consent for your launch markets before enabling the production token.

In PostHog, make a funnel `$pageview` → `waitlist_submit` → `waitlist_success`, and break it down by placement. Memory-only identity means returning users are counted as new visits; this setup focuses on same-page conversion and deliberately does not measure returning visitors across visits. Ad blockers can also reduce counts. Contact persistence in Resend is the source of truth for signups.

## Local development

Use Node 22 LTS. Copy `.env.example` to `.env` and supply values privately. `.env` is ignored by Git.

`npm start` serves Angular only; it does not run the two functions. Use Netlify Dev (`npx netlify-cli dev`, choose the Angular dev server if prompted) to serve frontend and functions on the same origin. Use a separate test Resend segment and PostHog project for local testing. Netlify's edge rate limit is only enforced after deployment.

- `npm run test:integrations`: mocked offline handler tests; sends no email.
- `npm run build`: Angular production build.

Deploy by linking the Git repository to Netlify (or using a Netlify CLI deploy that includes functions). **The README's static drag-and-drop option is insufficient for this integration.** No deployment was performed as part of implementation.

## Finish verification after deployment

- Confirm the two functions exist in Netlify and the deploy log reports the rate-limit rule.
- Submit an address you control. Verify it appears in the Trifold segment and the UI shows success.
- If a sender is configured, inspect the receipt in Resend's email logs and your inbox. API acceptance does not prove delivery.
- Repeat the signup and verify there is no additional receipt; test unsubscribe preservation in a disposable test segment.
- See `$pageview` and signup events in PostHog Live events. Inspect properties to ensure there are no emails, query strings or referrers.
- Verify missing/invalid API configuration produces a recoverable form error, and analytics blocking does not break signup.

## Official references

- https://resend.com/docs/api-reference/contacts/create-contact
- https://resend.com/docs/api-reference/contacts/add-contact-to-segment
- https://resend.com/docs/api-reference/emails/send-email
- https://posthog.com/docs/libraries/js/config
- https://docs.netlify.com/build/functions/api/
- https://www.netlify.com/blog/how-to-rate-limit-ai-features-and-avoid-surprise-costs/

## Owner signup notifications (no domain yet)

Set `RESEND_NOTIFY_EMAIL` in Netlify to the email used to create the Resend account, with Functions scope (or All scopes) and Production context. Keep `RESEND_FROM_EMAIL` unset to keep subscriber welcome emails disabled. Redeploy after changing the variable. New contacts then trigger an internal alert using `onboarding@resend.dev`; Resend restricts that sender to the account owner's email. A verified sender is required before sending to other addresses.

The notification contains no subscriber address; check the Trifold segment in Resend for details. Existing contacts do not trigger alerts. Alerts are best effort after the contact is saved: failures are logged without undoing the signup, and there is no automatic retry queue. Check Resend email logs and the inbox to confirm delivery. This temporary test-domain arrangement is not a substitute for a verified production sender.
