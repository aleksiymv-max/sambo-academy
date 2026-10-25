'use strict';
// Independent combat-sambo exam items 57–64: normative audit, 26.10.2026.
// Sources: Rules of Sambo, order 892 amended by order 860 (14.09.2026),
// plus VFS clarification and amendment PDFs effective 01.09.2026.
// Preserve all question/choice texts, correct indices, module positions and examRevision=2.
require('./check-exam-infrastructure-2026.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
for(const name of [
 'judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(name,'utf8'),context,{filename:name});
const modules=context.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11);
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54);
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88);
assert.ok(modules.every(m=>m.examRevision===2));
assert.ok(modules.every(m=>m.lessons.every(l=>l.blocks.length>=6&&l.checks.length>=5)));
const combat=modules[7];
const qs=Array.from(combat.questions);
assert.equal(qs.length,8);
const expected=[
 {correct:0,answer:'Не применён специальный раздел правил боевого самбо',markers:['статье 28(1)','статьям 33 и 35','удары']},
 {correct:1,answer:'Проверить комплектность по специальной статье 10',markers:['статье 10(1–3)','6 унций','капу','бандаж']},
 {correct:2,answer:'Судейская бригада и арбитр в пределах полномочий, с учётом врача',markers:['статье 19(1, 11)','счёт до 10','большинства','14–16']},
 {correct:3,answer:'Нет, применяется специальный порядок боевого самбо',markers:['«Удушающие приёмы»','1 минута','14–16','Статья 19(6–9)']},
 {correct:0,answer:'Безопасность и предусмотренная медицинская процедура',markers:['статье 19(10)','снимает шлем','врача','Статья 33']},
 {correct:1,answer:'Остановить схватку и действовать по специальным медицинским правилам боевого самбо',markers:['статье 19(10–11)','01.09.2026','статье 38(1)(г)','3 минуты','двухминутным']},
 {correct:2,answer:'Применить специальную систему оценок боевого самбо',markers:['статьям 33 и 35','старше 18','4 балла','14–16']},
 {correct:3,answer:'Необходимо большинство судейской тройки по действующим Правилам',markers:['статье 35(2)(в)','01.09.2026','двух из трёх','статья 19(11)','различие формулировок']}
];
const selfChecks=new Set(combat.lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i],x=expected[i];
 assert.equal(q.a.length,4,'Four choices at '+(57+i));
 assert.equal(q.correct,x.correct,'Historical correct index changed at '+(57+i));
 assert.equal(q.a[q.correct],x.answer,'Historical answer changed at '+(57+i));
 assert.ok(q.body.length>=260,'Explanation too short at '+(57+i));
 for(const marker of x.markers)assert.ok(q.body.includes(marker),'Missing normative detail '+marker+' at '+(57+i));
 assert.ok(!selfChecks.has(q.q.trim().toLowerCase()),'Independent exam duplicates lesson self-check at '+(57+i));
}
assert.ok(qs[5].body.includes('общим двухминутным правилом'));
assert.ok(qs[7].body.includes('различие формулировок'));
console.log('PASS: combat sambo independent exam items 57–64 article-specific explanations and youth safety exceptions');
console.log('PASS: 2026 three-minute medical limit and majority-of-three knockdown clarification retained');
console.log('PASS: historical 88-question fingerprint, 54 expanded lessons and examRevision=2 preserved by chained checks');
console.log('AUDIT STATUS: 64/112 addressed; 24 expanded and 24 foundation questions remain');
console.log('NOT VERIFIED: real-user Supabase save/relogin/restore or independent referee-methodologist sign-off');
