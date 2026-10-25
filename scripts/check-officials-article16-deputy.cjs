/* Editorial regression for deputy chief referee, article 16 and related articles 15, 38, 39.
 * Checks source anchors, structure and backward compatibility, not legal certification. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modules=sandbox.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Expanded module order must remain stable');
const mod=modules[2],lesson=mod.lessons[2];
assert.equal(mod.title,'Судейская коллегия и должностные обязанности');
assert.equal(mod.lessons.length,8,'Do not change existing progress positions');
assert.equal(lesson.title,'Заместитель главного судьи');
assert.ok(lesson.ref.includes('Статья 16'));
assert.ok(lesson.blocks.length>=9,'Deputy referee explanation is incomplete');
assert.ok(lesson.checks.length>=7,'Deputy referee self-check is incomplete');
const prose=lesson.blocks.map(pair=>pair.join(' ')).join(' ');
for(const marker of [
'Статья 16(2)(в)','НЕ после объявления результата','Статья 38(1)',
'Статья 39(1)','Статья 16(3)','Статья 15(4)',
'ходатайствует','Учебный алгоритм спорной оценки'
])assert.ok(prose.includes(marker),'Missing article 16 anchor: '+marker);
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('статьёй 15(4)'),
 'Case must identify facts and procedural limit');
assert.ok(lesson.decision.includes('Норма:')&&lesson.decision.includes('Вывод:'),
 'Case must separate rule and conclusion');
const original=[
'От чего зависит число заместителей?',
'Кого комплектует и контролирует заместитель?',
'Когда заместитель может задержать объявление спорного результата?',
'Какое действие заместителя предусмотрено при вопросе о дисквалификации?'
];
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i],'Original question order changed');
 assert.equal(lesson.checks[i][2],0,'Original correct answer changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4,'Malformed self-check');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Invalid answer index');
}
assert.equal(mod.questions.length,8,'Original module exam bank must remain unchanged');
const self=new Set(mod.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(mod.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Exam must remain independent');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Exam count changed');
console.log('PASS: article 16 deputy referee, 9 explanation blocks, 7 self-checks, unchanged progress order and 88 independent questions');
