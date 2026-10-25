/* Combat sambo articles 5 and 10: age/gear editorial regression.
 * Structural checks and source anchors only; not official normative sign-off. */
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
const combat=modules[7],lesson=combat.lessons[0];
assert.equal(combat.title,'Боевое самбо: специальные требования к судейству');
assert.equal(combat.lessons.length,4,'Combat lesson order changed');
assert.equal(lesson.title,'Что меняется в боевом самбо');
assert.ok(lesson.blocks.length>=9,'Equipment explanation depth below editorial target');
assert.ok(lesson.checks.length>=7,'Equipment self-check depth below editorial target');
const body=[...lesson.blocks.map(b=>b.join(' ')),lesson.caseAnalysis,lesson.decision].join(' ');
for(const marker of ['Статья 5 раздела VI','18 лет именно на день','10(1–5)',
 'статья 10(2)(г)','6 унций','статья 10(3)','статья 10(6)','санкции'])
 assert.ok(body.toLowerCase().includes(marker.toLowerCase()),'Missing normative anchor: '+marker);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'));
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'));
const original=[
 'Где указаны специальные требования боевого самбо?',
 'Требуется ли защитная экипировка?',
 'Какие перчатки отдельно предписаны юношам 14–16 и 16–18 лет?',
 'Допустимо ли специальное тейпирование кистей?'
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
console.log('PASS: combat arts 5/10, 9 blocks, 7 checks, original keys and 54 lessons / 88 independent exam questions');
