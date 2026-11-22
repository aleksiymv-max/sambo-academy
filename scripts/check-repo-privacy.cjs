#!/usr/bin/env node
'use strict';

// Fail closed for recognisable personal contact details and credentials in tracked
// text files. A separate --history mode blocks publication when old commits carry
// personal author addresses; it does not rewrite history or expose the addresses.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const findings = [];
const binaryAssets = [];
const allowEmail = /(?:@example\.(?:com|org|net|test|invalid)|@(?:users\.)?noreply\.github\.com|^noreply@github\.com)$/i;
const privateFilename = /(?:^|\/)(?:\.env(?:\..+)?|id_(?:rsa|ed25519)(?:\.pub)?|.*\.(?:pem|p12|pfx|key|sqlite3?|db|dump|bak)|(?:users?|accounts?|customers?|contacts?)[-_]?(?:export|backup)\.(?:csv|json|sql)|.*(?:backup|dump)\.sql)$/i;
const secretPatterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['credential', /\b(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_|sb_secret_|sk_live_|sk_test_|sk-proj-|sk-svcacct-|xox[baprs]-|AIza)[A-Za-z0-9_\-]{12,}\b/g],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['JWT', /\beyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g],
  ['hard-coded secret setting', /\b(?:SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|SMTP_PASSWORD|GITHUB_TOKEN|CLOUDFLARE_API_TOKEN|STRIPE_SECRET_KEY|JWT_SECRET)\s*[:=]\s*['"]?((?!process\.env\b|\$\{|secrets\.)[A-Za-z0-9:/?=_\-.@!]{12,})/g]
];
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const phonePattern = /(?:\+7|8)[\s(.-]*9\d{2}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}\b/g;

function git(gitArgs, opts={}) {
  return execFileSync('git', gitArgs, {
    cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...opts
  });
}
function add(file, label, index, content) {
  const line = content.slice(0, index).split('\n').length;
  findings.push(file + ':' + line + ' — ' + label);
}
function inspectText(file, content) {
  emailPattern.lastIndex = 0;
  for (const match of content.matchAll(emailPattern)) {
    if (!allowEmail.test(match[0])) add(file, 'non-test email address', match.index, content);
  }
  phonePattern.lastIndex = 0;
  for (const match of content.matchAll(phonePattern)) add(file, 'possible personal phone', match.index, content);
  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) add(file, label, match.index, content);
  }
}
function scanTracked() {
  const files = git(['ls-files', '-z']).split('\0').filter(Boolean);
  for (const file of files) {
    const normalized = file.replace(/\\/g, '/');
    if (privateFilename.test(normalized)) {
      findings.push(file + ' — potentially private file name');
      continue;
    }
    const bytes = fs.readFileSync(path.join(repoRoot, file));
    const isBinary = bytes.includes(0) || /\.(?:png|jpe?g|gif|webp|ico|pdf|mp4|mov|webm)$/i.test(file);
    if (isBinary) {
      binaryAssets.push(file);
      continue;
    }
    inspectText(file, bytes.toString('utf8'));
  }
  console.log('Privacy preflight: scanned ' + files.length + ' tracked files; ' +
    binaryAssets.length + ' binary assets require manual visual/metadata/rights review.');
}
function scanHistory() {
  if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
    findings.push('history — shallow clone cannot establish publication safety');
    return;
  }
  const entries = git(['log', '--all', '--format=%H%x09%ae%x09%ce']).trim().split('\n').filter(Boolean);
  let exposed = 0;
  for (const line of entries) {
    const [sha, author, committer] = line.split('\t');
    if ([author, committer].some(mail => mail && !allowEmail.test(mail))) exposed++;
  }
  if (exposed) findings.push('history — ' + exposed +
    ' commits expose non-noreply author/committer addresses across fetched refs');
  console.log('Publication history review: ' + entries.length +
    ' reachable commits checked (only fetched refs; deleted blobs, PR caches and forks require separate audit).');
}
function selfTest() {
  const old = findings.length;
  inspectText('fixture', 'student@example.test\nstudent@example.invalid\n');
  if (findings.length !== old) throw new Error('Allowed test addresses rejected');
  inspectText('fixture', 'person' + '@' + 'gmail.com\n');
  inspectText('fixture', 'ghp_' + 'A'.repeat(36) + '\n');
  inspectText('fixture', 'sk-proj-' + 'A'.repeat(36) + '\n');
  inspectText('fixture', 'sk-svcacct-' + 'A'.repeat(36) + '\n');
  if (findings.length !== old + 4) throw new Error('Credential/email detection regression');
  findings.length = old;
  console.log('PASS: privacy scanner self-test');
}
try {
  if (args.has('--self-test')) selfTest();
  if (!args.has('--self-test') || args.has('--history') || args.has('--tracked')) scanTracked();
  if (args.has('--history')) scanHistory();
  for (const finding of findings.slice(0, 40)) console.error('BLOCK: ' + finding);
  if (findings.length > 40) console.error('BLOCK: ' + (findings.length - 40) + ' more findings (values redacted)');
  if (findings.length) {
    console.error('Privacy preflight FAILED: do not make this repository public.');
    process.exitCode = 1;
  } else {
    console.log('PASS: no recognised text-file disclosures. Not a complete historical, live-database, image or copyright audit.');
  }
} catch (error) {
  console.error('Privacy preflight error: ' + error.message);
  process.exitCode = 1;
}
