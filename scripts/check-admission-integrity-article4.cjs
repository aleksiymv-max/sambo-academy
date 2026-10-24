'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['judge-course-engine.js','judge-program-admission.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.deepEqual(Array.from(mod.lessons,x=>x.title),['Антидопинг и медицинское обеспечение','Противоправное влияние на результаты','Возрастные группы и весовые категории','Взвешивание участников: процедура и фиксация','Сквозной алгоритм допуска']);
const l=mod.lessons[1];
assert.ok(l.blocks.length>=9&&l.checks.length>=5,'Article 4 editorial depth');
const body=[l.ref,l.lead,l.blocks.flat().join(' '),l.situation,l.caseAnalysis,l.decision,l.trap].join(' ').toLowerCase();
for(const t of ['статья 4','329-фз','26.2','пункт 3','пари','букмекерских','тотализаторах','протест','статья 41','учебный алгоритм','подтверждённым фактам'])
 assert.ok(body.includes(t.toLowerCase()),'Missing normative topic '+t);
for(const f of ['situation','caseAnalysis','decision'])assert.ok(l[f].length>=200,'Case '+f);
assert.ok(l.trap.length>=100,'Case error');
for(const q of l.checks){assert.equal(q[1].length,4);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);assert.ok(q[3].length>=100,'Explanation required');}
assert.equal(new Set(l.checks.map(q=>q[0])).size,l.checks.length);
for(const f of ['judge-program-participants.js','judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js','judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js','judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js','judge-exam-independent.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
assert.equal(mod.questions.length,8,'Independent exam unchanged');
console.log('PASS: article 4 and law 329-FZ article 26.2(4)(3), protests, five checks, preserved lesson positions and exam');
