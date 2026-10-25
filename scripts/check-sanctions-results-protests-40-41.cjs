/* Focused regression: articles 40–41, result protocol and distinct protest procedures.
 * Structural markers do not replace normative expert review or authenticated progress E2E. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modules=sandbox.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module count changed');
const mod=modules[5],lesson=mod.lessons[2];
assert.equal(mod.title,'Предупреждения, снятие и протесты');
assert.equal(mod.lessons.length,3,'Lesson positions changed');
assert.equal(lesson.title,'Результат схватки и две процедуры протеста');
assert.ok(lesson.ref.includes('40(2–4)')&&lesson.ref.includes('41(1–5)'));
assert.ok(lesson.blocks.length>=9,'Insufficient explanation blocks');
assert.ok(lesson.checks.length>=7,'Insufficient self-check questions');
const prose=lesson.blocks.map(b=>b.join(' ')).join(' ');
for(const anchor of ['Статья 40(2)','статьи 41(2)(а)','статья 41(2)(б)',
 'Статья 41(3)(б)','статье 41(4)(б)','Статья 41(5)',
 'в день фиксации нарушения','открытое расхождение','протокола схватки'])
 assert.ok(prose.includes(anchor),'Missing normative or source-conflict marker: '+anchor);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'));
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'));
const original=[
 'Кто вправе подать предусмотренный статьёй 41 письменный протест?',
 'Как поступить при ошибке в жеребьёвке, обнаруженной во время соревнований?',
 'Кто участвует в рассмотрении протеста о нарушении судейства?',
 'Изменяет ли решение по протесту о судействе конечный результат схватки?'
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i],'Original question moved or replaced');
 assert.equal(lesson.checks[i][2],0,'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4,'Malformed question');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Invalid answer key');
}
assert.equal(mod.questions.length,8,'Independent module exam changed');
const self=new Set(mod.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(mod.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Exam self-check duplicated');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Exam question count changed');
console.log('PASS: articles 40–41 result protocol and two protest routes, 9 blocks, 7 checks, 54 lessons, 88 independent exam questions');
