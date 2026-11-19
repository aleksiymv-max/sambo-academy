// Deterministic regression: athlete case presentation must vary without changing source keys.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('athlete-applied-cases.js','utf8');
const window={};
let randomValue=0;
const controlledMath=Object.create(Math);
controlledMath.random=()=>randomValue;
vm.runInNewContext(source,{window,Math:controlledMath});
const cases=window.samboAthleteAppliedCases;
assert.equal(Object.keys(cases).length,4);
for(const [title,item] of Object.entries(cases)){
 assert.equal(item.correct,0,'historical source key must remain unchanged');
 assert.ok(Array.isArray(item.answers) && item.answers.length>=2,'at least two options required');
 assert.ok(Number.isInteger(item.correct) && item.correct>=0 && item.correct<item.answers.length,'valid correct index');
 const normalized=item.answers.map(answer=>String(answer).trim().replace(/\s+/g,' ').toLocaleLowerCase('ru'));
 assert.ok(normalized.every(Boolean),'no blank answers');
 assert.equal(new Set(normalized).size,normalized.length,'no duplicate answer options');
 assert.equal(normalized.filter(answer=>answer===normalized[item.correct]).length,1,'one unambiguous correct answer');
 const original=JSON.stringify(item.answers);
 const positions=new Set();
 for(const value of [0,0.999999]){
  randomValue=value;
  const html=window.samboAthleteAppliedCaseCard({title},'athlete');
  const list=html.match(/<ol>(.*?)<\/ol>/)?.[1];
  assert.ok(list,'options rendered');
  const options=[...list.matchAll(/<li>(.*?)<\/li>/g)].map(m=>m[1]);
  assert.equal(options.length,item.answers.length);
  assert.deepEqual([...options].sort(),[...item.answers].sort(),'no options lost');
  positions.add(options.indexOf(item.answers[item.correct]));
  assert.ok(html.includes(item.decision),'explanation preserved');
  assert.ok(html.includes(item.ref),'normative reference preserved');
 }
 assert.equal(positions.size,2,'controlled shuffle must move the correct option');
 assert.equal(JSON.stringify(item.answers),original,'source options untouched');
}
console.log('PASS: four athlete scenarios have deterministic varied positions with original keys and explanations');
