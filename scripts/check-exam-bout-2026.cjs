'use strict';
// Source-specific audit of independent bout exam items 25–32.
// Keep all historical stems, choices and correct indices; the earlier audit
// enforces the stable 88-question fingerprint and examRevision=2.
// Sources: VFS consolidated rules as amended 14.09.2026 and separately
// published VFS September 2026 amendments/clarifications.
// Editorial/source verification is NOT an official referee qualification.
require('./check-exam-officials-2026.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
const files=[
 'judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mods=ctx.window.samboJudgeCourseEngine.modules;
assert.equal(mods.length,11);
assert.equal(mods.reduce((sum,m)=>sum+m.lessons.length,0),54);
assert.equal(mods.reduce((sum,m)=>sum+m.questions.length,0),88);
assert.ok(mods.every(m=>m.examRevision===2),'Preserve existing exam revision');
assert.ok(mods.every(m=>m.lessons.every(l=>l.blocks.length>=6&&l.checks.length>=5)),
 'Previously achieved editorial quantitative threshold must not regress');
const qs=Array.from(mods[3].questions);
assert.equal(qs.length,8,'Preserve all eight bout questions');
const expected=[
 ['Положение атакуемого до начала действия и условия оцениваемого броска',
  /Статья 28.*пункты 2, 5–6.*Разъяснения ВФС от 01\.09\.2026.*неоцениваемые сегменты.*колени/s],
 ['Непрерывность переката и положение при приземлении',
  /Статья 28.*пункт 3.*непрерывный перекат.*без визуальной паузы.*статьи 33 и 35/s],
 ['Отсчёт времени каждого разрешённого действия по соответствующим правилам',
  /Статья 19\(5\).*параллельные отсчёты.*бол[её]вого продолжается.*статье 28.*статье 23/s],
 ['Прерывает эпизод и возобновляет схватку в стойке',
  /Статья 19\(6\).*не делает реальных попыток.*прерывает.*стойке на середине ковра/s],
 ['Активность спортсменов по предусмотренной статье 19 процедуре',
  /Статья 19\(7\).*предупреждении.*«Разъяснения правил с 1 сентября 2026 года».*«Активность».*вместо предупреждения.*не является санкцией/s],
 ['Стоя после оказания помощи',
  /Статья 19\(6\).*обильном кровотечении.*врача.*в положении стоя.*раздельно/s],
 ['По решению арбитра с сопровождением бокового судьи',
  /Статья 36\(1–2\).*статья 30\(3\).*арбитр.*сопровождение бокового судьи/s],
 ['Врач в пределах медицинских полномочий',
  /Статья 26\(2\)\(е\).*заключение.*главному судье.*Статья 38.*не подменяет заключение врача/s]
];
for(let i=0;i<expected.length;i++){
 const q=qs[i], [answer,pattern]=expected[i];
 assert.equal(q.a.length,4,'Four choices expected for bout item '+(i+25));
 assert.equal(q.a[q.correct],answer,'Historical key changed for bout item '+(i+25));
 assert.match(q.body,pattern,'Normative explanation missing for bout item '+(i+25));
 const self=new Set(mods[3].lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
 assert.ok(!self.has(q.q.trim().toLowerCase()),'Exam duplicates self-check: '+(i+25));
}
assert.match(qs[4].body,/Различие сводного текста и документа разъяснений 2026 года требует методического согласования/,
 'Keep visible note on article 19(7) source discrepancy');
console.log('PASS: 8/8 independent bout exam items 25–32 checked against consolidated rules and VFS September 2026 clarification');
console.log('PASS: historical 88-question fingerprint, 54 lessons, 11 modules, examRevision=2 and independent questions preserved');
console.log('SOURCE NOTE: consolidated art.19(7) still differs from VFS September 2026 explanation of activity A');
console.log('AUDIT STATUS: 32/112 source-checked, 56 other expanded-module questions and 24 foundation questions remain');
console.log('NOT VERIFIED: real-account Supabase save/relogin/restore, independent referee-methodologist acceptance');
