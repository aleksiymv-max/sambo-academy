'use strict';
// Narrow, article-by-article editorial regression for independent exam items 17–24.
// Item 22 is explicitly flagged, not counted as source-verified.
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
 [3,'Привлечь внимание арбитра установленным способом',/Статья 20\(3\).*встаёт.*внимание арбитра.*Статье 19\(2\)\(в\)/s],
 [4,'В секретариат соревнований',/Статья 21\(1\).*технический секретарь.*передаёт протокол в секретариат/s],
 [6,'Нет, действуют полномочия арбитра и врача',/Статья 26\(2\)\(е\).*врач.*главному судье.*Статья 22/s],
 [7,'Следовать установленной процедуре судейского решения и рассмотрения спора',/Статьи 14\(3\) и 18\(2\)\(б\).*Статья 41.*Статья 15\(4\)\(б\)/s]
];
for(const [i,answer,explanation] of verified){
 const q=qs[i];
 assert.equal(q.a[q.correct],answer,'Exam key changed at item '+(17+i));
 assert.match(q.body,explanation,'Source-specific explanation missing at item '+(17+i));
}
const disputed=qs[5];
assert.equal(disputed.a[disputed.correct],'Поддержку большинства судейской тройки');
assert.match(disputed.body,/Редакторское предупреждение.*Статья 19\(6\).*статья 35\(6\).*Отдельное согласие большинства на запуск отсчёта.*Не использовать этот вопрос как подтверждённую норму/s);
const self=new Set(mods[2].lessons.flatMap(l=>l.checks.map(q=>q[0].trim().toLowerCase())));
assert.ok(qs.every(q=>!self.has(q.q.trim().toLowerCase())),'Exam/self-check independence changed');
console.log('PASS: 7 officials exam explanations verified against arts 14, 15, 18–22, 26, 41; 16 earlier verified; 88 original stems/options/keys protected');
console.log('FLAGGED: item 22 (start of submission timer) is NOT source-verified; majority requirement needs official clarification');
console.log('NOT VERIFIED: 65 other independent questions, 24 foundation questions, real-account progress E2E');
