// Offline browser-test server. It never uses credentials or sends real email.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createHandler } from '../netlify/functions/waitlist.mjs';
const root = resolve('dist/trifold-landing/browser');
const handler = createHandler({
 env: { RESEND_API_KEY: 'offline-test', RESEND_SEGMENT_ID: 'offline-test' },
 request: async (url) => {
  if (url.includes('fail%40example.test')) return Response.json({}, { status: 503 });
  if (url.includes('slow%40example.test')) await new Promise(r => setTimeout(r, 750));
  return url.includes('/contacts/') ? Response.json({}, { status: 404 }) : Response.json({ id: 'offline-contact' });
 },
});
http.createServer(async (req,res) => {
 try {
  const pathname = new URL(req.url,'http://127.0.0.1').pathname;
  if (pathname === '/.netlify/functions/analytics-config') { res.setHeader('content-type','application/json'); res.end('{"key":"","host":"https://us.i.posthog.com"}'); return; }
  if (pathname === '/api/client-error') { res.writeHead(202); res.end(); return; }
  if (pathname === '/api/waitlist') {
   let body='';for await (const chunk of req) body+=chunk;
   if (body.includes('rate@example.test')) { res.writeHead(429);res.end();return; }
   const reply=await handler(new Request('http://127.0.0.1:8770/api/waitlist',{method:req.method,headers:req.headers,body}));
   res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(await reply.text());return;
  }
  const path=resolve(root,pathname==='/'?'index.html':'.'+pathname);
  if (!path.startsWith(root+'/')) {res.writeHead(403);res.end();return;}
  const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain'};
  res.setHeader('content-type',types[extname(path)]||'application/octet-stream');res.end(await readFile(path));
 } catch {res.writeHead(404);res.end();}
}).listen(8770,'127.0.0.1',()=>console.log('Offline preview on port 8770'));
