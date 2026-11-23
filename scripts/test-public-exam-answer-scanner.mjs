#!/usr/bin/env node
// Regression checks for the release scanner. These use synthetic fixtures only.
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';

const scanner = resolve(dirname(fileURLToPath(import.meta.url)), 'check-public-exam-answers.mjs');
const root = await mkdtemp(join(tmpdir(), 'sambo-exam-scanner-'));
const run = () => spawnSync(process.execPath, [scanner, root], { encoding: 'utf8' });
try {
  await writeFile(join(root, 'judge-exam.js'), "const questions=[{q:'Synthetic',a:['A','B'],correct:1}];\n");
  let result = run();
  assert.equal(result.status, 1, 'Literal correct index must block publication');
  assert.match(result.stderr, /judge-exam\.js/);
  await writeFile(join(root, 'judge-exam.js'), "const questions=[{q:'Synthetic',a:['A','B'],correct}];\n");
  result = run();
  assert.equal(result.status, 1, 'Shorthand correct key must block publication');
  await writeFile(join(root, 'judge-exam.js'), "const questions=[{q:'Synthetic',a:['A','B']}];\n");
  result = run();
  assert.equal(result.status, 0, 'Safe synthetic fixture must pass');
  await writeFile(join(root, 'judge-questions.json'), '{"questions":[{"q":"Synthetic","correct":1}]}');
  result = run();
  assert.equal(result.status, 1, 'Quoted correct index in JSON exam bundle must block publication');
  assert.match(result.stderr, /judge-questions\.json/);
  await writeFile(join(root, 'judge-questions.json'), '{"questions":[{"q":"Synthetic"}]}');
  result = run();
  assert.equal(result.status, 0, 'Safe JSON exam bundle must pass');
  await mkdir(join(root, 'scripts'));
  await writeFile(join(root, 'scripts', 'internal-exam.js'), 'const correct=1;\n');
  result = run();
  assert.equal(result.status, 0, 'Internal scripts directory should not be scanned');
  console.log('PASS: public exam answer scanner detects two leak patterns and accepts safe fixture');
} finally {
  await rm(root, { recursive: true, force: true });
}
