/* Verify navigable provenance for every expanded judge lesson; not normative approval. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const official='https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf';
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js'];
const context={window:{}};
vm.createContext(context);
for(const name of files)vm.runInContext(fs.readFileSync(name,'utf8'),context,{filename:name});
const engine=context.window.samboJudgeCourseEngine;
assert.equal(engine.modules.length,11,'Expected 11 expanded modules');
const link='href="'+official+'"';
let lessons=0;
for(let i=0;i<engine.modules.length;i++){
 const m=engine.modules[i],pages=engine.sections(m,i+1);
 assert.equal(pages.length,m.lessons.length+2,m.title+' sections');
 for(const [j,page] of pages.entries()){
  assert.ok(page.html.includes(link),m.title+' section '+j+' missing source link');
  assert.ok(page.html.includes('target="_blank" rel="noopener noreferrer"'),m.title+' section '+j+' unsafe external link');
  assert.ok(page.html.includes('14.09.2026 № 860'),m.title+' section '+j+' missing amendment provenance');
 }
 for(const l of m.lessons)assert.ok(l.ref.trim(),m.title+' lesson without article reference');
 lessons+=m.lessons.length;
}
assert.equal(lessons,54,'Expected 54 expanded lessons');
console.log('PASS: official amended rules PDF linked from all 54 lessons, 11 module plans and 11 exam introductions');
console.log('NOTE: link provenance is not a point-by-point normative expert review.');
