#!/usr/bin/env node
'use strict';
// Release-blocking audit for a *built* static deployment directory.
// This is not a substitute for authenticated API and cache probing.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');

const forbidden = [
  'judge-exam-independent.js',
  'judge-admission-exam-v3.js',
  'judge-exam-foundations-v2.js',
  'judge-exam-sanctions-v3.js'
];
const extensions = /\.(?:js|mjs|cjs|html|json|map|txt)$/i;
function scan(root) {
  const findings = [];
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw Error('Built asset directory missing: ' + root);
  }
  function visit(dir) {
    for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
      const full = path.join(dir, item.name);
      if (item.isSymbolicLink()) throw Error('Symlink in deployment artifact: ' + path.relative(root, full));
      if (item.isDirectory()) { visit(full); continue; }
      if (!item.isFile()) continue;
      const relative = path.relative(root, full).replace(/\\/g, '/');
      if (forbidden.includes(item.name)) findings.push(relative + ': forbidden answer bundle');
      if (!extensions.test(item.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const name of forbidden) {
        // Detect references, copies, and renamed bundles; do not print content.
        if (text.includes(name)) findings.push(relative + ': references forbidden exam bundle ' + name);
      }
    }
  }
  visit(root);
  return [...new Set(findings)];
}
function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sambo-asset-audit-'));
  try {
    fs.writeFileSync(path.join(dir, 'index.html'), '<h1>Public course overview</h1>');
    assert.deepEqual(scan(dir), []);
    fs.writeFileSync(path.join(dir, forbidden[0]), 'synthetic fixture only');
    assert(scan(dir).some(x => x.includes('forbidden answer bundle')));
    fs.rmSync(path.join(dir, forbidden[0]));
    fs.writeFileSync(path.join(dir, 'app.js'), 'import "./' + forbidden[1] + '"');
    assert(scan(dir).some(x => x.includes('references forbidden exam bundle')));
    fs.rmSync(path.join(dir, 'app.js'));
    assert.deepEqual(scan(dir), []);
    console.log('PASS: exam asset audit self-test');
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
}
try {
  if (process.argv.includes('--self-test')) selfTest();
  const target = process.argv.find((x,i) => i > 1 && x !== '--self-test');
  if (target) {
    const findings = scan(path.resolve(target));
    for (const finding of findings) console.error('BLOCK: ' + finding);
    if (findings.length) process.exitCode = 1;
    else console.log('PASS: no known exam answer bundles in supplied artifact (not a complete security audit)');
  } else if (!process.argv.includes('--self-test')) {
    throw Error('Usage: node scripts/check-public-exam-assets.cjs <built-directory> [--self-test]');
  }
} catch (error) {
  console.error('BLOCK: exam asset audit error: ' + error.message);
  process.exitCode = 1;
}
