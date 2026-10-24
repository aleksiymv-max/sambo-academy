'use strict';
// Article 12–13 safety regression; official legal and referee approval remain separate.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js'])
 vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mod=ctx.window.samboJudgeCourseEngine.modules[1];
assert.deepEqual(Array.from(mod.lessons,l=>l.title),[
 'Обязанности спортсмена',
 'Права спортсмена: информация, обращение и медицинская помощь',
 'Экипировка спортивного самбо',
 'Представитель команды и тренер',
 'Официальные лица и безопасность'
],'Preserve lesson order and progress identifiers');
const l=mod.lessons[4];
assert.ok(l.blocks.length>=10,'Ten explanatory blocks required');
assert.ok(l.checks.length>=7,'Seven self-checks required');
const body=[l.ref,l.goal,l.lead,...l.blocks.flat(),l.situation,l.caseAnalysis,l.decision,l.trap].join(' ').toLowerCase();
for(const token of [
 'статья 12','статья 13','статья 15(2)(а)','статья 15(3)(а)',
 'статья 42(1)','статья 42(4)','статья 43(10)','№ 353',
 '11×11','14×14','не менее 5 см','пригодность ковра: совместная проверка',
 'акт приёма','зрителей','учебный алгоритм','не выдумывайте'
])assert.ok(body.includes(token),'Missing normative requirement or caution: '+token);
assert.ok(l.situation.length>350&&l.caseAnalysis.length>420&&l.decision.length>520&&l.trap.length>250,
 'Detailed case, analysis, decision and trap required');
const original=[
 ['Кто относится к официальным лицам по статье 12?',0],
 ['На какой акт о безопасности ссылается статья 13?',0]
];
const seen=new Set();
for(const [i,q] of l.checks.entries()){
 assert.equal(q[1].length,4,'Four options per question');
 assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4,'Valid answer index');
 assert.ok(!seen.has(q[0]),'Duplicate question');
 if(i<original.length){
  assert.equal(q[0],original[i][0],'Original question preserved');
  assert.equal(q[2],original[i][1],'Original answer key preserved');
 }else assert.ok(q[3].length>=140,'New answers require substantive explanation');
 seen.add(q[0]);
}
for(const file of [
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
assert.equal(mod.questions.length,8,'Independent participant exam remains eight questions');
assert.equal(ctx.window.samboJudgeCourseEngine.modules.length,11,'All expanded modules remain');
const independent=new Set(mod.questions.map(q=>q.q.trim().toLowerCase()));
assert.equal([...seen].filter(q=>independent.has(q.trim().toLowerCase())).length,0,
 'Independent exam must not reuse self-check questions');
console.log('PASS: articles 12–13, 15, 42, 43; ten blocks, seven checks, original keys and independent exam preserved');
