'use strict';
// The lesson can be opened directly from a course card, bypassing its introduction.
// Unresolved normative caveats must therefore remain visible at the lesson itself.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js'];
const ctx={window:{}};vm.createContext(ctx);
for(const name of files)vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
const modules=ctx.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11);
let checked=0;
for(let i=0;i<modules.length;i++){
 const index=i+1,mod=modules[i],sections=ctx.window.samboJudgeCourseEngine.sections(mod,index);
 assert.equal(sections.length,mod.lessons.length+2);
 const affected=[5,6,9,10].includes(index);
 for(const page of sections.slice(1,-1)){
  const html=page.html;
  const marker='data-editorial-warning="'+index+'"';
  assert.equal(html.includes(marker),affected,'Lesson warning missing or misplaced: '+mod.title+' / '+page.title);
  if(affected){
   assert.ok(html.indexOf(marker)<html.indexOf('class="jp-goal"'),'Warning must precede the lesson body: '+page.title);
   assert.ok(html.includes('Открыть полный текст Правил'),'Missing source in '+page.title);
   if(index===6||index===9){
    assert.ok(html.includes('data-amendment-sources="2026"'),'Missing amendment evidence in '+page.title);
    assert.ok(html.includes('razyasneniya_pravil_vida_sporta_sambo_sentyabr_2026_god.pdf'));
   }
  }
  checked++;
 }
}
assert.equal(checked,54);
console.log('PASS: all 54 judge lessons checked; unresolved Rules caveats visible at point of learning');
console.log('PASS: official primary sources and 2026 amendment links follow relevant lessons');
console.log('OPEN: these caveats require authoritative interpretation; this test does not approve disputed norms');
