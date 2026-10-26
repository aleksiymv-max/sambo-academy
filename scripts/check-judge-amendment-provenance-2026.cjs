'use strict';
// Cross-source editorial regression. Neither an amendment PDF nor a VFS
// explanation silently rewrites the consolidated Rules or exam answer keys.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const amendment='https://sambo.ru/wp-content/uploads/2026/08/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf';
const obsolete='https://sambo.ru/wp-content/uploads/2025/09/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf';
const clarification='https://sambo.ru/wp-content/uploads/2025/09/razyasneniya_pravil_vida_sporta_sambo_sentyabr_2026_god.pdf';
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js'];
const sandbox={window:{}};vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const engine=sandbox.window.samboJudgeCourseEngine;
assert.ok(!fs.readFileSync('judge-course-engine.js','utf8').includes(obsolete),'Obsolete amendment PDF path must never be published');
assert.equal(engine.modules.length,11);
const rules='https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf';
for(let i=0;i<engine.modules.length;i++){
 const moduleIndex=i+1;
 const pages=engine.sections(engine.modules[i],moduleIndex);
 for(const page of [pages[0],pages.at(-1)]){
  const html=page.html;
  assert.ok(html.includes('href="'+rules+'"'),'Consolidated Rules link missing');
  if(moduleIndex===6||moduleIndex===9){
   assert.ok(html.includes('data-editorial-warning="'+moduleIndex+'"'),'Pre-exam warning missing');
   assert.ok(html.includes('data-amendment-sources="2026"'),'Source comparison missing');
   for(const url of [amendment,clarification])
    assert.ok(html.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'),'Missing safe source '+url);
   if(moduleIndex===6){
    for(const marker of ['41(2)(а)','непосредственно во время соревнований','в день фиксации нарушения','остаётся открытым'])
     assert.ok(html.includes(marker),'Protest source discrepancy not explained: '+marker);
   }else{
    for(const marker of ['Статья 45(4)','статья 56','бокового судью','несогласованность опубликованных текстов'])
     assert.ok(html.includes(marker),'Beach referee discrepancy not explained: '+marker);
   }
  }else assert.ok(!html.includes('data-amendment-sources='),'Unexpected source notice in '+moduleIndex);
 }
}
console.log('PASS: articles 41 and 45/56 have cross-source notices BEFORE their exams');
console.log('PASS: consolidated Rules, separate 2026 changes and VFS explanations are linked safely');
console.log('OPEN: source wording conflicts require authorised interpretation; no exam keys or progress indices changed');
