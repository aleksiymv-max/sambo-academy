// Structural audit only. Passing this check is NOT normative acceptance.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'athlete-applied-cases.js'), 'utf8');
const window = {};
vm.runInNewContext(source, { window }, { filename: 'athlete-applied-cases.js', timeout: 2000 });
const cases = window.samboAthleteAppliedCases;
assert.ok(cases && typeof cases === 'object', 'Scenario registry missing');
const entries = Object.entries(cases);
assert.equal(entries.length, 4, 'Unexpected athlete scenario count; review the audit scope');
for (const [title, item] of entries) {
  assert.ok(title.trim(), 'Empty scenario title');
  for (const field of ['ref', 'situation', 'question', 'decision', 'trap']) {
    assert.ok(typeof item[field] === 'string' && item[field].trim(), title + ': missing ' + field);
  }
  assert.ok(Array.isArray(item.answers) && item.answers.length >= 2, title + ': insufficient answers');
  assert.ok(Number.isInteger(item.correct) && item.correct >= 0 && item.correct < item.answers.length, title + ': invalid answer key');
  const normalized = item.answers.map(answer => {
    assert.ok(typeof answer === 'string' && answer.trim(), title + ': blank answer');
    return answer.normalize('NFKC').trim().replace(/\\s+/g, ' ').toLocaleLowerCase('ru');
  });
  assert.equal(new Set(normalized).size, normalized.length, title + ': duplicate answer options');
  assert.ok(item.ref.includes('Статья'), title + ': missing article reference');
}
console.log('PASS: ' + entries.length + ' athlete applied scenarios pass structural checks; normative review still required');
