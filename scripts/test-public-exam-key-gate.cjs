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
    const target = path.join(dir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
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
  fixture('bracket-notation-correct',
    '<script src="exam.js"></script>',
    { 'exam.js': 'questions[0]["correct"] = 2;' },
    1, /client-visible answer key/);
  fixture('bracket-notation-correct-index',
    '<script src="exam.js"></script>',
    { 'exam.js': "questions[0]['correctIndex'] = 1;" },
    1, /client-visible answer key/);
  fixture('dynamic-import-unlinked-script',
    '<script src="app.js"></script>',
    { 'app.js': 'import("./payload.js");', 'payload.js': 'const exam = [{ correct: 1 }];' },
    1, /client-visible answer key in payload.js/);
  fixture('renamed-exam-script',
    '<script src="app.js"></script>',
    { 'app.js': 'const questions = [{ correctIndex: 2 }];' },
    1, /client-visible answer key in app.js/);
  fixture('deploy-node-modules-key',
    '<script src="app.js"></script>',
    { 'app.js': 'console.log("app");', 'node_modules/leaked.js': 'const quiz = [{ correct: 2 }];' },
    1, /client-visible answer key in node_modules/);
  fixture('deploy-cache-key',
    '<script src="app.js"></script>',
    { 'app.js': 'console.log("app");', '.cache/hidden.js': 'const quiz = [{ correctIndex: 1 }];' },
    1, /client-visible answer key in .cache/);
  fixture('safe-without-symlinks',
    '<script src="app.js"></script>',
    { 'app.js': 'console.log("safe");' },
    0, /PASS:/);
  const linkDir = path.join(root, 'safe-without-symlinks');
  fs.symlinkSync(path.join(linkDir, 'app.js'), path.join(linkDir, 'alias.js'));
  const symlinkResult = spawnSync(process.execPath, [scanner, linkDir], { encoding: 'utf8' });
  assert.equal(symlinkResult.status, 1, 'deployment symlink must block');
  assert.match(symlinkResult.stderr, /deployment symlink requires explicit resolution/);
  passed++;
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
