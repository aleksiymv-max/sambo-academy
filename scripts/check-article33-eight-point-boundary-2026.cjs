'use strict';
// Article 33(1)(v) contains two incompatible boundary phrasings in the same
// official consolidated PDF. Guard transparent disclosure, not a new rule.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-scoring.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const engine=ctx.window.samboJudgeCourseEngine;
const scoring=engine.modules[0];
assert.equal(scoring.title,'Оценивание действий и определение победителя');
const pages=engine.sections(scoring,5);
for(const page of [pages[0],pages[1],pages.at(-1)]){
 for(const phrase of ['свыше 8 баллов','8 (и более)','официальное уточнение','Статья 28(6)']){
  assert.ok(page.html.includes(phrase),'Missing boundary caveat in '+page.title+': '+phrase);
 }
}
const lesson=scoring.lessons[0];
assert.ok(lesson.blocks.some(b=>b[1].includes('скобочное пояснение')&&b[1].includes('свыше 8')),
 'Scoring lesson must distinguish both article 33 formulations');
assert.ok(lesson.decision.includes('официальное уточнение'),
 'Exact-eight-point worked case must not imply an uncontested legal threshold');
assert.equal(lesson.checks[0][2],0,'Keep historical self-check answer mapping');
assert.ok(lesson.checks[0][3].includes('свыше 8'),
 'Self-check explanation must disclose disputed boundary');
const bout=fs.readFileSync('judge-program-bout.js','utf8');
assert.ok(bout.includes('свыше 8')&&bout.includes('8 (и более)')&&bout.includes('официального уточнения'),
 'Bout module must not silently assert the contested boundary');
// The article 19 arbiter lesson is also read independently from the scoring module.
// Article 19(2)(g) explicitly mentions 8 points; article 33(1)(v) contains
// an internal threshold discrepancy. Both must be disclosed together.
vm.runInContext(fs.readFileSync('judge-program-officials.js','utf8'),ctx,{filename:'judge-program-officials.js'});
const officials=engine.modules.find(m=>m.title==='Судейская коллегия и должностные обязанности');
assert.ok(officials,'Officials module missing');
const arbiter=officials.lessons.find(l=>l.title==='Руководитель ковра, арбитр, боковой судья');
assert.ok(arbiter,'Arbiter lesson missing');
const stopping=arbiter.blocks.find(b=>b[0]==='Арбитр: начало, остановка и окончание');
assert.ok(stopping,'Arbiter stoppage block missing');
for(const phrase of ['Статья 19(2)(г)','статья 33(1)(в)','свыше 8 баллов','8 (и более)','официального уточнения']){
 assert.ok(stopping[1].includes(phrase),'Arbiter lesson must disclose article 19/33 boundary: '+phrase);
}
console.log('PASS: article 33(1)(v) exact-eight-point caveat shown in scoring plan, lesson and exam');
console.log('PASS: scoring self-check key retained; bout and arbiter modules disclose article 33 boundary');
console.log('LIMITATION: this is a source-text discrepancy check, not an official ruling');
