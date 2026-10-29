# Trifold — Landing Page

Waitlist landing page for **Trifold**, the budgeting app for couples. Built with **Angular 21 + TypeScript**, standalone components, plain CSS with the app's design tokens (violet `#7b5cf5`, lavender tints, 50–30–20 purple/orange/green accents, Inter).

## Structure

- `src/app/app.component.*` — page shell: nav, hero, stats, features, how-it-works, FAQ, final CTA, footer
- `src/app/components/phone-preview/` — the interactive Personal ↔ Household ↔ Budgets iPhone mock (pure CSS + signals, sample data only)
- `src/app/components/waitlist-form/` — email capture form (Resend through a Netlify Function), used in hero and CTA
- `src/styles.css` — design tokens and shared `.btn` / `.eyebrow` classes

## Run locally

```bash
npm install
npm start          # dev server at http://localhost:4200
```

## Build

```bash
npm run build      # production build + static initial HTML -> dist/trifold-landing/browser
```

## Deploy to Netlify

### Option A — drag & drop (fastest)

1. `npm run build`
2. Drag the `dist/trifold-landing/browser` folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
3. (Drag the `browser` folder itself, not its parent — learned the hard way 🙂)

### Option B — Git

`netlify.toml` is preconfigured: build `npm run build`, publish `dist/trifold-landing/browser`.

## Resend and PostHog

See [INTEGRATIONS.md](INTEGRATIONS.md) for account setup, environment variables, local development, testing, and deployment verification. The waitlist now requires Netlify Functions; static drag-and-drop hosting alone does not deploy these functions.

## Notes

- The sandbox preview needs a single-file build: run `node scripts/inline-bundle.mjs` after `npm run build` to inline JS/CSS into `dist/trifold-landing/browser/index.html` (rebuilds restore the normal multi-file output).
- `scripts/favicon-tile.html` is the source for the rendered `public/favicon.ico` (16/32/48).

## Quality checks

See [REMEDIATION.md](REMEDIATION.md). Use Node 24, `npm run test:integrations`, `npm run build`, and `npm run test:browser`. Browser tests use a local mock server and never send real email. GitHub runs the three browser engines and a scheduled production smoke check.
