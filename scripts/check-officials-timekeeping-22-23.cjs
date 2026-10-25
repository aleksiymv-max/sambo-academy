/* Focused editorial regression: timekeeping roles and reserve systems, arts 22–23, 29–30, 43.
 * Text markers and structural checks do not replace a legal review or live-account E2E. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modules=sandbox.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module order changed');
const mod=modules[2],lesson=mod.lessons[6];
assert.equal(mod.title,'Судейская коллегия и должностные обязанности');
assert.equal(mod.lessons.length,8,'Progress positions changed');
assert.equal(lesson.title,'Оператор табло и секундометрист: время и сигналы');
assert.ok(lesson.ref.includes('Статьи 22–23'));
assert.ok(lesson.blocks.length>=9,'Insufficient timekeeping explanation');
assert.ok(lesson.checks.length>=7,'Insufficient timekeeping self-check');
const prose=lesson.blocks.map(b=>b.join(' ')).join(' ');
for(const anchor of [
'Статья 30(2)','статье 29(3–5)','Статьи 22 и 23(1)',
'Статья 43(3,6)','механическое табло','ручные секундомеры',
'первого вызова','по ручному секундомеру','после свистка не оценивается'
])assert.ok(prose.includes(anchor),'Missing checked anchor: '+anchor);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'));
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'));
const original=[
'Когда оператор выводит оценку?',
'Когда останавливают основной секундомер?',
'По какой команде запускают время медицинской помощи?',
'Какая команда запускает отсчёт удержания?'
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i],'Original question order changed');
 assert.equal(lesson.checks[i][2],0,'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4,'Malformed question');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Invalid answer key');
}
assert.equal(mod.questions.length,8,'Existing exam bank changed');
const self=new Set(mod.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(mod.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Exam is not independent');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Exam question count changed');
console.log('PASS: articles 22–23 timing, 9 blocks and 7 checks, original keys, 54 lessons and 88 independent exam questions');
