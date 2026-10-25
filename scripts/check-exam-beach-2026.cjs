'use strict';
// Independent beach-sambo exam items 65–72: article-by-article audit, 26.10.2026.
// Source: Russian Rules of Sambo (order 892 amended 14.09.2026, no. 860), section VII.
// Historical questions, choices, correct indices, progress keys and examRevision=2 are immutable.
// Editorial discrepancy: article 45(4) describes a two-person crew, article 56 says majority of three.
require('./check-exam-combat-2026.cjs');
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
const beach=modules[8],qs=Array.from(beach.questions);
assert.equal(qs.length,8);
const expected=[
 {q:'Пляжный поединок продолжается в партере после падения. Как действовать?',correct:0,answer:'Прекратить борьбу в партере: поединок ведётся только в стойке',markers:['Статья 49(1–2)','статьям 49 и 53(2)(а)','контрброска']},
 {q:'Через две минуты пляжного поединка технических действий не было. Что предусматривают Правила?',correct:1,answer:'Определение более активного спортсмена',markers:['Статьи 47(3) и 51(3)','«активность»','Статья 48','трёх минут']},
 {q:'Спортсмен выполнил бросок, соперник упал на песок не на ноги. Что проверяет арбитр?',correct:2,answer:'Соответствие критериям победного броска',markers:['Статья 49(1–5)','теряет равновесие','статьёй 55','статье 53(2)(а)']},
 {q:'Для пляжного самбо назначили схватку на 5 минут. Что требует специальный раздел?',correct:3,answer:'Установить продолжительность 3 минуты',markers:['Статья 51(1–2)','три минуты','Статья 50(3)','гонгу']},
 {q:'Спортсмен вышел на второй пляжный поединок после пяти минут отдыха. Какой минимальный интервал?',correct:0,answer:'Не менее десяти минут',markers:['Статья 52','десяти минут','статье 51(1)']},
 {q:'После решения судей по пляжному поединку представитель хочет подать обычную апелляцию на оценку. Что указано в правилах?',correct:1,answer:'Такая апелляция на решения судей не предусмотрена',markers:['Статья 56','«большинства из трёх»','статья 45(4)','официального разъяснения']},
 {q:'На песке оборудовали площадку 8×8 м. Что проверить?',correct:2,answer:'Специальное требование 6×6 м',markers:['Статья 57','6×6','два жёлтых','одного метра']},
 {q:'На пляжном поединке возникла спорная ситуация, не урегулированная обычным действием арбитра. Как поступить?',correct:3,answer:'Привлечь главного судью или его заместителя по статье 45',markers:['Статья 45(4)','Статьи 46–47','статья 56','разночтение']}
];
const selfChecks=new Set(beach.lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
for(let i=0;i<8;i++){
 const q=qs[i],x=expected[i];
 assert.equal(q.q,x.q,'Historical question changed at '+(65+i));
 assert.equal(q.a.length,4);
 assert.equal(q.correct,x.correct,'Historical correct index changed at '+(65+i));
 assert.equal(q.a[q.correct],x.answer,'Historical correct answer changed at '+(65+i));
 assert.ok(q.body.length>=320,'Explanation too short at '+(65+i));
 for(const marker of x.markers)assert.ok(q.body.includes(marker),'Missing normative marker '+marker+' at '+(65+i));
 assert.ok(!selfChecks.has(q.q.trim().toLowerCase()),'Independent exam duplicates self-check at '+(65+i));
}
assert.ok(qs[5].body.includes('статья 45(4)')&&qs[7].body.includes('статья 56'));
console.log('PASS: beach sambo exam items 65–72 checked against section VII, articles 45–57');
console.log('PASS: beach activity, throw, duration, rest, appeals, field dimensions and dispute boundaries');
console.log('OPEN: articles 45(4)/56 judging-crew discrepancy needs official clarification');
console.log('PASS: chained historical 88-question fingerprint, 54 lessons and examRevision=2 retained');
console.log('AUDIT STATUS: 72/112 addressed; 16 expanded and 24 foundation questions remain');
console.log('NOT VERIFIED: authenticated Supabase progress restore or external referee-methodologist sign-off');
