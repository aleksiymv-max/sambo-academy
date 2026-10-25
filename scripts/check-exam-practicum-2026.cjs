'use strict';
// Normative audit of independent comprehensive practicum questions 81–88, 26.10.2026.
// Rules of Sambo: order 892 as amended by order 860 of 14.09.2026.
// Historical questions, options, correct indices, module positions and examRevision are unchanged.
require('./check-exam-demo-2026.cjs');
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
const qs=Array.from(modules[10].questions);
assert.equal(qs.length,8);
const expected=[
 {q:"Спортсмен допущен в электронную сетку, но его фамилии нет в протоколе взвешивания. Что делать?",answer:"Проверить документы допуска и протокол до участия",correct:0,markers:["Статья 5(2)","Статья 8(5–6)","приложение 9","до выхода на ковёр"]},
 {q:"На ковре состоялся спорный бросок с падением атакующего. Как выстроить решение?",answer:"Установить исходное положение, приземление, границы и мнение тройки",correct:1,markers:["Статья 28","статья 35(1–5)","статья 35(6)","статья 36(3, 6–7)"]},
 {q:"Участники спорят об итогах, а в протоколе нет последовательности оценок. Какая ошибка наиболее существенна?",answer:"Невозможность восстановить последнюю оценку и применить критерии результата",correct:2,markers:["Статья 21(1–2)","статье 34(1–4)","статьёй 34(7–9)","универсальным"]},
 {q:"Во время пляжного турнира секретарь применил протокол спортивного самбо с баллами за удержание. Как поступить?",answer:"Перейти на специальную модель пляжного самбо",correct:3,markers:["статьи 49–53","Статья 51","статья 53","Статья 48","удержания"]},
 {q:"У спортсмена есть действующая медицинская заявка, но отсутствует страховой полис. Что первично?",answer:"Проверить обязательные документы комиссии по допуску",correct:0,markers:["Статья 3(5)","статья 3(6)","статья 3(7)","Статья 5(2)"]},
 {q:"На соревнованиях по боевому самбо возникает нокдаун. Какой нормативный блок применять?",answer:"Специальные дополнения раздела VI и медицинскую процедуру",correct:1,markers:["статья 19(10–11)","статье 28","статьям 33 и 35","14–16","разъяснений 2026"]},
 {q:"При равенстве баллов тренер требует определить победителя по алфавиту. Как должен действовать судья?",answer:"Применить последовательность критериев статьи 34 по протоколу",correct:2,markers:["Статья 34(1–4)","статья 34(7–9)","Пункты 34(5–6)"]},
 {q:"После протеста организатор предлагает изменить итог схватки без предусмотренной процедуры. Что необходимо?",answer:"Соблюдать статью 41 и порядок документирования решений",correct:3,markers:["Статья 41(1–2)","Статья 41(3–4)","статья 41(5)","не влияет на конечный результат"]}
];
const self=new Set(modules[10].lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i],x=expected[i],number=81+i;
 assert.equal(q.q,x.q,'Historical question changed at '+number);
 assert.equal(q.a.length,4);
 assert.equal(q.correct,x.correct,'Historical answer index changed at '+number);
 assert.equal(q.a[q.correct],x.answer,'Historical answer text changed at '+number);
 assert.ok(q.body.length>=450,'Short normative explanation at '+number);
 for(const marker of x.markers)assert.ok(q.body.includes(marker),'Missing '+marker+' at '+number);
 assert.ok(!self.has(q.q.trim().toLowerCase()),'Exam duplicates lesson self-check at '+number);
}
assert.ok(qs[2].body.includes('нельзя объявлять последнюю оценку универсальным'));
assert.ok(qs[7].body.includes('не влияет на конечный результат схватки'));
console.log('PASS: comprehensive practicum exam items 81–88 normative explanations checked');
console.log('PASS: articles 3, 5, 8, 21, 28, 34–36, 41, 48–53 and combat section VI');
console.log('PASS: chained historical exam fingerprint, 54 lessons, 88 independent items, examRevision=2');
console.log('AUDIT STATUS: all 88 expanded independent items addressed; 24 foundation items remain');
console.log('NOT VERIFIED: authenticated Supabase progress restore, external referee-methodologist sign-off, known normative discrepancies');
