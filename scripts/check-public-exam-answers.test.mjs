import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const scanner = fileURLToPath(new URL('./check-public-exam-answers.mjs', import.meta.url));
for (const ext of ['js','cjs','mjs','json','map','html','htm','xhtml','svg']) {
  test(`blocks answer key in neutral ${ext} asset`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'exam-scan-'));
    try {
      writeFileSync(join(dir, `bundle.${ext}`), '{"correctIndex": 1}');
      const run = spawnSync(process.execPath, [scanner, dir], { encoding: 'utf8' });
      assert.equal(run.status, 1, run.stderr);
      assert.match(run.stderr, /BLOCKED/);
      assert.ok(run.stderr.includes(`bundle.${ext}`));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
test('allows ordinary HTML without answer keys', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exam-scan-'));
  try {
    writeFileSync(join(dir, 'index.html'), '<h1>Exam</h1>');
    const run = spawnSync(process.execPath, [scanner, dir], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
