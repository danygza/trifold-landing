import assert from 'node:assert/strict';
const site = new URL(process.env.SITE_URL || process.argv[2] || 'https://trifold-budget.netlify.app').origin;
const get = async path => {
 const res=await fetch(site+path,{signal:AbortSignal.timeout(15000)});
 assert.equal(res.status,200,`${path} must load`);return res;
};
const home=await get('/');const html=await home.text();
for(const item of ['Shared finances','static-features','static-faq','og:image','rel="canonical"','/privacy.html','/unsubscribe.html']) assert.ok(html.includes(item),`Missing ${item}`);
for(const name of ['x-content-type-options','content-security-policy','referrer-policy']) assert.ok(home.headers.get(name),`Missing ${name}`);
for(const path of ['/privacy.html','/contact.html','/unsubscribe.html','/social-preview.png','/brand/trifold-wordmark-web.png']) await get(path);
const cfg=await (await get('/.netlify/functions/analytics-config')).json();assert.ok(cfg.key && ['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(cfg.host),'Analytics config missing');
const invalid=await fetch(site+'/api/waitlist',{method:'POST',headers:{Origin:site,'Content-Type':'application/json'},body:JSON.stringify({email:'invalid'}),signal:AbortSignal.timeout(15000)});
assert.ok([400,429].includes(invalid.status),'Waitlist must reject invalid input before contacting Resend');
if(invalid.status===400)assert.equal((await invalid.json()).success,false);
console.log('PASS: deployed content, privacy/removal pages, assets, metadata, headers, public config, and safe invalid-input check. No subscriber created.');
