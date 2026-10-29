import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const report=JSON.parse(await readFile('lighthouse.json','utf8'));
const score=report.categories.performance.score;
console.log(JSON.stringify({performance:score,LCP:report.audits['largest-contentful-paint'].displayValue,CLS:report.audits['cumulative-layout-shift'].displayValue,TBT:report.audits['total-blocking-time'].displayValue}));
assert.ok(score>=0.90,'Mobile Lighthouse performance must score at least 90');
