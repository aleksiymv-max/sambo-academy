'use strict';
// Normative audit: independent exam items 41–48 (sanctions, results and protests).
// This test chains the previous 1–40 exam audits and protects historical keys.
// Source: Rules of sambo, order 892 as amended by order 860 of 14.09.2026.
// It does NOT resolve the conflicting removal procedures in arts 38(1)/40(3).
require('./check-exam-scoring-2026.cjs');
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
assert.ok(mods.every(m=>m.examRevision===2));
assert.ok(mods.every(m=>m.lessons.every(l=>l.blocks.length>=6&&l.checks.length>=5)));
const qs=Array.from(mods[5].questions);
assert.equal(qs.length,8);
const expected=[
 ['Снятие со схватки по предусмотренной процедуре',/Статья 37\(4–6\).*четвёртого.*Статья 38\(2–4\).*статья 38\(1\).*статья 40\(3\).*разночтение/s],
 ['Его сопернику',/Статья 34\(8\).*отсутствуют технические баллы.*предупреждение.*статьи 34\(4\)/s],
 ['Требовать письменный протест с указанием нарушенных пунктов',/Статья 41\(2\)\(а\).*письменный протест.*нарушенные пункты.*Статья 11\(4\).*статье 41\(5\)/s],
 ['Сразу после возникновения ситуации',/Статья 41\(1\), \(2\)\(б\).*жеребьёвки.*сразу.*статье 41\(3\)\(б\).*Фиксированный срок в минутах/s],
 ['Главный судья с судьями схватки и предусмотренным представителем ВКС',/Статья 41\(3\)\(а\).*главный судья.*всех судей.*Председателем ВКС.*41\(4\)\(а\).*пункту 5/s],
 ['Основание для дисквалификации по статье 39',/Статья 9\(1\)\(д\).*статья 39\(3\).*рукопожатия.*39\(1\).*39\(4\).*38\(4\)/s],
 ['Время получения первых предупреждений и критерии статьи 34',/Статья 34\(9\).*оба спортсмена.*первые предупреждения в разное время.*одновременно.*не сообщает явно.*условным/s],
 ['Следовать полномочиям судей и процедуре письменного протеста',/Статья 37\(6\).*статьи 38–40.*статье 11\(10\).*тренер.*41\(2\)\(а\).*представитель команды.*41\(5\)/s]
];
const self=new Set(mods[5].lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i], [answer,source]=expected[i];
 assert.equal(q.a.length,4,'Four choices expected for item '+(41+i));
 assert.equal(q.a[q.correct],answer,'Historical key changed at '+(41+i));
 assert.match(q.body,source,'Missing article-specific reasoning at '+(41+i));
 assert.ok(!self.has(q.q.trim().toLowerCase()),'Exam duplicates self-check at '+(41+i));
}
assert.match(qs[0].body,/неустранённое разночтение требует официального разъяснения/);
assert.match(qs[6].body,/ситуация требует уточнения перед окончательной нормативной приёмкой/);
console.log('PASS: eight independent sanctions and protests exam explanations 41–48 checked against arts 9, 11, 34 and 37–41');
console.log('PASS: historical question/answer fingerprint, 88 questions, 54 expanded lessons and examRevision=2 preserved');
console.log('SOURCE NOTE: removal decision discrepancy arts 38(1)/40(3) and ambiguous stem of item 47 remain open');
console.log('AUDIT STATUS: 48/112 addressed, 40 expanded and 24 foundation exam items remain');
console.log('NOT VERIFIED: real-account Supabase save/relogin/restore, independent referee-methodologist approval');
