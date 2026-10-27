'use strict';
// Narrow, article-by-article editorial regression for independent exam items 17–24.
// Item 22 is checked against the separate VFS 2026 amendment; PDF discrepancy remains documented.
require('./check-exam-admission-participants-2026.cjs');
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const files=[
 'judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
 'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
 'judge-exam-independent.js'
];
const ctx={window:{}};vm.createContext(ctx);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const mods=ctx.window.samboJudgeCourseEngine.modules;
assert.equal(mods.length,11);
assert.equal(mods.reduce((n,m)=>n+m.questions.length,0),88);
assert.ok(mods.every(m=>m.examRevision===2),'Keep historical exam revision');
const qs=Array.from(mods[2].questions);
assert.equal(qs.length,8,'Preserve all eight officials exam items');
const verified=[
 [0,'Судейской тройки в пределах её полномочий',/Статьи 14\(3\).*18\(2\)\(а\).*20\(2\).*Статья 22.*после решения тройки/s],
 [1,'Проверить готовность места, оборудования и персонала',/Статья 15\(1\), 15\(2\)\(а\).*акт приёма места соревнований.*приложение № 11/s],
 [2,'В хронологическом порядке, позволяющем установить последнее действие',/Статья 21\(2\).*по порядку выполнения.*последнюю оценку/s],
 [3,'Привлечь внимание арбитра установленным способом',/Статья 20\(3\).*встаёт.*внимание арбитра.*[Пп]о статье 19\(2\)\(в\)/s],
 [4,'В секретариат соревнований',/Статья 21\(1\).*технический секретарь.*передаёт протокол в секретариат/s],
 [6,'Нет, действуют полномочия арбитра и врача',/Статья 26\(2\)\(е\).*врач.*главному судье.*Статья 22/s],
 [7,'Следовать установленной процедуре судейского решения и рассмотрения спора',/Статьи 14\(3\) и 18\(2\)\(б\).*Статья 41.*Статья 15\(4\)\(б\)/s]
];
for(const [i,answer,explanation] of verified){
 const q=qs[i];
 assert.equal(q.a[q.correct],answer,'Exam key changed at item '+(17+i));
 assert.match(q.body,explanation,'Source-specific explanation missing at item '+(17+i));
}
const reconciled=qs[5];
assert.equal(reconciled.a[reconciled.correct],'Поддержку большинства судейской тройки');
assert.match(reconciled.body,/Статья 19\(6\).*«Изменения в правилах с 01\.09\.2026».*статья 18\(6\).*поддержке хотя бы одного другого судьи.*два голоса из трёх/s,
 'Item 22 must cite the separate official VFS amendment, not infer majority from scoring rules');
assert.match(reconciled.body,/Расхождение формулировок и нумерации.*зафиксировано/s);
// Article 26(4) was previously cited together with 26(3), but the clothing restriction
// was missing from the medical lesson. Protect the newly authored explanation and
// preserve the five original self-checks while adding a sixth.
const medical=mods[2].lessons.find(l=>l.title==='Информатор, контроль формы, врач, администратор');
assert.ok(medical,'Officials medical lesson missing');
const clothing=medical.blocks.find(b=>b[0]==='Ограничение статьи 26(4): одежда при медицинской помощи');
assert.ok(clothing,'Article 26(4) needs its own explanation');
assert.match(clothing[1],/Статья 26\(4\).*«При оказании медицинской помощи, нарушение одежды запрещено»/s);
assert.match(clothing[1],/статья 3\(4\)/i,'Do not misstate emergency medical care');
assert.equal(medical.checks.length,6,'Keep five existing medical-lesson checks and the new sixth');
assert.equal(medical.checks[5][2],0,'New self-check answer mapping changed');
assert.match(medical.checks[5][3],/Статья 26\(4\)/);
const self=new Set(mods[2].lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(qs.every(q=>!self.has(q.q.trim().toLowerCase())),'Exam/self-check independence changed');
console.log('PASS: 8 officials exam explanations and article 26(4) medical clothing caveat; 5 original checks preserved, sixth added; 88 original stems/options/keys protected');
console.log('SOURCE NOTE: item 22 majority requirement appears in separate VFS 2026 amendment, absent from consolidated art.19(6); discrepancy documented');
console.log('NOT VERIFIED: 64 other independent questions before the bout audit, 24 foundation questions, real-account progress E2E');
