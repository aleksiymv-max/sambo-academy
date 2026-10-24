'use strict';
// Structural editorial regression; not a substitute for independent normative acceptance.
// Sources: official consolidated Sambo Rules art.19(7) and VFS Sept 2026 clarifications p.2.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['judge-course-engine.js','judge-program-bout.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const mod=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(mod.lessons.length,7,'Do not alter progress positions');
const l=mod.lessons[6];assert.equal(l.title,'Определение активности в середине встречи');
assert.ok(l.ref.includes('19'));assert.ok(l.blocks.length>=10);assert.equal(l.checks.length,5);
for(const key of ['goal','lead','situation','caseAnalysis','decision','trap'])assert.ok(String(l[key]||'').length>=50,key);
const prose=l.blocks.map(b=>b.join(' ')).join(' ').toLowerCase();
for(const token of ['одинаковое количество','большинство судейской тройки','«а»','не является наказанием','техническая оценка или предупреждение','болевой приём','удержание','сводный pdf'])assert.ok(prose.includes(token),'Missing concept: '+token);
const seen=new Set();
for(const q of l.checks){assert.equal(q[1].length,4);assert.ok(q[2]>=0&&q[2]<4);assert.ok(q[3].length>=50);assert.ok(!seen.has(q[0]));seen.add(q[0]);}
assert.ok(fs.readFileSync('judge-exam-independent.js','utf8').includes('ему записывается оценка «Активность»'));
console.log('PASS: art.19(7) activity lesson; 10 blocks, 5 questions, seven stable lessons');
