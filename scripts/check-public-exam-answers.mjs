#!/usr/bin/env node
/**
 * Release gate for client-side exam answer leaks.
 * Usage: node scripts/check-public-exam-answers.mjs [directory]
 * Scans JS shipped to browsers. A failure blocks publication, not development.
 * This conservative scanner is intentionally not a substitute for review of
 * computed keys or server-side entitlement enforcement.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.argv[2] || '.';
const findings = [];
const ignored = new Set(['.git', 'node_modules', '.wrangler', 'coverage', 'supabase', 'tests', 'scripts']);
// Include JSON bundles: otherwise a build can move the same answer keys from JS to JSON.
const clientAsset = /\.(?:m?js|cjs|json|map)$/i;
const keyPattern = /(?:["']?correct["']?\s*:\s*(?:\d+|["'][^"']+["'])|\bcorrect\s*[,}]|["']?(?:correctAnswer|answerKey|correctIndex)["']?\s*[:=])/g;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) await walk(join(dir, entry.name));
    } else if (entry.isFile() && clientAsset.test(entry.name)) {
      const file = join(dir, entry.name);
      const source = await readFile(file, 'utf8');
      const matches = [...source.matchAll(keyPattern)];
      if (matches.length) findings.push({ file: relative(root, file), count: matches.length });
    }
  }
}
await walk(root);
if (findings.length) {
  console.error('BLOCKED: public client assets contains apparent answer keys:');
  for (const f of findings) console.error(`  ${f.file}: ${f.count} match(es)`);
  console.error('Move answers and grading behind authenticated server endpoints; review generated assets before release.');
  process.exitCode = 1;
} else {
  console.log('No obvious exam answer-key patterns found in scanned client assets. Manual review and authenticated E2E remain required.');
}
