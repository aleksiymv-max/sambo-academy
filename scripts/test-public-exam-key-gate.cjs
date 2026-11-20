#!/usr/bin/env node
'use strict';
// Regression fixtures for the public exam-key release gate.
// No live accounts, production changes, or real exam answers are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const scanner = path.join(__dirname, 'check-public-exam-keys.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sambo-exam-gate-'));
let passed = 0;
function fixture(name, html, scripts, expectedStatus, expectedText) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  for (const [file, source] of Object.entries(scripts)) {
    fs.writeFileSync(path.join(dir, file), source);
  }
  const result = spawnSync(process.execPath, [scanner, dir], { encoding: 'utf8' });
  assert.equal(result.error, undefined, name + ': scanner process error');
  assert.equal(result.status, expectedStatus, name + ': unexpected exit; ' + result.stderr);
  assert.match(result.stdout + result.stderr, expectedText, name);
  passed++;
}
try {
  fixture('public-correct-key',
    '<script src="judge-exam-independent.js"></script>',
    { 'judge-exam-independent.js': 'const questions = [{ correct: 1 }];' },
    1, /client-visible answer key/);
  fixture('public-correct-index',
    '<script src="./exam.js?v=1"></script>',
    { 'exam.js': 'const correctIndex = 2;' },
    1, /client-visible answer key/);
  fixture('quoted-correct-key',
    '<script src="exam.js"></script>',
    { 'exam.js': 'const questions = [{ "correct": 2 }];' },
    1, /client-visible answer key/);
  fixture('quoted-correct-index',
    '<script src="exam.js"></script>',
    { 'exam.js': "const questions = [{ 'correctIndex': 2 }];" },
    1, /client-visible answer key/);
  fixture('safe-exam-no-key',
    '<script src="exam.js"></script>',
    { 'exam.js': 'const questions = [{ id: "q1", prompt: "Scenario?" }];' },
    0, /PASS:/);
  fixture('missing-exam-script',
    '<script src="exam.js"></script>', {},
    1, /missing referenced exam script/);
  fixture('missing-entry', '', {}, 0, /PASS:/);
  // An absent index.html must block; remove the generated entry and retest.
  fs.unlinkSync(path.join(root, 'missing-entry', 'index.html'));
  const missing = spawnSync(process.execPath, [scanner, path.join(root, 'missing-entry')], { encoding: 'utf8' });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /missing deployment entry/);
  passed++;
  console.log('PASS: ' + passed + ' public exam-key scanner regression checks');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
