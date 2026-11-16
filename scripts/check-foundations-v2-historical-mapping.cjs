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
assert.equal(current.progressIndex,2100,'Current progress index changed');
assert.equal(current.version,'2026-10-26-2','Current exam version changed');
assert.equal(current.examRevision,2,'Current revision changed');
assert.equal(old.questions.length,24,'Historical bank size changed');
assert.equal(current.questions.length,24,'Current bank size changed');
const expected=[
  ['Личные',1],['лично-команд',2],['подгрупп',0],['жереб',0],
  ['восемь',1],['шесть',1],['семь',1],['Положен',1]
];
for(let i=0;i<8;i++){
  const display=17+i;
  const source=old.questions[16+i];
  const active=current.questions[16+i];
  assert.equal(active.q,source.q,'Question '+display+' source mapping changed');
  assert.deepEqual(Array.from(active.a),Array.from(source.a),'Question '+display+' options changed');
  assert.equal(active.correct,source.correct,'Question '+display+' key changed');
  assert.equal(active.correct,expected[i][1],'Question '+display+' historical answer index drift');
  assert.match(active.q,new RegExp(expected[i][0],'i'),'Question '+display+' topic mapping changed');
}
assert.notEqual(current.questions[21].q,root.window.samboJudgeIndependentExam?.questions?.[21]?.q,
  'Distinct exam #22 records were conflated');
console.log('Foundations v2: historical indices 17–24, keys, options, versions and progress indices preserved; normative acceptance NOT asserted');
