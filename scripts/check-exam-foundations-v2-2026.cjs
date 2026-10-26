'use strict';
// Independent foundation exam revision 2; old judge:1100 and judge:100 remain readable.
require('./check-exam-foundations-17-24-2026.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
const paths=[
 'judge-foundations.js','judge-exam-foundations-v2.js','judge-course-engine.js',
 'judge-program-admission.js','judge-program-participants.js','judge-program-officials.js',
 'judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js',
 'judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js',
 'judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js',
 'judge-exam-sanctions-v3.js'
];
for(const p of paths)vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
const old=ctx.window.samboJudgeFoundations,active=ctx.window.samboJudgeFoundationsExamV2;
assert.equal(old.progressIndex,1100);
assert.equal(old.version,'2026-10-23-1');
assert.equal(active.progressIndex,2100);
assert.equal(active.examRevision,2);
assert.equal(active.questions.length,24);
assert.equal(active.lessons,old.lessons,'All six lessons and self-checks must remain unchanged');
assert.equal(old.questions.length,24);
const norm=q=>q.trim().toLowerCase().replace(/\\s+/g,' ');
const self=new Set(old.lessons.flatMap(l=>l.questions.map(q=>norm(q[0]))));
const historical=new Set(old.questions.map(q=>norm(q.q)));
const fresh=new Set();
for(let i=0;i<12;i++){
 const q=active.questions[i];
 assert.equal(q.kind,'Судейская ситуация');
 assert.ok(!self.has(norm(q.q)),'New exam duplicates lesson self-check '+(i+1));
 assert.ok(!historical.has(norm(q.q)),'New exam duplicates historical exam '+(i+1));
 assert.ok(!fresh.has(norm(q.q)),'Duplicate new exam question '+(i+1));
 fresh.add(norm(q.q));
 assert.equal(q.a.length,4);
 assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
 assert.ok(q.body.length>=260,'Incomplete decision explanation '+(i+1));
 assert.match(q.body,/Норма:/);
 assert.match(q.body,/Вывод:/);
 assert.match(q.body,/(статья|приложение)/i);
}
for(let i=12;i<24;i++)assert.equal(active.questions[i],old.questions[i],'Historical application item changed '+(i+1));
const expectedRefs=[
 'приложение 1, пункт 1','статья 2, пункт 4','статья 1, пункты 1–2',
 'статья 1, пункт 4','статья 1, пункт 2','статья 2, пункт 1',
 'статья 2, пункт 2(д)','статья 2, пункт 5','приложение 2, раздел I, пункт 1',
 'статья 2(2)(в)','приложение 1, пункт 3','приложение 1, пункт 4'
];
for(let i=0;i<12;i++)assert.ok(active.questions[i].body.toLowerCase().includes(expectedRefs[i].toLowerCase()),'Source missing '+(i+1));
const groups=[{title:old.title,parts:old.lessons.map(l=>({title:l.title})),premiumFoundations:true,progressIndex:1100},
 ...ctx.window.samboJudgeCourseEngine.modules.map(m=>({title:m.title,parts:m.lessons}))];
const bridge={
 window:ctx.window,
 samboModuleData:key=>key==='judge'?groups.map(g=>({...g})):[],
 samboQuizQuestions:()=>[],
 samboLessonSections:g=>g.premiumFoundations?[{title:'intro',html:'intro'},{title:'exam',quiz:true,html:'Итоговый тест: 24 вопросов'}]:[]
};
vm.createContext(bridge);
vm.runInContext(fs.readFileSync('judge-program-bridge.js','utf8'),bridge);
const routed=bridge.samboModuleData('judge');
assert.equal(routed.length,12);
assert.equal(routed[0].progressIndex,2100);
assert.equal(routed[0].examRevision,2);
assert.equal(bridge.samboQuizQuestions(routed[0]),active.questions);
assert.match(bridge.samboLessonSections(routed[0]).at(-1).html,/Редакция экзамена: 2/);
assert.equal(routed[6].progressIndex,1306,'Sanctions revision 3 must stay active');
const store=new Map();
const progress={window:{},localStorage:{
 getItem:key=>store.get(key)||null,
 setItem:(key,val)=>store.set(key,String(val)),
 removeItem:key=>store.delete(key)
},renderStudentDashboard(){},authMessage(){}};
vm.createContext(progress);
vm.runInContext(fs.readFileSync('progress.js','utf8'),progress);
progress.progressKey=progress.window.progressKey;
const w=progress.window;
assert.deepEqual(Array.from(w.samboJudgeHistoricalIndices(2100)),[1100,100]);
assert.deepEqual(Array.from(w.samboJudgeHistoricalIndices(1100)),[100]);
store.set('sambo-demo-judge-1100','done');
store.set('sambo-demo-judge-100','done');
assert.deepEqual(Array.from(w.samboJudgeHistoricalCompletions(2100)),[1100,100]);
assert.equal(w.progressDone('judge',2100),false,'Old pass must not count as current pass');
w.samboProgress.userId='account-A';
w.samboProgress.completed=new Set(['judge:1100']);
assert.deepEqual(Array.from(w.samboJudgeHistoricalCompletions(2100)),[1100]);
w.samboProgress.userId='account-B';
w.samboProgress.completed=new Set();
assert.deepEqual(Array.from(w.samboJudgeHistoricalCompletions(2100)),[],'Account isolation failed');
assert.equal(w.progressDone('judge',2100),false);
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.indexOf('judge-foundations.js')<html.indexOf('judge-exam-foundations-v2.js'));
assert.ok(html.indexOf('judge-exam-foundations-v2.js')<html.indexOf('judge-program-bridge.js'));
console.log('PASS: 12 independent, source-checked scenarios; 12 other exam questions untouched');
console.log('PASS: historical exam, self-checks and original keys unchanged');
console.log('PASS: active foundation result judge:2100 does not inherit judge:1100/100');
console.log('LIMITATION: Supabase real-account E2E and independent referee review remain open');
