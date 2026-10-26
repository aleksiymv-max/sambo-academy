'use strict';
// Regression: the legacy HTML referee guide must not silently contradict
// the 2026 amendment notice already shown in the expanded judge course.
// This checks editorial consistency, not the legal priority of the sources.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const guide=html.match(/const samboProtestMasterclass=`([\s\S]*?)`;/)?.[1];
assert.ok(guide,'Legacy protest masterclass must exist');
assert.match(guide,/data-protest-cross-source="2026"/);
assert.match(guide,/непосредственно во время соревнований/);
assert.match(guide,/в день фиксации нарушения/);
assert.match(guide,/статья 41\(2\)\(б\)/);
assert.match(guide,/https:\/\/sambo\.ru\/wp-content\/uploads\/2025\/09\/pravila-vida-sporta-sambo-s-izm\.-i-dopolneniyami\.pdf/);
assert.match(guide,/https:\/\/sambo\.ru\/wp-content\/uploads\/2026\/08\/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya\.pdf/);
assert.match(guide,/https:\/\/old\.sambo\.ru\/press\/news\/2026\/12181\//);
assert.doesNotMatch(guide,/<tr><td>Когда<\/td><td>Непосредственно во время соревнований<\/td>/,
  'Legacy timing table must not state only one contested deadline');
for(const flag of ['не устанавливает приоритет','не гарантирует возможность отложить','неординарной ситуации']){
  assert.ok(guide.includes(flag),'Missing caution: '+flag);
}
const excerpt=html.match(/41:\{title:'Протесты',partial:true,text:`([\s\S]*?)`,note:'([^']*)'\}/);
assert.ok(excerpt,'Article 41 quoted excerpt must remain available');
assert.ok(excerpt[1].includes('непосредственно во время соревнований'),
  'Keep the consolidated PDF wording in its labeled quotation');
assert.ok(excerpt[2].includes('в день фиксации нарушения'),
  'The article excerpt needs a cross-source warning');
assert.ok(excerpt[2].includes('неординарной ситуации'),
  'Keep the exceptional situation separate');
const active=html.match(/41:\{title:'Протесты',partial:false,text:`([\s\S]*?)`,note:'([^']*)'\}/);
assert.ok(active,'Full article 41 excerpt must exist and supersedes the partial entry');
assert.ok(active[1].includes('непосредственно во время соревнований'),
  'Preserve the full consolidated source text');
assert.ok(active[2].includes('в день фиксации нарушения'),
  'The active full excerpt needs the 2026 cross-source warning');
console.log('PASS: legacy protest masterclass and article 41 excerpt disclose the unresolved 2026 deadline conflict');
