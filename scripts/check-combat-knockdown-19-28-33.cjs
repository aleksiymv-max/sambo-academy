/* Regression for combat-sambo knockdown referee decisions, official Rules 2026.
 * Structural anchors are not an official referee qualification or medical protocol. */
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
const combat=modules[7],lesson=combat.lessons[1];
assert.equal(combat.title,'Боевое самбо: специальные требования к судейству');
assert.equal(combat.lessons.length,4,'Combat lesson order changed');
assert.equal(lesson.title,'Удары, нокдаун и нокаут: работа арбитра');
assert.ok(lesson.blocks.length>=9,'Knockdown explanation depth below editorial target');
assert.ok(lesson.checks.length>=7,'Knockdown self-check depth below editorial target');
const body=lesson.blocks.map(b=>b.join(' ')).join(' ');
for(const anchor of ['Статья 19(1, 11)','Статья 28, пункт 9','статья 33(1)(д)',
 'Статья 19(10)','Статья 19(2)','статья 35(2)(в)','Статья 33(2)',
 'два нокдауна','первого нокдауна','не право арбитра ставить диагноз'])
 assert.ok(body.toLowerCase().includes(anchor.toLowerCase()),'Missing normative anchor: '+anchor);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'));
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'));
const original=[
 'Что делает арбитр при нокдауне?',
 'С какой нормой связаны критерии продолжения после нокдауна?',
 'Юноша 16–18 лет восстановился после первого нокдауна. Как поступить?'
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i],'Original question moved');
 assert.equal(lesson.checks[i][2],0,'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4);
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);
}
assert.equal(combat.questions.length,8,'Independent combat exam changed');
const self=new Set(combat.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(combat.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent exam duplicates self-check');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Independent exam bank changed');
console.log('PASS: combat knockdown arts 19/28/33/35, 9 blocks, 7 checks, preserved 54 lessons and 88 independent exam questions');
