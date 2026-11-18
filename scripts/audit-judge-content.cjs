/* Editorial structure gate for the judge curriculum (source-based approval remains separate).
 * Passing JavaScript tests is not evidence of normative or pedagogical approval.
 * Usage: node scripts/audit-judge-content.cjs
 */
const fs=require('node:fs');
const vm=require('node:vm');
const names=[
 'judge-program-admission.js','judge-program-admission-v2.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js',
 'judge-program-scoring.js','judge-program-sanctions.js',
 'judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js',
 'judge-program-practicum.js',
 'judge-exam-independent.js','judge-admission-exam-v3.js'
];
const context={window:{}};vm.createContext(context);
for(const file of ['judge-course-engine.js',...names]){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const modules=context.window.samboJudgeCourseEngine.modules;
// Normalise layout differences before comparing question stems. This remains a
// lexical guard only: paraphrases require a separate human semantic review.
const normalized=q=>String(q).trim().toLowerCase().replace(/\s+/g,' ');
const rows=[];
let lessonTotal=0,examTotal=0,duplicateTotal=0,independentTotal=0;
for(const mod of modules){
 const self=mod.lessons.flatMap(l=>l.checks.map(q=>normalized(q[0])));
 const selfSet=new Set(self);
 const repeated=mod.questions.filter(q=>selfSet.has(normalized(q.q))).length;
 const independent=mod.questions.length-repeated;
 const issues=[];
 for(const l of mod.lessons){
  if(!l.ref?.trim())issues.push('no reference: '+l.title);
  if(!l.goal?.trim()||!l.situation?.trim()||!l.caseAnalysis?.trim()||!l.decision?.trim()||!l.trap?.trim())issues.push('missing lesson element: '+l.title);
  if(l.blocks.length<6)issues.push('fewer than six explanation blocks ('+l.blocks.length+'): '+l.title);
  if(l.checks.length<5)issues.push('fewer than five self-check questions ('+l.checks.length+'): '+l.title);
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

// Cross-module lexical overlap is advisory until each match has been reviewed.
// This supplements (but does not replace) the existing per-module gate.
const globalSelfChecks=new Map();
for(const mod of modules){
 for(const lesson of mod.lessons){
  for(const check of lesson.checks){
   const stem=normalized(check[0]);
   if(!globalSelfChecks.has(stem))globalSelfChecks.set(stem,new Set());
   globalSelfChecks.get(stem).add(mod.title);
  }
 }
}
const crossModuleMatches=[];
for(const mod of modules){
 for(const q of mod.questions){
  const otherModules=[...(globalSelfChecks.get(normalized(q.q))||[])].filter(title=>title!==mod.title);
  if(otherModules.length)crossModuleMatches.push({examModule:mod.title,stem:q.q,selfCheckModules:otherModules});
 }
}
console.log('CROSS-MODULE lexical exam/self-check overlaps: '+crossModuleMatches.length);
for(const match of crossModuleMatches){
 console.log('  REVIEW '+match.examModule+' vs '+match.selfCheckModules.join(', ')+': '+match.stem);
}
// Report identical exam stems across expanded modules. This is advisory until
// reviewers decide whether contexts legitimately differ; no answer keys change.
const expandedExamStems=new Map();
for(const mod of modules){
 for(const question of mod.questions){
  const stem=normalized(question.q);
  if(!expandedExamStems.has(stem))expandedExamStems.set(stem,[]);
  expandedExamStems.get(stem).push(mod.title);
 }
}
// A repeated stem inside one module is a separate defect, not a cross-module match.
const isCrossModuleDuplicate=titles=>new Set(titles).size>1;
// Regression: same-module repetition must not inflate the cross-module counter.
if(isCrossModuleDuplicate(['Module A','Module A']) ||
   !isCrossModuleDuplicate(['Module A','Module B'])){
 throw Error('Cross-module duplicate classifier regression');
}
const repeatedExamStems=[...expandedExamStems.entries()]
 .filter(([,titles])=>isCrossModuleDuplicate(titles));
console.log('CROSS-MODULE duplicate expanded exam stems: '+repeatedExamStems.length);
for(const [stem,titles] of repeatedExamStems){
 console.log('  REVIEW '+titles.join(' / ')+': '+stem);
}

// Semantic paraphrases still require expert review; no exam IDs or keys change.

// Audit the ACTIVE versioned banks, not only the preserved historical exam data.
for(const file of ['judge-foundations.js','judge-exam-foundations-v2.js','judge-exam-sanctions-v3.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const admission=context.window.samboJudgeCourseEngine.modules[0];
if(!context.window.samboJudgeAdmissionV2Loaded || !context.window.samboJudgeAdmissionExamV3Loaded ||
   admission.lessons.length!==7 || admission.questions.length!==24 || admission.examRevision!==3) {
 console.error('EDITORIAL GAP: admissions revision 2 / independent exam revision 3 absent');
 process.exitCode=1;
}
const foundation=context.window.samboJudgeFoundations;
const foundationActive=context.window.samboJudgeFoundationsExamV2;
const sanctionsActive=context.window.samboJudgeSanctionsExamV3;
if(!foundation||!foundationActive||!sanctionsActive)throw Error('Active versioned exams missing');
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
 activeCount!==128||repeatedFoundation||repeatedSanctions){
 console.error('EDITORIAL GAP: active versioned exam is incomplete or repeats self-check');
 process.exitCode=1;
}

// Keep the approved editorial standard's *published inventory* in sync with the
// live module registry. This is a documentation-consistency check, not approval.
const publishedModules=modules.length+1;
const publishedLessons=lessonTotal+foundation.lessons.length;
const standardInventory='В интерфейсе сейчас '+publishedModules+' судейских модулей: '+
 publishedLessons+' урока ('+foundation.lessons.length+' базовых и '+lessonTotal+
 ' расширенных) и '+activeCount+' действующих экзаменационных заданий.';
const editorialStandard=fs.readFileSync('docs/judge-editorial-standard.md','utf8');
if(!editorialStandard.includes(standardInventory)){
 console.error('EDITORIAL GAP: editorial standard inventory is stale; expected: '+standardInventory);
 process.exitCode=1;
}else{
 console.log('PASS: published editorial standard inventory matches active modules, lessons and exams');
}

if(duplicateTotal)console.log('EDITORIAL GAP: final tests repeat lesson self-checks; add independent scenario questions before treating them as qualifying exams.');
console.log('EDITORIAL GAP: normative point-by-point verification against the uploaded PDF, original illustrations and real-account progress E2E require separate evidence.');
if(modules.length!==11||lessonTotal!==56||duplicateTotal!==0||rows.some(r=>r.issues.length>0||r.independent<Math.max(8,r.lessons)))process.exitCode=1;
