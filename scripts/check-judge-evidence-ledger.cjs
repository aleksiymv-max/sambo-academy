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
const all=[{title:'Нормативная основа',lessons:foundation.lessons,questions:foundationExam.questions,revision:foundationExam.examRevision},
 ...engine.modules.map(m=>({title:m.title,lessons:m.lessons,questions:m.questions,revision:m.examRevision||1}))];
const approvals=JSON.parse(fs.readFileSync('docs/judge-evidence-approvals.json','utf8'));
assert.ok(approvals.lessons && approvals.exams,'Missing evidence approval collections');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const normalize=value=>String(value||'').toLowerCase().replace(/\s+/g,' ').trim();
const criteria={
 lesson:['sequence','normative','pedagogy','case','assessment','accessibility','compatibility'],
 exam:['normative','distractors','independent','explanation','accessibility']
};
function approvalStatus(kind,id,digest){
 const item=(kind==='lesson'?approvals.lessons:approvals.exams)[id];
 if(!item)return 'unreviewed';
 if(item.content_sha256!==digest)return 'stale_content_hash';
 if(!item.source_url||!item.reviewed_by||!item.reviewed_at||!item.evidence_url)return 'incomplete_evidence';
 if(!criteria[kind].every(k=>item.criteria?.[k]===true))return 'incomplete_criteria';
 return 'editorially_reviewed';
}
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
const globalExamOwners=new Map();
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
   content_sha256:digest,review_status:approvalStatus('lesson',id,digest)});
 }
 for(let qi=0;qi<mod.questions.length;qi++){
  const q=mod.questions[qi],id=moduleId+'/exam-'+String(qi+1).padStart(3,'0');
  assert.ok(typeof q.q==='string' && Array.isArray(q.a) && Number.isInteger(q.correct) &&
    q.correct>=0 && q.correct<q.a.length,'Invalid active exam mapping: '+id);
  const digest=hash({q:q.q,a:q.a,correct:q.correct,body:q.body,kind:q.kind});
  const questionKey=normalize(q.q);
  const repeated=selfChecks.has(questionKey);
  const matchingSelfChecks=globalSelfCheckOwners.get(questionKey)||[];
  if(!globalExamOwners.has(questionKey))globalExamOwners.set(questionKey,[]);
  globalExamOwners.get(questionKey).push(id);
  report.exams.push({id,question_sha256:digest,exact_self_check_duplicate:repeated,
   exact_self_check_duplicate_any_module:matchingSelfChecks.length>0,
   matching_self_check_ids:matchingSelfChecks,
   review_status:approvalStatus('exam',id,digest)});
 }
}
// Mark every occurrence, including the first, so review inventory is complete.
for(const exam of report.exams){
 const key=normalize(all[Number(exam.id.slice(13,15))-1]?.questions[
  Number(exam.id.slice(-3))-1]?.q);
 exam.matching_exam_ids=(globalExamOwners.get(key)||[]).filter(id=>id!==exam.id);
 exam.exact_exam_question_duplicate=exam.matching_exam_ids.length>0;
}
const approved=items=>items.filter(x=>x.review_status==='editorially_reviewed').length;
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
 stale_exam_approvals:report.exams.filter(x=>x.review_status==='stale_content_hash').length
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
console.log('NOT READY by evidence ledger unless every item is reviewed; independent referee review and authenticated E2E remain separate gates.');
if(report.totals.exact_self_check_duplicates_any_module ||
   report.totals.exact_exam_question_duplicates)process.exitCode=1;
