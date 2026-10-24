'use strict';
/* Regression guard for the addressed editorial expansion of articles 29–34.
 * Checks authored content and question integrity; it does not replace legal review.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const path of ['judge-course-engine.js','judge-program-bout.js'])
 vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.title,'Проведение схватки: положения, время и результат');
assert.equal(mod.lessons.length,7,'Do not change lesson IDs or order');
const targets=[
 {index:3,title:'Выход на ковёр, начало и окончание схватки',ref:'29',blocks:8,terms:['свисток','табло','ручной секундомер','после окончания','запястья']},
 {index:4,title:'Чистое время, перерывы и отдых',ref:'30',blocks:9,terms:['утешительн','полуфинал','сопровождении бокового судьи','двух минут','трёх минут']},
 {index:5,title:'Результат схватки и связь с оцениванием',ref:'32',blocks:8,terms:['поражение обоих','восемь баллов','технические действия','статьи 34','протокол']}
];
for(const t of targets){
 const lesson=mod.lessons[t.index];
 assert.equal(lesson.title,t.title);
 assert.ok(lesson.ref.includes(t.ref),'Wrong normative anchor: '+t.title);
 assert.ok(lesson.blocks.length>=t.blocks,'Insufficient explanatory depth: '+t.title);
 assert.equal(lesson.checks.length,5,'Expected five self-checks: '+t.title);
 for(const field of ['goal','lead','situation','caseAnalysis','decision','trap'])
  assert.ok(String(lesson[field]||'').length>=20,'Missing teaching component: '+field);
 const prose=lesson.blocks.map(b=>b.join(' ')).join(' ').toLowerCase();
 for(const term of t.terms)assert.ok(prose.includes(term.toLowerCase()),'Missing verified concept '+term+' in '+t.title);
 const questions=new Set();
 for(const q of lesson.checks){
  assert.ok(Array.isArray(q[1])&&q[1].length===4&&q[2]>=0&&q[2]<4&&String(q[3]).length>=8,'Malformed question: '+q[0]);
  if(lesson.checks.indexOf(q)>=2)assert.ok(String(q[3]).length>=25,'New question needs explanation: '+q[0]);
  assert.ok(!questions.has(q[0]),'Duplicate question: '+q[0]);questions.add(q[0]);
 }
}
assert.equal(mod.lessons[0].title,'Положения спортсменов: стоя, лёжа и варианты приземления');
assert.equal(mod.lessons[6].title,'Определение активности в середине встречи');
console.log('PASS: 3 revised bout lessons, article anchors, 25 teaching blocks, 15 checks, stable 7-lesson order');
