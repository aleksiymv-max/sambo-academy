/* Structural regression for Sambo Rules arts. 18–20 and 24–27, amendment 14.09.2026 № 860.
 * Confirms the authored lesson structure and key references; not a referee-methodology certification. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.createContext(context);
for(const file of ['judge-course-engine.js','judge-program-officials.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const mod=context.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.title,'Судейская коллегия и должностные обязанности');
assert.equal(mod.lessons.length,8,'Existing progress positions must not change');
for(const spec of [
 {i:4,title:'Руководитель ковра, арбитр, боковой судья',ref:'Статьи 18–20',terms:['контролирует секретаря','Статья 19(2)','Боковой судья','Учебный алгоритм при споре']},
 {i:7,title:'Информатор, контроль формы, врач, администратор',ref:'Статьи 24–27',terms:['Статья 25(1)(д)','Статья 26(2)','статье 24','Учебный алгоритм разграничения']}
]){
 const lesson=mod.lessons[spec.i];
 assert.equal(lesson.title,spec.title,'Do not rename/reorder established lessons');
 assert.ok(lesson.ref.includes(spec.ref),'Missing article reference');
 assert.ok(lesson.blocks.length>=8,'Insufficient explanatory blocks');
 assert.ok(lesson.checks.length>=5,'Insufficient explained self-checks');
 assert.ok(lesson.goal&&lesson.situation&&lesson.caseAnalysis&&lesson.decision&&lesson.trap,'Incomplete editorial fields');
 const prose=lesson.blocks.map(x=>x.join(' ')).join(' ');
 for(const term of spec.terms)assert.ok(prose.includes(term),'Missing checked norm: '+term);
 assert.ok(lesson.caseAnalysis.includes('Дано:'),'Case must identify known facts before decision');
 for(const q of lesson.checks){
  assert.ok(q[0]&&q[3]&&Array.isArray(q[1])&&q[1].length>=3,'Malformed self-check');
  assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Bad correct answer index');
 }
}
assert.equal(new Set(mod.lessons.map(x=>x.title)).size,8);
console.log('PASS: arts. 18–20 and 24–27, two enhanced officials lessons, 16 blocks and 10 explained checks; progress mapping unchanged');