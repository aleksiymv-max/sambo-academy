/* Non-blocking editorial quality report for the judge curriculum.
 * Passing JavaScript tests is not evidence of normative or pedagogical approval.
 * Usage: node scripts/audit-judge-content.cjs
 */
const fs=require('node:fs');
const vm=require('node:vm');
const names=[
 'judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js',
 'judge-program-scoring.js','judge-program-sanctions.js',
 'judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js',
 'judge-program-practicum.js',
 'judge-exam-independent.js'
];
const context={window:{}};vm.createContext(context);
for(const file of ['judge-course-engine.js',...names]){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const modules=context.window.samboJudgeCourseEngine.modules;
const rows=[];
let lessonTotal=0,examTotal=0,duplicateTotal=0,independentTotal=0;
for(const mod of modules){
 const self=mod.lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase()));
 const selfSet=new Set(self);
 const repeated=mod.questions.filter(q=>selfSet.has(q.q.trim().toLowerCase())).length;
 const independent=mod.questions.length-repeated;
 const issues=[];
 for(const l of mod.lessons){
  if(!l.ref?.trim())issues.push('no reference: '+l.title);
  if(!l.goal?.trim()||!l.situation?.trim()||!l.caseAnalysis?.trim()||!l.decision?.trim()||!l.trap?.trim())issues.push('missing lesson element: '+l.title);
  if(l.blocks.length<2)issues.push('few explanation blocks: '+l.title);
  if(l.checks.length<2)issues.push('few self-check questions: '+l.title);
 }
 lessonTotal+=mod.lessons.length;examTotal+=mod.questions.length;
 duplicateTotal+=repeated;independentTotal+=independent;
 rows.push({title:mod.title,lessons:mod.lessons.length,exam:mod.questions.length,repeated,independent,issues});
}
console.log('Judge editorial audit (source text verification NOT performed)');
for(const r of rows){
 console.log('- '+r.title+': '+r.lessons+' lessons, '+r.exam+' exam questions ('+r.repeated+' reused self-check, '+r.independent+' independent), structural issues='+r.issues.length);
 for(const issue of r.issues)console.log('  WARNING '+issue);
}
console.log('TOTAL: '+modules.length+' expanded modules, '+lessonTotal+' lessons, '+examTotal+' exam questions; '+duplicateTotal+' repeated, '+independentTotal+' independent.');

// Audit the ACTIVE versioned banks, not only the preserved historical exam data.
for(const file of ['judge-foundations.js','judge-exam-foundations-v2.js','judge-exam-sanctions-v3.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const foundation=context.window.samboJudgeFoundations;
const foundationActive=context.window.samboJudgeFoundationsExamV2;
const sanctionsActive=context.window.samboJudgeSanctionsExamV3;
if(!foundation||!foundationActive||!sanctionsActive)throw Error('Active versioned exams missing');
const normalized=q=>q.trim().toLowerCase().replace(/\\s+/g,' ');
const foundationChecks=new Set(foundation.lessons.flatMap(l=>l.questions.map(q=>normalized(q[0]))));
const sanctionsChecks=new Set(modules[5].lessons.flatMap(l=>l.checks.map(q=>normalized(q[0]))));
const repeatedFoundation=foundationActive.questions.filter(q=>foundationChecks.has(normalized(q.q))).length;
const repeatedSanctions=sanctionsActive.questions.filter(q=>sanctionsChecks.has(normalized(q.q))).length;
const activeCount=foundationActive.questions.length+examTotal-modules[5].questions.length+sanctionsActive.questions.length;
console.log('ACTIVE: '+activeCount+' exam questions; foundation revision '+foundationActive.examRevision+
 ' (progress '+foundationActive.progressIndex+', repeated '+repeatedFoundation+'); sanctions revision '+
 sanctionsActive.examRevision+' (progress '+sanctionsActive.progressIndex+', repeated '+repeatedSanctions+')');
if(foundationActive.examRevision!==2||foundationActive.progressIndex!==2100||
 sanctionsActive.examRevision!==3||sanctionsActive.progressIndex!==1306||
 foundationActive.questions.length!==24||sanctionsActive.questions.length!==8||
 activeCount!==112||repeatedFoundation||repeatedSanctions){
 console.error('EDITORIAL GAP: active versioned exam is incomplete or repeats self-check');
 process.exitCode=1;
}

if(duplicateTotal)console.log('EDITORIAL GAP: final tests repeat lesson self-checks; add independent scenario questions before treating them as qualifying exams.');
console.log('EDITORIAL GAP: normative point-by-point verification against the uploaded PDF, original illustrations and real-account progress E2E require separate evidence.');
if(modules.length!==11||lessonTotal<50||duplicateTotal!==0||rows.some(r=>r.independent<Math.max(8,r.lessons)))process.exitCode=1;
