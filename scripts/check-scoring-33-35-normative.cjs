'use strict';
// Regression guard for the two revised scoring lessons. Normative source: consolidated Sambo Rules, arts 28, 33, 35, 36, 40.
// This is a structural check, not an official normative or methodological approval.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);
for(const f of ['judge-course-engine.js','judge-program-scoring.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const m=ctx.window.samboJudgeCourseEngine.modules[0];
assert.equal(m.lessons.length,5,'Preserve five progress positions and lesson order');
const expected=['Досрочная чистая победа: пять оснований','Оценка броска: матрица без и с падением'];
const markers=[['Критерий для досрочного преимущества','не менее двух судей','20 секунд','дисквалификация','время окончания'],['полностью отрывает','неудавшемся броске','большинство голосов','зоне безопасности','атакуемый первоначально лежал']];
for(let i=0;i<2;i++){
 const l=m.lessons[i];assert.equal(l.title,expected[i]);assert.ok(l.ref.includes(i===0?'33':'35'));
 assert.ok(l.blocks.length>=9,'Too few explanatory blocks in '+l.title);
 assert.equal(l.checks.length,5,'Require five self-check questions');
 const prose=l.blocks.map(b=>b.join(' ')).join(' ').toLowerCase();
 for(const term of markers[i])assert.ok(prose.includes(term.toLowerCase()),'Missing topic: '+term);
 const seen=new Set();
 for(const q of l.checks){assert.equal(q[1].length,4);assert.ok(Number.isInteger(q[2])&&q[2]>=0&&q[2]<4);assert.ok(q[3].length>=60);assert.ok(!seen.has(q[0]));seen.add(q[0]);}
 for(const key of ['goal','lead','situation','caseAnalysis','decision','trap'])assert.ok(l[key].length>=70,key);
}
console.log('PASS: arts 28/33/35/36/40, scoring lessons 1-2: 9 blocks and 5 self-checks each, stable lesson order');
