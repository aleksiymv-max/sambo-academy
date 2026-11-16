#!/usr/bin/env node
/* Non-destructive guard for the Foundations v2 historical exam mapping.
 * This validates identity/compatibility only, NOT normative correctness. */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root={window:{}};
vm.createContext(root);
for(const filename of ['judge-foundations.js','judge-exam-foundations-v2.js']){
  vm.runInContext(fs.readFileSync(filename,'utf8'),root,{filename});
}
const old=root.window.samboJudgeFoundations;
const current=root.window.samboJudgeFoundationsExamV2;
assert.equal(old.progressIndex,1100,'Historical progress index changed');
assert.equal(old.version,'2026-10-23-1','Historical exam version changed');
assert.equal(current.progressIndex,2100,'Current progress index changed');
assert.equal(current.version,'2026-10-26-2','Current exam version changed');
assert.equal(current.examRevision,2,'Current revision changed');
assert.equal(old.questions.length,24,'Historical bank size changed');
assert.equal(current.questions.length,24,'Current bank size changed');
const expected=[
  ['Личные',1],['лично-команд',2],['подгрупп',0],['жереб',0],
  ['восемь',1],['шесть',1],['семь',1],['Положен',1]
];
// Protect the entire retained historical tail (13–24), not just 17–24.
for(let i=12;i<24;i++){
  const display=i+1;
  const source=old.questions[i];
  const active=current.questions[i];
  // Structural integrity is checked independently of the historical comparison:
  // changing both banks together must not make malformed questions pass.
  assert.equal(typeof active.q,'string','Question '+display+' missing stem');
  assert.ok(active.q.trim().length>=20,'Question '+display+' stem too short');
  assert.ok(Array.isArray(active.a)&&active.a.length>=3,'Question '+display+' missing distractors');
  assert.ok(active.a.every(a=>typeof a==='string'&&a.trim().length>0),'Question '+display+' empty option');
  assert.equal(new Set(active.a.map(a=>a.trim().toLowerCase())).size,active.a.length,'Question '+display+' duplicate options');
  assert.ok(Number.isInteger(active.correct)&&active.correct>=0&&active.correct<active.a.length,'Question '+display+' invalid answer index');
  assert.equal(active.q,source.q,'Question '+display+' source mapping changed');
  assert.deepEqual(Array.from(active.a),Array.from(source.a),'Question '+display+' options changed');
  assert.equal(active.correct,source.correct,'Question '+display+' key changed');
  assert.equal(active.body,source.body,'Question '+display+' explanation changed');
  assert.equal(active.kind,source.kind,'Question '+display+' type changed');
  if(i>=16){
    assert.equal(active.correct,expected[i-16][1],'Question '+display+' historical answer index drift');
  }
}
console.log('Foundations v2: historical indices 13–24, keys, options, explanations, types, versions and progress indices preserved; normative acceptance NOT asserted');
