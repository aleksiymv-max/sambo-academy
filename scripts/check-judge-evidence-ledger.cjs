'use strict';
/**
 * Evidence ledger for the LIVE judge curriculum. It inventories content, not quality.
 * No review is approved by structural checks, green CI or by this generator.
 * A manual approval is valid only for the exact content hash and seven/five criteria.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');

const sourceFiles=[
 'judge-course-engine.js',
 'judge-program-admission.js','judge-program-admission-v2.js',
 'judge-program-participants.js','judge-program-officials.js',
 'judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js',
 'judge-program-combat.js','judge-program-beach.js',
 'judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js','judge-admission-exam-v3.js',
 'judge-exam-sanctions-v3.js','judge-foundations.js',
 'judge-exam-foundations-v2.js'
];
const ctx={window:{}};vm.createContext(ctx);
for(const file of sourceFiles)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const engine=ctx.window.samboJudgeCourseEngine;
const foundation=ctx.window.samboJudgeFoundations;
const foundationExam=ctx.window.samboJudgeFoundationsExamV2;
assert.ok(engine?.modules?.length>0 && foundation?.lessons?.length>0 && foundationExam?.questions?.length>0,
 'Missing active judge curriculum');
// The published bridge uses the sanctions v3 bank for module 7, while the
// engine deliberately retains v2 for historical results (judge:1206).
// Inventory the SAME active bank as the learner-facing exam (judge:1306).
const sanctionsExam=ctx.window.samboJudgeSanctionsExamV3;
assert.ok(sanctionsExam?.examRevision===3 && sanctionsExam?.progressIndex===1306,
 'Active sanctions v3 exam missing from evidence ledger');
assert.equal(engine.modules[5].examRevision,2,
 'Historical sanctions v2 bank unexpectedly changed');
assert.notEqual(sanctionsExam.questions[6].q,engine.modules[5].questions[6].q,
 'Sanctions v3 correction must not silently revert to historical question 47');
const all=[{title:'Нормативная основа',lessons:foundation.lessons,questions:foundationExam.questions,revision:foundationExam.examRevision},
 ...engine.modules.map((m,i)=>{
  const active=i===5?sanctionsExam:m;
  return {title:active.title,lessons:active.lessons,questions:active.questions,revision:active.examRevision||1};
 })];
const approvals=JSON.parse(fs.readFileSync('docs/judge-evidence-approvals.json','utf8'));
assert.ok(approvals.lessons && approvals.exams,'Missing evidence approval collections');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalize=value=>String(value||'').toLowerCase().replace(/\s+/g,' ').trim();
const criteria={
 lesson:['sequence','normative','pedagogy','case','assessment','accessibility','compatibility'],
 exam:['normative','distractors','independent','explanation','accessibility']
};
// These are validation guards, NOT a substitute for checking the linked source
// and the reviewer. A bare string, a future date or a non-existent document must
// never be sufficient to turn an audit item green.
const officialHosts=new Set([
 'sambo.ru','www.sambo.ru','old.sambo.ru',
 'minsport.gov.ru','www.minsport.gov.ru',
 'publication.pravo.gov.ru','pravo.gov.ru','www.pravo.gov.ru'
]);
function officialSourceUrl(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:' && !url.username && !url.password &&
   officialHosts.has(url.hostname.toLowerCase()) && !url.port && url.pathname.length>1;
 }catch{return false;}
}
function localEditorialEvidenceUrl(value,id,digest,item,readEvidence=path=>fs.readFileSync(path,'utf8')){
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='github.com'||url.port||url.username||url.password||
     url.search||url.hash)return false;
  const match=url.pathname.match(/^\/aleksiymv-max\/sambo-academy\/blob\/(?:main|[a-f0-9]{40})\/(docs\/editorial-[a-z0-9._-]+\.md)$/i);
  if(!match||!fs.existsSync(match[1])||!fs.statSync(match[1]).isFile())return false;
  // An unrelated editorial file is not proof of reviewing THIS item.
  // The document must bind its explicit reviewer, date and official source
  // to the current item id and exact content digest.
  const markers=[...String(readEvidence(match[1])).matchAll(/<!--\s*judge-review-evidence:\s*(\{[^\r\n]*\})\s*-->/g)];
  if(markers.length!==1)return false;
  const evidence=JSON.parse(markers[0][1]);
  return evidence.audit_id===id && evidence.content_sha256===digest &&
    evidence.reviewed_by===item.reviewed_by && evidence.reviewed_at===item.reviewed_at &&
    evidence.source_url===item.source_url;
 }catch{return false;}
}
function validReviewDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00Z');
 return !Number.isNaN(date.valueOf()) &&
  date.toISOString().slice(0,10)===value &&
  value<=new Date().toISOString().slice(0,10);
}
function validReviewer(value){
 return typeof value==='string' && value.trim().length>=3 &&
  !/^(?:ci|bot|automation|system|test|todo|unknown|placeholder)$/i.test(value.trim());
}
function approvalStatusForEntry(kind,id,item,digest,readEvidence){
 if(!item)return 'unreviewed';
 if(item.content_sha256!==digest)return 'stale_content_hash';
 if(!officialSourceUrl(item.source_url)||!localEditorialEvidenceUrl(item.evidence_url,id,digest,item,readEvidence)||
    !validReviewer(item.reviewed_by)||!validReviewDate(item.reviewed_at))return 'incomplete_evidence';
 if(!criteria[kind].every(k=>item.criteria?.[k]===true))return 'incomplete_criteria';
 return 'editorially_reviewed';
}
function approvalStatus(kind,id,digest){
 return approvalStatusForEntry(kind,id,(kind==='lesson'?approvals.lessons:approvals.exams)[id],digest);
}
// A deliberately synthetic fixture checks the validator; it is NOT added to
// docs/judge-evidence-approvals.json and does not approve any real lesson.
const synthetic={
 content_sha256:'a'.repeat(64),
 source_url:'https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf',
 evidence_url:'https://github.com/aleksiymv-max/sambo-academy/blob/main/docs/editorial-article14-2026-10-25.md',
 reviewed_by:'manual-reviewer',reviewed_at:'2026-11-02',
 criteria:Object.fromEntries(criteria.lesson.map(k=>[k,true]))
};
const syntheticId='judge-module-01/lesson-01';
const syntheticEvidence={
 audit_id:syntheticId,content_sha256:synthetic.content_sha256,
 reviewed_by:synthetic.reviewed_by,reviewed_at:synthetic.reviewed_at,
 source_url:synthetic.source_url
};
const syntheticReader=()=>'<'+ '!-- judge-review-evidence: '+JSON.stringify(syntheticEvidence)+' -->';
assert.equal(approvalStatusForEntry('lesson',syntheticId,synthetic,synthetic.content_sha256,syntheticReader),
 'editorially_reviewed');
// The real article-14 document has no marker for module 1, lesson 1.
// Merely linking to an existing editorial note must NOT approve an item.
assert.equal(approvalStatusForEntry('lesson',syntheticId,synthetic,synthetic.content_sha256),
 'incomplete_evidence');
for(const change of [
 {source_url:'https://example.com/fake.pdf'},
 {source_url:'http://sambo.ru/fake.pdf'},
 {evidence_url:'https://github.com/aleksiymv-max/sambo-academy/blob/main/docs/editorial-not-found.md'},
 {evidence_url:'https://example.com/fake-review'},
 {reviewed_at:'2099-01-01'},
 {reviewed_at:'2026-02-30'},
 {reviewed_by:'automation'}
]){
 const invalid={...synthetic,...change};
 assert.equal(approvalStatusForEntry('lesson',syntheticId,invalid,synthetic.content_sha256,syntheticReader),
  'incomplete_evidence','Invalid evidence was accepted: '+JSON.stringify(change));
}
for(const change of [
 {audit_id:'judge-module-02/lesson-01'},
 {content_sha256:'b'.repeat(64)},
 {reviewed_by:'other-reviewer'},
 {reviewed_at:'2026-11-01'},
 {source_url:'https://sambo.ru/other-source.pdf'}
]){
 const invalidEvidence={...syntheticEvidence,...change};
 const reader=()=>'<'+ '!-- judge-review-evidence: '+JSON.stringify(invalidEvidence)+' -->';
 assert.equal(approvalStatusForEntry('lesson',syntheticId,synthetic,synthetic.content_sha256,reader),
  'incomplete_evidence','Evidence marker is not bound to item: '+JSON.stringify(change));
}
assert.equal(approvalStatusForEntry('lesson',syntheticId,
 {...synthetic,criteria:{...synthetic.criteria,case:false}},synthetic.content_sha256,syntheticReader),
 'incomplete_criteria');
assert.equal(approvalStatusForEntry('lesson',syntheticId,synthetic,'b'.repeat(64),syntheticReader),
 'stale_content_hash');
console.log('PASS: evidence approvals require a matching item/hash/reviewer/source marker, reject unrelated documents, fake sources, placeholder reviewers, invalid dates and stale hashes');
// Independence is a course-wide property: an exam question can accidentally
// repeat a self-check from a different module, not just its own module.
const globalSelfCheckOwners=new Map();
for(let mi=0;mi<all.length;mi++){
 const moduleId='judge-module-'+String(mi+1).padStart(2,'0');
 for(let li=0;li<all[mi].lessons.length;li++){
  const id=moduleId+'/lesson-'+String(li+1).padStart(2,'0');
  for(const q of (all[mi].lessons[li].checks||all[mi].lessons[li].questions||[])){
   const key=normalize(Array.isArray(q)?q[0]:q.q);
   if(!key)continue;
   if(!globalSelfCheckOwners.has(key))globalSelfCheckOwners.set(key,[]);
   globalSelfCheckOwners.get(key).push(id);
  }
 }
}
// Automated triage exposes possible pedagogical gaps; it NEVER approves a lesson.
function lessonTriageSignals(l){
 const signals=[],checks=l.checks||l.questions||[];
 if(!String(l.ref||'').trim())signals.push('missing_rule_reference');
 if(!String(l.goal||'').trim())signals.push('missing_learning_goal');
 if(!Array.isArray(l.blocks)||l.blocks.length<5)signals.push('fewer_than_five_explanation_blocks');
 const hasCase=Array.isArray(l.case)&&l.case.length>=3;
 if(!String(l.situation||'').trim()&&!hasCase)signals.push('missing_situational_case');
 if(!String(l.caseAnalysis||'').trim()&&!hasCase)signals.push('missing_case_analysis');
 if(!String(l.decision||'').trim()&&!hasCase)signals.push('missing_case_decision');
 if(!String(l.trap||l.mistake||'').trim())signals.push('missing_typical_error');
 if(checks.length<5)signals.push('fewer_than_five_self_checks');
 for(let i=0;i<checks.length;i++){
  const q=checks[i],choices=Array.isArray(q)?q[1]:q.a;
  if(!Array.isArray(choices)||choices.length<3)signals.push('self_check_'+(i+1)+'_malformed_choices');
  else if(new Set(choices.map(normalize)).size!==choices.length)
   signals.push('self_check_'+(i+1)+'_duplicate_choices');
  if(!String(Array.isArray(q)?q[3]:q.body||'').trim())
   signals.push('self_check_'+(i+1)+'_missing_explanation');
 }
 return signals;
}
function examTriageSignals(q){
 const signals=[],body=String(q.body||'').trim();
 if(new Set(q.a.map(normalize)).size!==q.a.length)signals.push('duplicate_answer_choices');
 if(body.length<120)signals.push('short_explanation_needs_manual_review');
 if(!/(?:стат|ст[.]|прилож|раздел|пункт|правил|приказ)/i.test(body))
  signals.push('no_explicit_normative_locator_in_explanation');
 return signals;
}
const orphanedApprovalIds=(collection,activeIds)=>
 Object.keys(collection).filter(id=>!activeIds.has(id));

const globalExamOwners=new Map();
const examKeys=new Map();
const report={
 generated_at:new Date().toISOString(),
 source:'Published main-branch judge module registry; normative approval requires manual evidence',
 official_rules:'https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf',
 modules:[],lessons:[],exams:[],
 editorial_approval_is_not_professional_certification:true
};
for(let mi=0;mi<all.length;mi++){
 const mod=all[mi],moduleId='judge-module-'+String(mi+1).padStart(2,'0');
 const selfChecks=new Set(mod.lessons.flatMap(l=>(l.checks||l.questions||[]).map(q=>normalize(Array.isArray(q)?q[0]:q.q))));
 report.modules.push({id:moduleId,title:mod.title,lesson_count:mod.lessons.length,exam_count:mod.questions.length,exam_revision:mod.revision});
 for(let li=0;li<mod.lessons.length;li++){
  const l=mod.lessons[li],id=moduleId+'/lesson-'+String(li+1).padStart(2,'0');
  const digest=hash(l);
  report.lessons.push({id,title:l.title||'',reference:l.ref||'NOT_SPECIFIED',
   content_sha256:digest,review_status:approvalStatus('lesson',id,digest),
   editorial_risks:lessonTriageSignals(l)});
 }
 for(let qi=0;qi<mod.questions.length;qi++){
  const q=mod.questions[qi],id=moduleId+'/exam-'+String(qi+1).padStart(3,'0');
  assert.ok(typeof q.q==='string' && Array.isArray(q.a) && Number.isInteger(q.correct) &&
    q.correct>=0 && q.correct<q.a.length,'Invalid active exam mapping: '+id);
  const digest=hash({q:q.q,a:q.a,correct:q.correct,body:q.body,kind:q.kind});
  const questionKey=normalize(q.q);
  examKeys.set(id,questionKey);
  const repeated=selfChecks.has(questionKey);
  const matchingSelfChecks=globalSelfCheckOwners.get(questionKey)||[];
  if(!globalExamOwners.has(questionKey))globalExamOwners.set(questionKey,[]);
  globalExamOwners.get(questionKey).push(id);
  report.exams.push({id,question_sha256:digest,exact_self_check_duplicate:repeated,
   exact_self_check_duplicate_any_module:matchingSelfChecks.length>0,
   matching_self_check_ids:matchingSelfChecks,
   review_status:approvalStatus('exam',id,digest),
   editorial_risks:examTriageSignals(q)});
 }
}
// Fail if the evidence inventory accidentally reverts to the preserved
// sanctions v2 item: a green ledger must describe what students actually see.
const liveSanctionsId='judge-module-07/exam-007';
const liveSanctionsEntry=report.exams.find(e=>e.id===liveSanctionsId);
assert.equal(report.modules[6].exam_revision,3,'Sanctions inventory revision must be v3');
assert.equal(liveSanctionsEntry?.question_sha256,
 hash({q:sanctionsExam.questions[6].q,a:sanctionsExam.questions[6].a,
  correct:sanctionsExam.questions[6].correct,body:sanctionsExam.questions[6].body,
  kind:sanctionsExam.questions[6].kind}),
 'Evidence ledger contains historical sanctions question instead of active v3');
assert.notEqual(liveSanctionsEntry.question_sha256,
 hash({q:engine.modules[5].questions[6].q,a:engine.modules[5].questions[6].a,
  correct:engine.modules[5].questions[6].correct,body:engine.modules[5].questions[6].body,
  kind:engine.modules[5].questions[6].kind}),
 'Evidence ledger incorrectly hashes preserved historical sanctions question');
console.log('PASS: evidence ledger uses published sanctions v3 exam and preserves historical v2');

// Mark every occurrence, including the first, so review inventory is complete.
for(const exam of report.exams){
 const key=examKeys.get(exam.id);
 exam.matching_exam_ids=(globalExamOwners.get(key)||[]).filter(id=>id!==exam.id);
 exam.exact_exam_question_duplicate=exam.matching_exam_ids.length>0;
}
const approved=items=>items.filter(x=>x.review_status==='editorially_reviewed').length;
const orphanedLessonApprovals=orphanedApprovalIds(approvals.lessons,new Set(report.lessons.map(x=>x.id)));
const orphanedExamApprovals=orphanedApprovalIds(approvals.exams,new Set(report.exams.map(x=>x.id)));
assert.deepEqual(orphanedApprovalIds({retired:{}},new Set()),['retired'],
 'Orphaned approvals must be detected');
report.review_priorities=[...report.lessons,...report.exams]
 .filter(x=>x.editorial_risks.length)
 .sort((a,b)=>b.editorial_risks.length-a.editorial_risks.length)
 .slice(0,30)
 .map(x=>({id:x.id,title:x.title||'',signals:x.editorial_risks}));
report.totals={
 modules:report.modules.length,
 lessons:report.lessons.length,
 active_exam_questions:report.exams.length,
 editorially_reviewed_lessons:approved(report.lessons),
 editorially_reviewed_exam_questions:approved(report.exams),
 exact_self_check_duplicates:report.exams.filter(x=>x.exact_self_check_duplicate).length,
 exact_self_check_duplicates_any_module:report.exams.filter(x=>x.exact_self_check_duplicate_any_module).length,
 exact_exam_question_duplicates:report.exams.filter(x=>x.exact_exam_question_duplicate).length,
 stale_lesson_approvals:report.lessons.filter(x=>x.review_status==='stale_content_hash').length,
 stale_exam_approvals:report.exams.filter(x=>x.review_status==='stale_content_hash').length,
 lessons_flagged_for_editorial_triage:report.lessons.filter(x=>x.editorial_risks.length).length,
 exam_questions_flagged_for_editorial_triage:report.exams.filter(x=>x.editorial_risks.length).length,
 exam_questions_with_duplicate_options:report.exams.filter(x=>x.editorial_risks.includes('duplicate_answer_choices')).length,
 orphaned_lesson_approval_ids:orphanedLessonApprovals,
 orphaned_exam_approval_ids:orphanedExamApprovals
};
fs.writeFileSync('judge-review-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log('Judge evidence ledger: '+report.totals.modules+' modules, '+report.totals.lessons+
 ' lessons, '+report.totals.active_exam_questions+' active exam questions');
console.log('Documented per-item editorial reviews: '+report.totals.editorially_reviewed_lessons+
 '/'+report.totals.lessons+' lessons, '+report.totals.editorially_reviewed_exam_questions+
 '/'+report.totals.active_exam_questions+' exam questions');
console.log('Stale approvals: '+report.totals.stale_lesson_approvals+' lessons, '+
 report.totals.stale_exam_approvals+' questions; exact self-check duplicates: '+
 report.totals.exact_self_check_duplicates);
console.log('Course-wide independence: '+report.totals.exact_self_check_duplicates_any_module+
 ' exam/self-check overlaps; '+report.totals.exact_exam_question_duplicates+
 ' exam questions with duplicate wording across the active banks.');
console.log('Editorial triage (not acceptance): '+report.totals.lessons_flagged_for_editorial_triage+
 '/'+report.totals.lessons+' lessons and '+report.totals.exam_questions_flagged_for_editorial_triage+
 '/'+report.totals.active_exam_questions+' questions flagged; duplicate exam options: '+
 report.totals.exam_questions_with_duplicate_options+'.');
console.log('Editorial review queue (up to 12): '+report.review_priorities.slice(0,12)
 .map(x=>x.id+' ['+x.signals.join(', ')+']').join('; '));
console.log('Orphaned approvals (must be reconciled): '+orphanedLessonApprovals.length+
 ' lessons, '+orphanedExamApprovals.length+' questions.');
console.log('NOT READY by evidence ledger unless every item is reviewed; independent referee review and authenticated E2E remain separate gates.');
if(report.totals.exact_self_check_duplicates_any_module ||
   report.totals.exact_exam_question_duplicates ||
   orphanedLessonApprovals.length || orphanedExamApprovals.length)process.exitCode=1;
