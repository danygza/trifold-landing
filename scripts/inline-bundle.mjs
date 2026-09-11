/**
 * Inlines the built JS/CSS bundles into a single self-contained HTML file.
 * Used for the sandbox preview; the normal dist/ output is what gets deployed.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserDir = join(root, 'dist', 'trifold-landing', 'browser');

const html = await readFile(join(browserDir, 'index.html'), 'utf8');

const inlineAssets = async (html) => {
  let out = html;
  let scripts = 0;
  let styles = 0;

  // Inline <script ... src="..."> module tags (attribute order agnostic)
  const scriptRe = /<script[^>]*\ssrc="\.?\/?([^"]+)"[^>]*>\s*<\/script>/g;
  for (const match of [...html.matchAll(scriptRe)]) {
    const js = await readFile(join(browserDir, match[1]), 'utf8');
    out = out.replace(match[0], `<script type="module">${js}</script>`);
    scripts++;
  }

  // Inline <link rel="stylesheet" href="..."> tags
  const cssRe = /<link rel="stylesheet" href="\.?\/?([^"]+)"[^>]*>/g;
  for (const match of [...html.matchAll(cssRe)]) {
    const css = await readFile(join(browserDir, match[1]), 'utf8');
    out = out.replace(match[0], `<style>${css}</style>`);
    styles++;
  }

  return { out, scripts, styles };
};

const { out: inlined, scripts, styles } = await inlineAssets(html);
await writeFile(join(browserDir, 'index.html'), inlined);

const remaining = (inlined.match(/src="[^"]*\.js"|href="[^"]*\.css"/g) ?? []).length;
console.log(`Inlined ${scripts} script(s) and ${styles} stylesheet(s); ${remaining} external refs left`);
