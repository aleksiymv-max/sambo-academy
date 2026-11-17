#!/usr/bin/env node
/* Read-only guard: positional locators are scoped to their bank and revision.
 * This does NOT assign retrospective immutable IDs or approve answer keys. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ctx={window:{}};
vm.createContext(ctx);
for(const file of ['judge-foundations.js','judge-exam-foundations-v2.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
}
const historical=ctx.window.samboJudgeFoundations;
const active=ctx.window.samboJudgeFoundationsExamV2;
assert.equal(historical.version,'2026-10-23-1');
assert.equal(historical.progressIndex,1100);
assert.equal(active.version,'2026-10-26-2');
assert.equal(active.progressIndex,2100);
assert.equal(active.questions.length,24);
assert.equal(historical.questions.length,24);
const locators=[];
for(let display=17;display<=24;display++){
  const index=display-1;
  const sourceIndex=display-13; // examApplication[4..11] follows 12 examBase questions
  const h=historical.questions[index],a=active.questions[index];
  assert.ok(h&&a,'Missing historical/active item '+display);
  assert.equal(a.q,h.q,'Stem drift at '+display);
  assert.deepEqual(Array.from(a.a),Array.from(h.a),'Option drift at '+display);
  assert.equal(a.correct,h.correct,'Answer drift at '+display);
  assert.equal(a.body,h.body,'Explanation drift at '+display);
  assert.equal(a.kind,h.kind,'Type drift at '+display);
  locators.push({
    bank:'judge-exam-foundations-v2.js',
    version:active.version,
    progressIndex:active.progressIndex,
    display,
    source:'judge-foundations.js:examApplication['+sourceIndex+']',
    historicalVersion:historical.version,
    historicalProgressIndex:historical.progressIndex
  });
}
assert.equal(new Set(locators.map(x=>[x.bank,x.version,x.progressIndex,x.display,x.source].join('|'))).size,8);
assert.ok(locators.every(x=>x.bank!=='judge-exam-independent.js'),
  'Independent officials exam #22 must never be identified as Foundations #22');
if(process.argv.includes('--json')) process.stdout.write(JSON.stringify(locators,null,2)+'\n');
else console.log('PASS: eight scoped Foundations v2 locators; no retrospective IDs assigned; normative review pending');
