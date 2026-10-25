'use strict';
// Independent demonstration sambo exam items 73–80: normative audit, 26.10.2026.
// Primary source: Rules of Sambo, order 892 as amended by 14.09.2026 order 860,
// section VIII (articles 59–65), section IX (articles 66–69), appendix 10.3.
// Existing questions/choices/keys/progress indices are immutable; only feedback updated.
require('./check-exam-beach-2026.cjs');
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
const demo=modules[9],qs=Array.from(demo.questions);
assert.equal(qs.length,8);
const expected=[
 {q:"Судья применяет к личной демонстрации баллы за бросок из спортивного самбо. Какой подход верен?",correct:0,answer:"Оценивать демонстрацию по её специальным критериям",markers:["Раздел VIII","статьи 59–65","десяти упражнений","статье 63"]},
 {q:"Участник личной демонстрации нарушил порядок выполнения комплекса. Что судья должен проверить?",correct:1,answer:"Требования к программе и основаниям снижения оценки",markers:["Статьи 61–63","хаотичном","три ошибки","Само по себе изменение порядка"]},
 {q:"Судья выставляет баллы за личную демонстрацию без проверки техники. Что требуется?",correct:2,answer:"Сопоставить исполнение с критериями специальных статей",markers:["Статья 62","два балла и более","коллегиальным решением","статье 63"]},
 {q:"Командная демонстрация оценивается как личная без учёта композиции. Как исправить?",correct:3,answer:"Использовать отдельные критерии командного выступления",markers:["Раздел IX","Статья 67","от 4 до 10","Статья 69"]},
 {q:"При подготовке командной демонстрации организатор использует таблицу численности судей для спортивного самбо. Что проверить?",correct:0,answer:"Приложение 10.3 для командной демонстрации",markers:["Приложение 10.3","Статья 66","статья 68(2)","разночтение"]},
 {q:"Судья сравнивает результаты двух команд, не учитывая компоненты оценки. Что необходимо?",correct:1,answer:"Проверить компоненты и порядок определения победителя по статьям 68–69",markers:["Статьи 68–69","среднего балла","в стойке","в партере","жеребьёвки"]},
 {q:"При индивидуальной демонстрации техническое действие выполнено с грубой ошибкой. Что применить?",correct:2,answer:"Шкалу и основания оценки из раздела VIII",markers:["Статьи 62–63","одна ошибка","трёх ошибках","статье 64"]},
 {q:"Судья путает возрастные группы личной демонстрации с категориями боевого самбо. Где искать правильные условия?",correct:3,answer:"В статье 59 и Положении соревнований",markers:["Статья 59","10–12","18–20","Статья 65","Положении"]}
];
const selfChecks=new Set(demo.lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i],x=expected[i];
 assert.equal(q.q,x.q,'Historical question changed at '+(73+i));
 assert.equal(q.a.length,4);
 assert.equal(q.correct,x.correct,'Historical correct index changed at '+(73+i));
 assert.equal(q.a[q.correct],x.answer,'Historical correct answer changed at '+(73+i));
 assert.ok(q.body.length>=450,'Explanation too short at '+(73+i));
 for(const marker of x.markers)assert.ok(q.body.includes(marker),'Missing normative marker '+marker+' at '+(73+i));
 assert.ok(!selfChecks.has(q.q.trim().toLowerCase()),'Independent exam duplicates self-check at '+(73+i));
}
assert.ok(qs[4].body.includes('статья 68(2)')&&qs[4].body.includes('разночтение'));
assert.ok(qs[6].body.includes('статье 64'));
console.log('PASS: demonstration sambo exam items 73–80 checked against articles 59–69 and appendix 10.3');
console.log('PASS: personal scoring, zero vs disqualification, team scoring and age-group distinctions');
console.log('OPEN: article 66 vs article 68(2) executive judging crew discrepancy requires official clarification');
console.log('PASS: chained historical 88-question fingerprint, 54 lessons and examRevision=2 retained');
console.log('AUDIT STATUS: 80/112 addressed; eight expanded and 24 foundation questions remain');
console.log('NOT VERIFIED: authenticated Supabase progress restore or external referee-methodologist sign-off');
