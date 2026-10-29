import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter, reportIssue } from '../netlify/lib/operations.mjs';
import { createHealthcheck } from '../netlify/functions/healthcheck.mjs';

test('limiter expires counts and separates platform IPs',()=>{
 let now=1000;const allow=createLimiter(2,60000,()=>now);
 assert.equal(allow('a'),true);assert.equal(allow('a'),true);assert.equal(allow('a'),false);assert.equal(allow('b'),true);
 now+=60001;assert.equal(allow('a'),true);
});
test('operational telemetry only accepts fixed categories and has no subscriber data',async()=>{
 const calls=[];const options={env:{POSTHOG_PUBLIC_KEY:'public-test'},request:async(url,opts)=>{calls.push({url,...opts});return Response.json({});}};
 await reportIssue('email@example.com',options);assert.equal(calls.length,0);
 await reportIssue('provider_error',options);assert.equal(calls.length,1);
 const body=JSON.parse(calls[0].body);assert.equal(body.properties.kind,'provider_error');assert.equal(body.properties.distinct_id,'trifold-operations');assert.equal(body.properties.$process_person_profile,false);assert.ok(!calls[0].body.includes('email@example.com'));
});
test('scheduled check verifies segment and notices a failed Trifold delivery',async()=>{
 const calls=[];const env={RESEND_API_KEY:'test',RESEND_SEGMENT_ID:'segment',POSTHOG_PUBLIC_KEY:'public'};
 const request=async(url,opts)=>{
  calls.push({url,...opts});
  if(url.includes('/segments/')) return Response.json({id:'segment'});
  if(url.endsWith('/emails?limit=100')) return Response.json({data:[{subject:'Nuevo registro en la lista de espera de Trifold',created_at:new Date().toISOString(),last_event:'bounced'}]});
  return Response.json({});
 };
 const result=await createHealthcheck({env,request})();assert.deepEqual(await result.json(),{healthy:false});assert.equal(calls.filter(c=>c.url.endsWith('/capture/')).length,1);
 assert.ok(!calls.some(c=>c.body?.includes('bounced')));
});
test('scheduled check treats stale or unrelated delivery failures as unrelated',async()=>{
 const env={RESEND_API_KEY:'test',RESEND_SEGMENT_ID:'segment'};
 const request=async(url)=>url.includes('/segments/')?Response.json({id:'segment'}):Response.json({data:[{subject:'Another app',created_at:new Date().toISOString(),last_event:'bounced'},{subject:'Trifold',created_at:'2020-01-01',last_event:'failed'}]});
 assert.deepEqual(await (await createHealthcheck({env,request})()).json(),{healthy:true});
});
