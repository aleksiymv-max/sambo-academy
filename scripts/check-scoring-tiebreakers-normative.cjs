'use strict';
// Article 34 / article 29(4-5) regression guard for the expanded scoring tie-breaker lesson.
// Structural checks only: they do not constitute independent normative approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-scoring.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.lessons.length,5,'Preserve all five scoring lesson positions');
const lesson=mod.lessons[3];
assert.equal(lesson.title,'Как определить победителя после времени');
assert.match(lesson.ref,/34/);
assert.equal(lesson.blocks.length,11,'Require eleven explanatory blocks');
assert.equal(lesson.checks.length,7,'Require seven explained self-checks');
const prose=lesson.blocks.map(b=>b.join(' ')).join(' ').toLowerCase();
for(const token of ['34(2)','34(3)','34(4)','34(7)','34(8)','34(9)','29(4)','29(5)','технических баллов','предупрежден']){
 assert.ok(prose.includes(token.toLowerCase()),'Missing normative topic '+token);
}
const questions=new Set();
for(const q of lesson.checks){
 assert.equal(q[1].length,4,'Four options required');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Answer index out of bounds');
 assert.ok(q[3].length>=30,'Each answer needs explanation');
 assert.ok(!questions.has(q[0]),'Duplicate self-check');questions.add(q[0]);
}
assert.equal(mod.lessons[4].title,'Граница ковра и оцениваемые действия','Preserve subsequent lesson');
console.log('PASS: article 34 tie-breakers and article 29 timing; 11 blocks, 7 checks, stable five-lesson order');
