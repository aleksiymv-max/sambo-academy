/* Fixture-based regression of the actual active judge answer-integrity gate.
 * No production exam bank or historical answer key is modified.
 */
'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const gate = path.join(root, 'scripts/check-active-judge-answer-integrity.cjs');

function check(label, questions, expectedExit, expectedText) {
  const fixture = [
    'const foundationActive = {questions: ' + JSON.stringify(questions) + '};',
    'const sanctionsActive = {questions: []};',
    'const modules = [];',
    'const activeCount = ' + questions.length + ';'
  ].join('\n');
  const injection = [
    "const fs = require('node:fs');",
    'const original = fs.readFileSync;',
    'fs.readFileSync = function(file, ...args) {',
    "  if (String(file).endsWith('audit-judge-content.cjs')) return " + JSON.stringify(fixture) + ';',
    '  return original.call(this, file, ...args);',
    '};',
    'require(' + JSON.stringify(gate) + ');'
  ].join('\n');
  const result = spawnSync(process.execPath, ['-e', injection], {
    cwd: root, encoding: 'utf8', timeout: 15000
  });
  assert.equal(result.error, undefined, label + ': failed to spawn');
  assert.equal(result.status, expectedExit, label + ': ' + result.stderr + result.stdout);
  assert.match(result.stdout + result.stderr, expectedText, label);
}
const valid = {q:'Who records the decision?', a:['Referee','Spectator'],correct:0,body:'The assigned official records it.'};
check('valid fixture', [valid], 0, /0 structural errors/);
check('invalid answer index', [{...valid,correct:2}], 1, /FAIL invalid answer index/);
check('missing explanation', [{...valid,body:''}], 1, /FAIL missing explanation/);
check('missing choices', [{...valid,a:[]}], 1, /FAIL missing choices/);
check('missing stem', [{...valid,q:'  '}], 1, /FAIL missing stem/);
check('empty choice', [{...valid,a:['Referee','']}], 1, /FAIL empty choice/);
check('negative answer index', [{...valid,correct:-1}], 1, /FAIL invalid answer index/);
check('fractional answer index', [{...valid,correct:0.5}], 1, /FAIL invalid answer index/);
check('duplicate answer choices', [{...valid,a:['Referee',' referee  ']}], 0, /REVIEW repeated choice/);
console.log('PASS: 9 fixture cases for active judge answer integrity gate');
