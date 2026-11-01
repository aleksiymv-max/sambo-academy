'use strict';
// Article 34(9), independent sanctions exam revision 3.
// Historical exam revision 2 and all previous scores remain immutable.
require('./check-exam-sanctions-2026.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
const paths=[
 'judge-foundations.js','judge-exam-foundations-v2.js','judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js','judge-exam-sanctions-v3.js'
];
for(const p of paths)vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const modules=ctx.window.samboJudgeCourseEngine.modules;
const old=modules[5],v3=ctx.window.samboJudgeSanctionsExamV3;
assert.equal(old.examRevision,2);
assert.equal(v3.examRevision,3);
assert.equal(v3.progressIndex,1306);
assert.equal(old.questions.length,8);
assert.equal(v3.questions.length,8);
assert.equal(old.questions[6].correct,2);
assert.match(old.questions[6].q,/Что важно для итогового равенства/);
assert.equal(v3.questions[6].correct,1);
for(const mark of ['01:10','01:40','03:00','статье 34(9)'])assert.ok(v3.questions[6].q.includes(mark),'Missing factual condition: '+mark);
for(const mark of ['Дано:','Важные факты:','Норма:','Вывод:','синий','одновременно'])assert.ok(v3.questions[6].body.includes(mark),'Missing decision reasoning: '+mark);
assert.equal(v3.questions[6].a[1],'Синий: он получил первое предупреждение последним');
for(let i=0;i<8;i++)if(i!==6)assert.equal(v3.questions[i],old.questions[i],'Unrelated exam item replaced at '+i);
assert.equal(v3.lessons,old.lessons,'Do not replace lessons or self-checks');
const self=new Set(v3.lessons.flatMap(l=>l.checks.map(c=>c[0].trim().toLowerCase())));
assert.ok(!self.has(v3.questions[6].q.trim().toLowerCase()),'Exam question duplicates self-check');
const groups=[{title:'Foundations',parts:Array.from({length:6},(_,i)=>({title:'Foundation '+i})),progressIndex:1100},
 ...modules.map(m=>({title:m.title,parts:m.lessons}))];
const bridge={
 window:ctx.window,
 samboModuleData:key=>key==='judge'?groups.map(g=>({...g})):[],
 samboQuizQuestions:()=>[],
 samboLessonSections:()=>[]
};
vm.createContext(bridge);
vm.runInContext(fs.readFileSync('judge-program-bridge.js','utf8'),bridge);
const routed=bridge.samboModuleData('judge');
assert.equal(routed.length,12);
assert.equal(routed[6].progressIndex,1306);
assert.equal(routed[6].examRevision,3);
for(let i=1;i<12;i++)if(i!==6)assert.equal(routed[i].progressIndex,i===1?2201:1200+i);
assert.equal(bridge.samboQuizQuestions(routed[6])[6],v3.questions[6],'Active exam must use new item');
assert.notEqual(bridge.samboQuizQuestions(routed[6])[6],old.questions[6],'Active exam must not use ambiguous item');
assert.match(bridge.samboLessonSections(routed[6]).at(-1).html,/Редакция экзамена: 3/);
assert.match(bridge.samboLessonSections(routed[6])[0].html,/Статьи 38\(1\) и 40\(3\)/);
const progress={window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},renderStudentDashboard(){},authMessage(){}};
vm.createContext(progress);
vm.runInContext(fs.readFileSync('progress.js','utf8'),progress);
progress.progressKey=progress.window.progressKey;
assert.deepEqual(Array.from(progress.window.samboJudgeHistoricalIndices(1306)),[1206,1106]);
assert.equal(progress.window.progressDone('judge',1306),false);
console.log('PASS: article 34(9) new independent case includes both first-warning timestamps');
console.log('PASS: historical revision 2, seven other exam items, lessons and keys unchanged');
console.log('PASS: only sanctions module switches to judge:1306; old 1206/1106 remain archived');
console.log('OPEN: real-account Supabase E2E and external referee review');
