#!/usr/bin/env node
'use strict';
// Release-blocking heuristic scan of the exact deployment directory.
// This is not a substitute for private server-side question storage and grading.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || '.');
const entry = path.join(root, 'index.html');
if (!fs.existsSync(entry)) {
  console.error('BLOCK: missing deployment entry index.html');
  process.exit(2);
}
const html = fs.readFileSync(entry, 'utf8');
const scriptSrc = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]);
const knownExam = /(?:exam|assessment|test|quiz)/i;
const keyPattern = /(?:\bcorrect(?:Index|Answer)?\b|["']correct(?:Index|Answer)?["'])\s*[:=]|\[\s*["']correct(?:Index|Answer)?["']\s*\]\s*=/i;
const findings = [];
// Inline JavaScript is deployed inside index.html and must be scanned too.
// Exclude ordinary HTML attributes/text to avoid unrelated false positives.
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
  if (keyPattern.test(match[1])) findings.push('client-visible answer key in inline index.html script');
}
const visited = new Set();
function inspectFile(file, label) {
  if (visited.has(file)) return;
  visited.add(file);
  if (keyPattern.test(fs.readFileSync(file, 'utf8'))) {
    findings.push('client-visible answer key in ' + label);
  }
}
for (const src of scriptSrc) {
  if (/^(?:https?:)?\/\//i.test(src)) continue;
  const local = src.split(/[?#]/)[0].replace(/^\.\//, '');
  if (!knownExam.test(local)) continue;
  const resolved = path.resolve(root, local);
  if (!resolved.startsWith(root + path.sep)) {
    findings.push('unsafe script path: ' + local);
    continue;
  }
  if (!fs.existsSync(resolved)) {
    findings.push('missing referenced exam script: ' + local);
    continue;
  }
  inspectFile(resolved, local);
}
// Include dynamically imported or fetched scripts, even when renamed.
// Fail closed on symlinks: public servers may follow them outside the scanned tree.
// Scan every directory inside the deploy root: even a node_modules or .cache
// folder is publicly accessible if accidentally copied into the output.
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isSymbolicLink()) {
      findings.push('deployment symlink requires explicit resolution: ' + path.relative(root, path.join(dir, item.name)));
      continue;
    }
    const file = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(file);
    } else if (item.isFile() && /\.(?:js|mjs|cjs)$/i.test(item.name)) {
      inspectFile(file, path.relative(root, file));
    } else if (item.isFile() && /\.html?$/i.test(item.name)) {
      // Any deployed HTML can contain inline answer keys, not just index.html.
      const page = fs.readFileSync(file, 'utf8');
      for (const match of page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
        if (keyPattern.test(match[1])) findings.push('client-visible answer key in inline ' + path.relative(root, file) + ' script');
      }
    }
  }
}
walk(root);
if (findings.length) {
  console.error('BLOCK: independent examination must be scored server-side; found:');
  findings.forEach(f => console.error('- ' + f));
  process.exit(1);
}
console.log('PASS: no known correct-key patterns in deployable JavaScript.');
console.log('NOTE: heuristic only; does not prove server-side authorization or payment security.');
