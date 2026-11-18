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
// Verify the locator's declared source array, not merely two derived banks.
// Instrument only the sandboxed source string; never modify shipped course code.
const sourceText=fs.readFileSync('judge-foundations.js','utf8');
const exportMarker='window.samboJudgeFoundations=';
assert.equal(sourceText.split(exportMarker).length,2,'Historical export marker changed');
const sourceCtx={window:{}};
vm.createContext(sourceCtx);
vm.runInContext(sourceText.replace(exportMarker,
  'window.__locatorExamApplication=examApplication;'+exportMarker),sourceCtx,
  {filename:'judge-foundations.js (locator source check)'});
const sourceItems=sourceCtx.window.__locatorExamApplication;
assert.ok(Array.isArray(sourceItems)&&sourceItems.length>=12,
  'Expected examApplication source positions are missing');
const locators=[];
for(let display=17;display<=24;display++){
  const index=display-1;
  const sourceIndex=display-13; // examApplication[4..11] follows 12 examBase questions
  const h=historical.questions[index],a=active.questions[index];
  assert.ok(h&&a,'Missing historical/active item '+display);
  const src=sourceItems[sourceIndex];
  assert.ok(src,'Missing source examApplication item '+sourceIndex);
  assert.equal(h.q,src.q,'Source stem locator drift at '+display);
  assert.deepEqual(Array.from(h.a),Array.from(src.a),'Source options locator drift at '+display);
  assert.equal(h.correct,src.correct,'Source answer locator drift at '+display);
  assert.equal(h.body,src.body,'Source explanation locator drift at '+display);
  assert.equal(a.q,h.q,'Stem drift at '+display);
  assert.deepEqual(Array.from(a.a),Array.from(h.a),'Option drift at '+display);
  assert.equal(a.correct,h.correct,'Answer drift at '+display);
  assert.equal(a.body,h.body,'Explanation drift at '+display);
  assert.equal(a.kind,h.kind,'Type drift at '+display);
  // Fail closed on malformed published MCQ structure without asserting normative correctness.
  assert.equal(typeof a.q,'string','Question stem must be text at '+display);
  assert.ok(a.q.trim().length>=20,'Question stem is unexpectedly short at '+display);
  assert.ok(Array.isArray(a.a),'Answer choices must be an array at '+display);
  assert.ok(a.a.length>=3,'Insufficient answer choices at '+display);
  assert.ok(a.a.every(x=>typeof x==='string'&&x.trim()),'Blank choice at '+display);
  assert.equal(new Set(a.a.map(x=>x.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru'))).size,a.a.length,
    'Duplicate normalized answer choices at '+display);
  assert.ok(Number.isInteger(a.correct)&&a.correct>=0&&a.correct<a.a.length,
    'Answer index out of bounds at '+display);
  assert.ok(typeof a.body==='string'&&a.body.trim().length>=20,
    'Missing substantive explanation at '+display);
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
// Reject repeated question stems within the published bank, including non-adjacent items.
// This is a lexical safeguard only: conceptual overlap still needs editorial review.
const normalizeStem=x=>x.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
// Regression fixtures: whitespace and Unicode variants must collide, while distinct stems must not.
assert.equal(normalizeStem('  ПРИЁМ\tв стойке  '),normalizeStem('приём в\nстойке'),
  'Whitespace normalization regression');
assert.equal(normalizeStem('Вопрос\u00a0№\u00a022'),normalizeStem('вопрос № 22'),
  'Non-breaking spaces normalization regression');
assert.equal(normalizeStem('Оценка ２'),normalizeStem('оценка 2'),
  'Unicode NFKC normalization regression');
assert.notEqual(normalizeStem('Оценка 2'),normalizeStem('Оценка 4'),
  'Distinct question stems must remain distinct');
const stems=active.questions.map((q,i)=>{
  assert.equal(typeof q.q,'string','Missing stem at '+(i+1));
  return normalizeStem(q.q);
});
assert.equal(new Set(stems).size,stems.length,
  'Repeated normalized exam stems in active Foundations v2');
// Structural validation of every published question, not just positions 17–24.
assert.equal(normalizeStem('  ВАРИАНТ\tА  '),normalizeStem('вариант а'),
  'Answer-choice whitespace normalization regression');
active.questions.forEach((q,i)=>{
  assert.ok(Array.isArray(q.a)&&q.a.length>=3,
    'Missing or insufficient answer choices at '+(i+1));
  assert.ok(q.a.every(x=>typeof x==='string'&&x.trim()),
    'Blank answer choice at '+(i+1));
  assert.equal(new Set(q.a.map(normalizeStem)).size,q.a.length,
    'Repeated normalized answer choices at '+(i+1));
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.a.length,
    'Invalid answer index at '+(i+1));
  assert.ok(typeof q.body==='string'&&q.body.trim().length>=20,
    'Missing substantive explanation at '+(i+1));
});
assert.equal(new Set(locators.map(x=>[x.bank,x.version,x.progressIndex,x.display,x.source].join('|'))).size,8);
assert.ok(locators.every(x=>x.bank!=='judge-exam-independent.js'),
  'Independent officials exam #22 must never be identified as Foundations #22');
if(process.argv.includes('--json')) process.stdout.write(JSON.stringify(locators,null,2)+'\n');
else console.log('PASS: eight scoped Foundations v2 locators; no retrospective IDs assigned; normative review pending');
