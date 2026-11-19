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
  const bankIds = new Set();
  for (const bank of banks) {
    if (!bank.id || bankIds.has(bank.id)) throw new Error('Missing or duplicate exam bank ID: ' + bank.id);
    bankIds.add(bank.id);
  }
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
function withinBankDuplicates(banks) {
  const hits = [];
  for (const bank of banks) {
    const seen = new Map();
    for (const [index, question] of bank.questions.entries()) {
      const stem = normalize(question.q);
      if (seen.has(stem)) hits.push({bank:bank.id, first:seen.get(stem), second:index + 1});
      else seen.set(stem, index + 1);
    }
  }
  return hits;
}

// Answer-option collisions are editorial blockers for unambiguous multiple-choice
// items. This reports evidence only; it never rewrites historical answer keys.
function duplicateOptions(banks) {
  const hits = [];
  for (const bank of banks) {
    for (const [index, question] of bank.questions.entries()) {
      const options = question.options || question.answers;
      if (!Array.isArray(options)) continue;
      const seen = new Map();
      for (const [optionIndex, option] of options.entries()) {
        const label = normalize(typeof option === 'string' ? option : option?.text);
        if (!label) continue;
        if (seen.has(label)) hits.push({bank:bank.id, question:index+1,
          first:seen.get(label), second:optionIndex+1});
        else seen.set(label, optionIndex+1);
      }
    }
  }
  return hits;
}

function assertFixtures() {
  const q = stem => ({q:stem});
  if (duplicates([{id:'a',questions:[q('Same'),q('same')] }]).length !== 0)
    throw new Error('Intra-module repetition must not be called cross-module');
  if (duplicates([{id:'a',questions:[q('  Оценка  ') ]},{id:'b',questions:[q('оценка')]}]).length !== 1)
    throw new Error('Cross-module normalized repetition was missed');
  if (duplicates([{id:'a',questions:[q('A')]},{id:'b',questions:[q('B')]}]).length !== 0)
    throw new Error('False positive for different stems');
  if (withinBankDuplicates([{id:'a',questions:[q(' Same '),q('same')]}]).length !== 1)
    throw new Error('Intra-bank lexical repetition must be reported');
  if (withinBankDuplicates([{id:'a',questions:[q('A'),q('B')]}]).length !== 0)
    throw new Error('Distinct intra-bank questions must not be flagged');
  if (duplicateOptions([{id:'a',questions:[{q:'Q',options:[' Да ', 'да']}]}]).length !== 1)
    throw new Error('Duplicate answer options must be reported');
  if (duplicateOptions([{id:'a',questions:[{q:'Q',options:['Да', 'Нет']}]}]).length !== 0)
    throw new Error('Distinct answer options must not be flagged');
  // Distinct bank IDs are required: otherwise a real cross-bank repeat is hidden.
  let rejected = false;
  try { duplicates([{id:'a',questions:[q('Same')]},{id:'a',questions:[q('Same')]}]); }
  catch (error) { rejected = /duplicate exam bank ID/.test(error.message); }
  if (!rejected) throw new Error('Duplicate bank IDs must fail closed');
}
assertFixtures();
// A fixture-only mode lets CI exercise the classifier without claiming that
// the production exam banks or their normative keys were reviewed.
if (process.argv.includes('--self-test')) {
  console.log('Duplicate classifier: 8 synthetic fixtures passed');
  process.exit(0);
}
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
const questionCount = banks.reduce((n, b) => n + b.questions.length, 0);
// Fail closed if a loader or active bank silently disappears. Update these
// baselines only alongside an explicitly reviewed exam-bank revision.
if (banks.length !== 12 || questionCount !== 128) {
  throw new Error('Active exam inventory changed: banks=' + banks.length +
    ', questions=' + questionCount + ' (expected 12/128); review bank versions');
}
const hits = duplicates(banks);
const internalHits = withinBankDuplicates(banks);
const optionHits = duplicateOptions(banks);
console.log('Active judge exam banks:', banks.length,
  'questions:', questionCount);
console.log('Exact cross-module lexical duplicates:', hits.length);
console.log('Exact within-bank lexical duplicates (editorial review):', internalHits.length);
console.log('Duplicate answer options (editorial review):', optionHits.length);
for (const hit of optionHits) console.log('REVIEW answer options:', hit.bank+'#'+hit.question+
  ' options '+hit.first+' / '+hit.second);
for (const hit of internalHits) console.log('REVIEW within bank:', hit.bank+'#'+hit.first+' / #'+hit.second);
for (const hit of hits) console.log('REVIEW:', hit.map(x=>x.bank+'#'+x.index).join(' / '));
console.log('This does not detect semantic paraphrases or verify legal correctness.');
if (hits.length) process.exitCode = 2;
