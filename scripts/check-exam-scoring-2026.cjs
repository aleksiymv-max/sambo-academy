'use strict';
// Source audit of independent scoring exam questions 33–40.
// Consolidated Rules of sambo, as amended 14.09.2026 (order 860).
// The exact-ten-second hold contradiction is NOT resolved by this test.
require('./check-exam-bout-2026.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of [
 'judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mods=ctx.window.samboJudgeCourseEngine.modules;
assert.equal(mods.length,11);
assert.equal(mods.reduce((n,m)=>n+m.lessons.length,0),54);
assert.equal(mods.reduce((n,m)=>n+m.questions.length,0),88);
assert.ok(mods.every(m=>m.examRevision===2),'Preserve historical exam revision');
assert.ok(mods.every(m=>m.lessons.every(l=>l.blocks.length>=6&&l.checks.length>=5)),
 'Preserve quantitative editorial threshold');
const qs=Array.from(mods[4].questions);
assert.equal(qs.length,8);
const expected=[
 ['4 балла',/Статья 35\(2\)\(а\).*без падения.*на бок.*4 балла.*статье 33\(1\)\(а\)/s],
 ['4 балла',/Статья 35\(2\)\(б\).*с падением.*на спину.*4 балла.*не чистый бросок/s],
 ['2 балла',/Статья 35\(3\)\(д\).*более 10 секунд.*12 секунд.*Статья 28.*Для ровно 10 секунд тексты расходятся/s],
 ['1',/Статья 35\(4\)\(а\).*на грудь.*1 балл.*35\(3\)\(а\).*2 балла/s],
 ['Если туловище атакуемого полностью осталось в зоне безопасности',/Статья 36\(6\).*туловище атакуемого полностью.*зоны безопасности.*статьям 28 и 35/s],
 ['Не оценивается',/Статья 36\(7\).*«вне ковра».*не оценивается.*36\(3\)/s],
 ['1 балл',/Статья 35\(4\)\(б\).*из положения «лёжа».*1 балл.*Статья 28.*переворачивания/s],
 ['Большинством голосов судейской тройки',/Статья 35\(6\).*большинством голосов.*два совпадающих/s]
];
const self=new Set(mods[4].lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i],[answer,source]=expected[i];
 assert.equal(q.a.length,4,'Four choices at item '+(33+i));
 assert.equal(q.a[q.correct],answer,'Historical correct choice changed at '+(33+i));
 assert.match(q.body,source,'Source-specific reasoning absent at '+(33+i));
 assert.ok(!self.has(q.q.trim().toLowerCase()),'Exam duplicates self-check at '+(33+i));
}
assert.match(qs[2].body,/Для ровно 10 секунд тексты расходятся.*статья 28 включает 10 секунд.*статья 35 требует более 10/s);
console.log('PASS: scoring exam items 33–40 source-checked against arts 28, 33, 35 and 36');
console.log('PASS: 88 original questions, choices and keys protected by chained fingerprint test');
console.log('SOURCE NOTE: exact-ten-second hold conflict unresolved (arts 28 vs 35)');
console.log('AUDIT STATUS: 40/112 checked, 48 other expanded and 24 foundation questions remain');
console.log('NOT VERIFIED: real-account Supabase save/relogin/restore and independent referee acceptance');
