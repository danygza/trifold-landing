import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
const output = 'dist/trifold-landing/browser';
const component = await readFile('src/app/app.component.ts', 'utf8');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function content(name) {
  const found = component.match(new RegExp(`readonly ${name} = (\\[[\\s\\S]*?\\])(?: as const)?;`));
  if (!found) throw new Error(`Missing static content: ${name}`);
  return vm.runInNewContext(`(${found[1]})`, {}, { timeout: 100 });
}
const [features, steps, faqs] = ['features','steps','faqs'].map(content);
const page = `<div class="static-page"><a href="#static-main">Skip to content</a>
<header><a href="/"><img src="/brand/trifold-wordmark-web.png" alt="Trifold" width="150" height="60"></a>
<nav aria-label="Primary"><a href="#static-features">Features</a><a href="#static-how">How it works</a><a href="#static-faq">FAQ</a><a href="#static-waitlist">Join waitlist</a></nav></header>
<main id="static-main"><section><p>In development — waitlist open</p><h1>Shared finances, simplified.</h1><p>Trifold is being built to give you and your partner one calm place for money: a 50–30–20 split, personal balances, and a household view.</p><p><a href="#static-waitlist">Get early-access updates</a></p></section>
<section id="static-features"><h2>Make a plan that works for both of you.</h2>${features.map(f=>`<article><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></article>`).join('')}</section>
<section id="static-how"><h2>How it works</h2>${steps.map(s=>`<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`).join('')}</section>
<section id="static-faq"><h2>Questions, answered.</h2>${faqs.map(f=>`<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>
<section id="static-waitlist"><h2>Join the Trifold waitlist</h2><p>The interactive form is loading. If JavaScript is unavailable or the form does not load, <a href="mailto:dany.gza@gmail.com?subject=Join%20the%20Trifold%20waitlist">email us to request early-access updates</a>. We handle email requests manually.</p><p>Availability and pricing will be shared before launch.</p></section></main>
<footer><nav aria-label="Information"><a href="/privacy.html">Privacy</a><a href="/contact.html">Contact</a><a href="/unsubscribe.html">Leave the waitlist</a></nav></footer></div>`;
const path = `${output}/index.html`;
const html = await readFile(path,'utf8');
if (!html.includes('<app-root></app-root>')) throw new Error('Unexpected app root; static content was not generated.');
await writeFile(path,html.replace('<app-root></app-root>',`<app-root>${page}</app-root>`));
console.log('Static initial page generated from current product copy.');
