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
    return answer.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
  });
  assert.equal(new Set(normalized).size, normalized.length, title + ': duplicate answer options');
  assert.ok(item.ref.includes('Статья'), title + ': missing article reference');
  // A valid registry entry must also be reachable from the athlete lesson renderer.
  const athleteHtml = window.samboAthleteAppliedCaseCard({ title }, 'athlete');
  assert.ok(typeof athleteHtml === 'string' && athleteHtml.includes('sambo-athlete-applied-case'), title + ': athlete card not rendered');
  for (const expected of [item.situation, item.question, item.decision, item.trap, item.ref, item.answers[item.correct]]) {
    assert.ok(athleteHtml.includes(expected), title + ': lesson card omits scenario, answer, rationale or source');
  }
  // Verify that every distractor is actually shown once, not merely stored in the registry.
  const displayedOptions = [...athleteHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(match => match[1]);
  const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  // Convert VM-realm answers into a host-realm array for strict prototype-aware comparison.
  assert.deepEqual(displayedOptions, Array.from(item.answers, escapeHtml),
    title + ': lesson card hides, duplicates, reorders or fails to escape answer options');
  assert.equal(window.samboAthleteAppliedCaseCard({ title }, 'judge'), '', title + ': athlete scenario leaked into judge course');
  assert.equal(window.samboAthleteAppliedCaseCard({ title }, 'unknown'), '', title + ': athlete scenario leaked into another course');

}
console.log('PASS: ' + entries.length + ' athlete applied scenarios pass structural checks; normative review still required');
