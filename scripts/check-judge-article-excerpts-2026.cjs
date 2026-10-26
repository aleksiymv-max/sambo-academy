'use strict';
// Static regression: duplicate Object.assign registrations silently shadow earlier
// article excerpts. This check protects the active full text and its source caveat.
// It does NOT certify normative accuracy or authorize an official qualification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html','utf8');
const start = html.indexOf('const samboArticleExcerpts=');
const end = html.indexOf('function samboCitedArticlePanel(',start);
assert.ok(start>=0 && end>start,'Article excerpt registry is missing');
const registry = html.slice(start,end);
const entries = [...registry.matchAll(/^\s*(\d+):\{title:/gm)].map(m=>Number(m[1]));
const expected = [1,2,29,30,31,33,35,36,37,38,41,42];
assert.deepEqual([...entries].sort((a,b)=>a-b),expected,
  'Article excerpts must be registered exactly once, without hidden overrides');
for(const article of [29,30,31,33,41]){
 const full = new RegExp('^\\s*'+article+':\\{title:[^\\n]+partial:false,text:`Статья '+article+'\\.','m');
 assert.match(registry,full,'Full excerpt lost for article '+article);
}
for(const phrase of [
 '3. Рассмотрение протеста:',
 '4. Решение по протесту:',
 'непосредственно во время соревнований',
 'в день фиксации нарушения',
 'Приоритет этих формулировок курсом не устанавливается'
]){
 assert.ok(registry.includes(phrase),'Active article 41 excerpt lost: '+phrase);
}
assert.ok(html.includes('data-protest-cross-source="2026"'),
 'Legacy protest lesson must retain its separate source warning');
console.log('PASS: '+entries.length+' unique article excerpts; active full texts 29, 30, 31, 33 and 41 preserved');
console.log('PASS: article 41 full procedure and unresolved 2026 protest-deadline caveat preserved');
