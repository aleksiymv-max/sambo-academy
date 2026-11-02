'use strict';
// Focused source/lesson regression: sports sambo arts 38(1), 39(1), 40(3).
// These markers do not settle procedural discrepancies or approve the course.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.createContext(sandbox);
for(const path of ['judge-course-engine.js','judge-program-sanctions.js']){
 vm.runInContext(fs.readFileSync(path,'utf8'),sandbox,{filename:path});
}
const mod=sandbox.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.title,'Предупреждения, снятие и протесты');
assert.equal(mod.lessons.length,3,'Stable lesson order changed');
const lesson=mod.lessons[1];
assert.equal(lesson.title,'Снятие со схватки и дисквалификация с соревнований');
assert.ok(lesson.ref.includes('38(1–4)')&&lesson.ref.includes('39(1–4)')&&lesson.ref.includes('40(1, 3)'));
const block=lesson.blocks.find(b=>b[0]==='Решение и объявление: не смешивать статьи 38 и 40');
assert.ok(block,'Missing separate explanation of decision vs announcement');
for(const marker of ['38(1)','40(3)','39(1)','заместителя главного судьи',
 'согласия главного судьи','не устанавливает собственный приоритет']){
 assert.ok(block[1].includes(marker),'Missing source or uncertainty marker: '+marker);
}
assert.ok(lesson.caseAnalysis.includes('38(1)')&&lesson.caseAnalysis.includes('40(3)'),
 'Case must require procedural comparison');
const original=[
 'Кто принимает решение о снятии со схватки по статье 38(1)?',
 'Кто принимает решение о дисквалификации по статье 39(1)?',
 'Как учитываются командные очки при снятии со схватки по статье 38(4)?',
 'Каковы последствия дисквалификации по статье 39(4)?',
 'Какое основание прямо названо в статье 39(3)?'
];
assert.equal(lesson.checks.length,6,'Expected five preserved and one new self-check');
for(let i=0;i<original.length;i++){
 assert.equal(lesson.checks[i][0],original[i],'Historical self-check moved or replaced');
 assert.equal(lesson.checks[i][2],0,'Historical answer index changed');
}
const added=lesson.checks[5];
assert.ok(added[0].includes('статья 40(3)')&&added[0].includes('объявлением'));
assert.equal(added[2],0);
assert.ok(added[1][0].includes('заместителем главного судьи'));
assert.ok(added[3].includes('38(1)')&&added[3].includes('39(1)'));
const html=sandbox.window.samboJudgeCourseEngine.sections(mod,6)[2].html;
assert.ok(html.includes('Решение и объявление: не смешивать статьи 38 и 40'));
assert.ok(html.includes('согласия главного судьи'));
console.log('PASS: arts 38(1), 39(1), 40(3) distinguished in lesson, case, rendered HTML and self-check');
console.log('OPEN: differing majority-consent formulations require authoritative interpretation; not normative approval');
