/* Regression gate: inspect ACTIVE judge exam answers, not superseded banks.
 * Run from repository root: node scripts/check-active-judge-answer-integrity.cjs
 * Structural integrity is not normative or independent expert approval.
 */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const audit = fs.readFileSync(path.join(__dirname, 'audit-judge-content.cjs'), 'utf8');
const integrity = `
const banks = [
 {name:'Foundations v2', questions:foundationActive.questions},
 ...modules.map((m,i)=>({name:m.title,questions:i===5?sanctionsActive.questions:m.questions}))
];
let examined=0, errors=0, warnings=0;
for(const bank of banks){
 bank.questions.forEach((q,i)=>{
  examined++;
  const at=bank.name+' question '+(i+1);
  if(typeof q.q!=='string'||!q.q.trim()){console.error('FAIL missing stem: '+at);errors++;}
  if(!Array.isArray(q.a)||q.a.length<2){console.error('FAIL missing choices: '+at);errors++;return;}
  if(!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.a.length){
   console.error('FAIL invalid answer index: '+at);errors++;
  }
  if(q.a.some(a=>typeof a!=='string'||!a.trim())){console.error('FAIL empty choice: '+at);errors++;}
  if(typeof q.body!=='string'||!q.body.trim()){console.error('FAIL missing explanation: '+at);errors++;}
  const choices=q.a.map(a=>String(a).trim().toLocaleLowerCase('ru').replace(/\\s+/g,' '));
  if(new Set(choices).size!==choices.length){console.warn('REVIEW repeated choice: '+at);warnings++;}
 });
}
if(examined!==activeCount){console.error('FAIL inventory mismatch: '+examined+' vs '+activeCount);errors++;}
console.log('ACTIVE ANSWER INTEGRITY: '+examined+' questions; '+errors+' structural errors; '+warnings+' choice-duplicate reviews');
if(errors)process.exitCode=1;
`;
const previous = process.cwd();
try {
 process.chdir(root);
 vm.runInThisContext(audit + '\n' + integrity, {filename:'judge-answer-integrity-audit.js'});
} finally {
 process.chdir(previous);
}
