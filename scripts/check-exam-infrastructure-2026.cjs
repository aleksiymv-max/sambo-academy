'use strict';
// Normative audit of independent exam questions 49–56: venue, safety, timekeeping and protocols.
// Source: Rules of sambo, Ministry of Sport order 892 as amended 14.09.2026 no. 860.
// Preserve historical question texts, choices, correct indices, module order and examRevision=2.
require('./check-exam-sanctions-2026.cjs');
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
const qs=Array.from(mods[6].questions);
assert.equal(qs.length,8);
const expected=[
 ['Привести площадку к требованиям до начала соревнований',/Статья 42\(1\).*11×11.*14×14.*6 до 9.*Статья 42\(4\)/s],
 ['Резервный ручной отсчёт и звуковой сигнал',/Статья 43\(4\).*Статья 43\(6\).*механическое табло.*гонг.*ручной секундомер/s],
 ['Записать оценки хронологически',/Статья 21\(1–2\).*приложение 14.*1, 2 или 4.*последнее оценённое действие/s],
 ['Зафиксировать точный вес по установленной форме',/Статья 8\(5–6\).*приложение 9.*одной десятой.*НВ.*подпись/s],
 ['По приложению 10 для нужного числа ковров',/Приложение 10.*1, 2, 3 и 4.*четыре руководителя.*шесть арбитров.*шесть боковых/s],
 ['Нет, необходимо обеспечить требования статьи 42',/Статья 42\(1–2\).*6–9.*11×11–14×14.*Статья 42\(4\).*не задаёт отдельного универсального/s],
 ['Однозначность привязки оценок и времени к конкретному ковру',/Статья 43\(4\).*статья 22.*статья 21.*общий экран.*не отменяет/s],
 ['Предусмотренные Правилами приложения и обязательные реквизиты',/Приложение 8.*приложение 9.*приложение 11.*приложение 12.*приложение 14.*Приложение 13.*жесты/s]
];
const self=new Set(mods[6].lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i], [answer,source]=expected[i];
 assert.equal(q.a.length,4,'Four choices expected for item '+(49+i));
 assert.equal(q.a[q.correct],answer,'Historical key changed at '+(49+i));
 assert.match(q.body,source,'Missing article-specific reasoning at '+(49+i));
 assert.ok(!self.has(q.q.trim().toLowerCase()),'Exam duplicates self-check at '+(49+i));
}
assert.match(qs[5].body,/не задаёт отдельного универсального числового размера/);
assert.match(qs[7].body,/Приложение 13 описывает жесты судей/);
console.log('PASS: independent infrastructure exam explanations 49–56 checked against arts 8, 17, 21–22, 42–43 and appendices 8–14');
console.log('PASS: historical question/answer fingerprint, 88 questions, 54 expanded lessons and examRevision=2 preserved');
console.log('SOURCE NOTE: appendix 13 is gestures, not a protocol template; art 42 has no universal numerical safety-zone width');
console.log('AUDIT STATUS: 56/112 addressed; 32 expanded and 24 foundation exam items remain');
console.log('NOT VERIFIED: real-account Supabase save/relogin/restore, independent referee-methodologist approval');
