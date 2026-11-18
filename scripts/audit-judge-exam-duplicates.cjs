#!/usr/bin/env node
/* Read-only lexical duplicate inventory. Does not approve normative correctness.
 * Run: node scripts/audit-judge-exam-duplicates.cjs
 * Exit 2 indicates exact duplicate exam stems across distinct modules.
 */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [
  'judge-course-engine.js',
  'judge-program-admission.js', 'judge-program-admission-v2.js',
  'judge-program-participants.js', 'judge-program-officials.js',
  'judge-program-bout.js', 'judge-program-scoring.js',
  'judge-program-sanctions.js', 'judge-program-infrastructure.js',
  'judge-program-combat.js', 'judge-program-beach.js',
  'judge-program-demo.js', 'judge-program-practicum.js',
  'judge-exam-independent.js', 'judge-admission-exam-v3.js',
  'judge-foundations.js', 'judge-exam-foundations-v2.js',
  'judge-exam-sanctions-v3.js'
];
function normalize(stem) {
  return String(stem || '').normalize('NFKC').toLocaleLowerCase('ru')
    .replace(/\s+/g, ' ').trim();
}
function duplicates(banks) {
  const seen = new Map();
  for (const bank of banks) {
    for (const [index, q] of bank.questions.entries()) {
      const stem = normalize(q.q);
      if (!stem) throw new Error('Empty exam stem in ' + bank.id + ' #' + (index + 1));
      if (!seen.has(stem)) seen.set(stem, []);
      seen.get(stem).push({bank: bank.id, index: index + 1});
    }
  }
  return [...seen.values()].filter(group => new Set(group.map(x => x.bank)).size > 1);
}
function assertFixtures() {
  const q = stem => ({q:stem});
  if (duplicates([{id:'a',questions:[q('Same'),q('same')] }]).length !== 0)
    throw new Error('Intra-module repetition must not be called cross-module');
  if (duplicates([{id:'a',questions:[q('  Оценка  ') ]},{id:'b',questions:[q('оценка')]}]).length !== 1)
    throw new Error('Cross-module normalized repetition was missed');
  if (duplicates([{id:'a',questions:[q('A')]},{id:'b',questions:[q('B')]}]).length !== 0)
    throw new Error('False positive for different stems');
}
assertFixtures();
const ctx = {window:{}};
vm.createContext(ctx);
for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, {filename:file});
}
const modules = ctx.window.samboJudgeCourseEngine.modules;
const foundation = ctx.window.samboJudgeFoundationsExamV2;
const sanctions = ctx.window.samboJudgeSanctionsExamV3;
if (!modules || !foundation || !sanctions) throw new Error('Active curriculum unavailable');
const banks = modules.map((mod, index) => ({
  id:'expanded-' + (index + 1), questions: index === 5 ? sanctions.questions : mod.questions
}));
banks.push({id:'foundations-v2',questions:foundation.questions});
const hits = duplicates(banks);
console.log('Active judge exam banks:', banks.length,
  'questions:', banks.reduce((n,b)=>n+b.questions.length,0));
console.log('Exact cross-module lexical duplicates:', hits.length);
for (const hit of hits) console.log('REVIEW:', hit.map(x=>x.bank+'#'+x.index).join(' / '));
console.log('This does not detect semantic paraphrases or verify legal correctness.');
if (hits.length) process.exitCode = 2;
