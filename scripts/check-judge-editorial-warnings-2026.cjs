'use strict';
// Cross-audit presentation gate: show known unresolved source conflicts BEFORE exams.
// Normative basis: Rules of Sambo, order 892 amended 14.09.2026 (order 860).
// These notices are NOT a normative resolution or independent referee approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fnv=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');};
const independent=fs.readFileSync('judge-exam-independent.js','utf8');
const qLines=independent.split(/\r?\n/).filter(x=>x.startsWith('Q('));
assert.equal(qLines.length,88);
const canonical=qLines.map(line=>{
 const m=line.match(/^(Q\(.*\],\d+,)"/);
 assert.ok(m,'Unexpected historical question format');
 return m[1];
}).join('\n');
assert.equal(fnv(canonical),'b0f69259','Historical expanded exam questions/keys changed');
const context={window:{}};vm.createContext(context);
for(const file of [
 'judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const engine=context.window.samboJudgeCourseEngine;
assert.equal(engine.modules.length,11);
assert.equal(engine.modules.reduce((n,m)=>n+m.lessons.length,0),54);
assert.equal(engine.modules.reduce((n,m)=>n+m.questions.length,0),88);
assert.ok(engine.modules.every(m=>m.examRevision===2));
const expected=new Map([
 [4,['Статья 28','статья 27','11–12','12–14','14–16','отрывом туловища']],
 [5,['Статья 28(6)','статья 35(3)(д)','ровно 10 секунд']],
 [6,['вопрос № 47','статьи 34(9)','Статьи 38(1) и 40(3)','judge:1306']],
 [9,['Статья 45(4)','статья 56','большинство из трёх']],
 [10,['Статья 66','статья 68(2)','трёх судей']]
]);
for(let i=0;i<engine.modules.length;i++){
 const mod=engine.modules[i],index=i+1,parts=engine.sections(mod,index);
 assert.equal(parts.length,mod.lessons.length+2);
 const intro=parts[0].html,exam=parts.at(-1).html;
 if(expected.has(index)){
  for(const [name,html] of [['intro',intro],['exam',exam]]){
   assert.ok(html.includes('data-editorial-warning="'+index+'"'),'No caveat before '+name+' for module '+index);
   assert.ok(html.includes('Редакторское предупреждение'),'No editorial warning heading');
   for(const marker of expected.get(index))assert.ok(html.includes(marker),'Missing '+marker+' in '+name+' of module '+index);
   assert.ok(html.includes('role="note"'),'Notice must be accessible');
  }
 }else{
  assert.ok(!intro.includes('data-editorial-warning='),'Unexpected notice in module '+index);
  assert.ok(!exam.includes('data-editorial-warning='),'Unexpected exam notice in module '+index);
 }
 assert.ok(exam.includes('не официальный квалификационный экзамен'),'Official status disclaimer missing');
}
const foundation={window:{}};vm.createContext(foundation);
vm.runInContext(fs.readFileSync('judge-foundations.js','utf8'),foundation);
const basic=foundation.window.samboJudgeFoundations;
assert.equal(basic.progressIndex,1100);
assert.equal(basic.version,'2026-10-23-1');
assert.equal(fnv(JSON.stringify(Array.from(basic.questions,({q,a,correct,kind})=>({q,a,correct,kind})))),'4910eed2');
assert.equal(basic.questions.length,24);
console.log('PASS: editorial warnings precede exams for youth armbar, scoring, sanctions, beach and team demonstration modules');
console.log('PASS: source article references and unresolved status displayed in module introductions');
console.log('PASS: 112 historical exam questions/keys, 54 expanded lessons and progress identifiers preserved');
console.log('OPEN: historical item 47 remains archived, source conflicts, 12 repeated foundation items and authenticated E2E restoration');
