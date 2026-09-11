# Trifold — Landing Page

Waitlist landing page for **Trifold**, the budgeting app for couples. Built with **Angular 19 + TypeScript**, standalone components, plain CSS with the app's design tokens (violet `#7b5cf5`, lavender tints, 50–30–20 purple/orange/green accents, Inter).

## Structure

- `src/app/app.component.*` — page shell: nav, hero, stats, features, how-it-works, FAQ, final CTA, footer
- `src/app/components/phone-preview/` — the interactive Personal ↔ Household iPhone mock (pure CSS + signals)
- `src/app/components/waitlist-form/` — email capture form (Web3Forms), used in hero and CTA
- `src/styles.css` — design tokens and shared `.btn` / `.eyebrow` classes

## Run locally

```bash
npm install
npm start          # dev server at http://localhost:4200
```

## Build

```bash
npm run build      # production build -> dist/trifold-landing/browser
```

## Deploy to Netlify

### Option A — drag & drop (fastest)

1. `npm run build`
2. Drag the `dist/trifold-landing/browser` folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
3. (Drag the `browser` folder itself, not its parent — learned the hard way 🙂)

### Option B — Git

`netlify.toml` is preconfigured: build `npm run build`, publish `dist/trifold-landing/browser`.

## Before going live

- [x] **Waitlist form** — the shared Web3Forms form has the supplied access key configured for both waitlist placements. Delivery uses the email linked to that key.

## Notes

- The sandbox preview needs a single-file build: run `node scripts/inline-bundle.mjs` after `npm run build` to inline JS/CSS into `dist/trifold-landing/browser/index.html` (rebuilds restore the normal multi-file output).
- `scripts/favicon-tile.html` is the source for the rendered `public/favicon.ico` (16/32/48).
