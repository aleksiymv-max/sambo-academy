#!/usr/bin/env node
'use strict';
// Release-blocking static scan. Run against the exact deploy directory.
// This detects known client-side exam key exposure, not all possible leaks.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
const entry = path.join(root, 'index.html');
if (!fs.existsSync(entry)) { console.error('BLOCK: missing deployment entry index.html'); process.exit(2); }
const html = fs.readFileSync(entry, 'utf8');
const scriptSrc = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
const knownExam = /(?:exam|assessment|test|quiz)/i;
const findings = [];
for (const src of scriptSrc) {
  if (/^(?:https?:)?\/\//i.test(src)) continue;
  const local = src.split(/[?#]/)[0].replace(/^\.\//, '');
  if (!knownExam.test(local)) continue;
  const resolved = path.resolve(root, local);
  if (!resolved.startsWith(root + path.sep)) { findings.push('unsafe script path: ' + local); continue; }
  if (!fs.existsSync(resolved)) { findings.push('missing referenced exam script: ' + local); continue; }
  const js = fs.readFileSync(resolved, 'utf8');
  if (/\bcorrect\s*:/i.test(js) || /\bcorrect(?:Index|Answer)\s*[:=]/i.test(js)) {
    findings.push('client-visible answer key in ' + local);
  }
}
if (findings.length) {
  console.error('BLOCK: independent examination must be scored server-side; found:');
  findings.forEach(f => console.error('- ' + f));
  process.exit(1);
}
console.log('PASS: no known inline correct-key patterns in locally referenced exam scripts.');
console.log('NOTE: this does not establish server-side authorization, payment security or full coverage.');
