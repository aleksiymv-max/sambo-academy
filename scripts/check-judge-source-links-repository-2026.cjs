'use strict';
// Prevent regression to the obsolete directory in course and editorial links.
// No network or normative interpretation: checks repository source references.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const oldDir = '/2025/09/';
const newDir = '/2026/08/';
const filenames = [
  'izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf',
  'razyasneniya_pravil_vida_sporta_sambo_sentyabr_2026_god.pdf'
];
const base = 'https://sambo.ru/wp-content/uploads/';
const targets = [
  ...fs.readdirSync('docs').filter(name => name.endsWith('.md')).map(name => path.join('docs', name)),
  ...fs.readdirSync('.').filter(name => /^judge.*\\.js$/.test(name)),
  'index.html'
];
let checked = 0;
for (const file of targets) {
  const source = fs.readFileSync(file, 'utf8');
  for (const filename of filenames) {
    assert.ok(!source.includes(base + oldDir.slice(1) + filename),
      'Obsolete 2026 normative document link in ' + file + ': ' + filename);
  }
  checked++;
}
const expectations = new Map([
  ['docs/editorial-exam-bout-2026-10-25.md', filenames],
  ['docs/editorial-exam-officials-2026-10-25.md', [filenames[0]]],
  ['docs/editorial-exam-combat-2026-10-26.md', filenames],
  ['docs/editorial-articles40-41-2026-10-25.md', [filenames[1]]],
  ['docs/normative-source-check-2026-10-24.md', filenames]
]);
for (const [file, required] of expectations) {
  const source = fs.readFileSync(file, 'utf8');
  for (const filename of required) {
    assert.ok(source.includes(base + newDir.slice(1) + filename),
      'Corrected primary-source link missing in ' + file + ': ' + filename);
  }
}
assert.ok(checked >= 55, 'Normative link scan unexpectedly skipped course files');
console.log('PASS: ' + checked + ' source files checked; corrected 2026 amendment and clarification links preserved');
