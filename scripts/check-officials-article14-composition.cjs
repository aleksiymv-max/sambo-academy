/* Article 14 editorial regression, Russian Sambo Rules as amended 14.09.2026 №860.
 * Structural/source-anchor check only; NOT a normative or official referee certification. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
const files=['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'];
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const modules=sandbox.window.samboJudgeCourseEngine.modules;
assert.equal(modules.length,11,'Judge modules must retain existing order');
const mod=modules[2],lesson=mod.lessons[0];
assert.equal(mod.title,'Судейская коллегия и должностные обязанности');
assert.equal(mod.lessons.length,8,'Do not move existing lesson/progress indices');
assert.equal(lesson.title,'Состав коллегии и судейская тройка');
assert.ok(lesson.ref.includes('Статья 14')&&lesson.ref.includes('приложение 10'));
assert.ok(lesson.blocks.length>=9,'Article 14 explanation incomplete');
assert.ok(lesson.checks.length>=7,'Article 14 self-check incomplete');
const text=lesson.blocks.map(pair=>pair.join(' ')).join(' ');
for(const term of ['Статья 14(1)','Статья 14(3)','Статья 14(4)','Статья 14(5)',
'три федеральных округа','руководитель судейской коллегии субъекта',
'компрессионный рукав телесного цвета','Приложение 10','не становятся четвёртым судьёй']){
 assert.ok(text.includes(term),'Missing checked article 14 element: '+term);
}
assert.ok(lesson.caseAnalysis.includes('Дано:')&&lesson.caseAnalysis.includes('Норма:'),'Case must separate facts from rule');
const preserved=[
'Кто входит в тройку?',
'Состав коллегии утверждают с учётом чего?',
'Какие территориальные требования действуют к тройке на всероссийских соревнованиях?',
'Что судья обязан сделать при разборе спорного решения?'
];
for(let i=0;i<preserved.length;i++){
 assert.equal(lesson.checks[i][0],preserved[i],'Original self-check position changed');
 assert.equal(lesson.checks[i][2],0,'Original answer key changed');
}
for(const q of lesson.checks){
 assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length===4);
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Invalid answer mapping');
}
assert.equal(mod.questions.length,8,'Independent exam bank must remain unchanged');
const self=new Set(mod.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(mod.questions.every(q=>!self.has(q.q.trim().toLowerCase())),'Independent exam must not repeat self-checks');
assert.equal(modules.reduce((n,m)=>n+m.lessons.length,0),54,'Lesson count changed');
assert.equal(modules.reduce((n,m)=>n+m.questions.length,0),88,'Independent exam count changed');
console.log('PASS: article 14, 9 explanation blocks, 7 self-checks, 8 original lesson positions, 88 independent questions unchanged');
