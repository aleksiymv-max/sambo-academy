/* Prevent stale progress-index documentation from misrepresenting active judge exams.
 * This is a metadata regression, not a normative or authenticated E2E approval.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const moduleFiles=[
 'judge-program-admission.js','judge-program-admission-v2.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js',
 'judge-program-scoring.js','judge-program-sanctions.js',
 'judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js',
 'judge-program-practicum.js'
];
const context={
 window:{},
 samboModuleData:key=>key==='judge'
  ?[{title:context.window.samboJudgeFoundations.title},...Array.from({length:11},()=>({}))]
  :[],
 samboQuizQuestions:()=>[],
 samboLessonSections:()=>[]
};
vm.createContext(context);
for(const file of [
 'judge-course-engine.js',...moduleFiles,'judge-foundations.js',
 'judge-exam-foundations-v2.js','judge-exam-independent.js','judge-admission-exam-v3.js',
 'judge-exam-sanctions-v3.js',
 'progress.js','judge-program-bridge.js'
]){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const groups=context.samboModuleData('judge');
assert.equal(groups.length,12,'Judge course module count changed');
const doc=fs.readFileSync('docs/judge-progress-stage.md','utf8');
const lines=doc.split(/\r?\n/);
const rows=lines.filter(line=>/^\|\s*\d+\s*\|/.test(line));
assert.equal(rows.length,groups.length,'Progress map must list each active judge module exactly once');
const active=new Set();
for(let i=0;i<groups.length;i++){
 const match=rows[i].match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*`judge:(\d+)`\s*\|\s*([^|]+?)\s*\|\s*$/);
 assert.ok(match,'Invalid documentation row '+(i+1)+': '+rows[i]);
 assert.equal(Number(match[1]),i+1,'Module order drift');
 assert.equal(match[2].trim(),groups[i].title,'Module title drift at '+(i+1));
 const index=groups[i].progressIndex;
 assert.equal(Number(match[3]),index,'Active progress index drift at '+(i+1));
 assert.ok(!active.has(index),'Duplicate active index '+index);
 active.add(index);
 const expected=context.window.samboJudgeHistoricalIndices(index);
 const actual=[...match[4].matchAll(/`judge:(\d+)`/g)].map(x=>Number(x[1]));
 assert.deepEqual(actual,Array.from(expected),'Historical index drift at '+(i+1));
 for(const old of expected)assert.ok(!active.has(old),'Archived index collides with active: '+old);
}
assert.ok(doc.includes('авторизованное E2E не выполнено'),'Do not imply real-account E2E passed');
assert.ok(doc.includes('не являются официальной судейской аттестацией'),'Do not imply official certification');
console.log('PASS: 12 documented active judge exam indices match live course routing');
console.log('PASS: archived indices match progress.js and remain distinct');
console.log('OPEN: real-account Supabase E2E and normative acceptance remain unverified');
