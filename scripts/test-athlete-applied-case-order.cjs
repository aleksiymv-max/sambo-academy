// Regression: athlete applied cases must not always present the correct option first.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('athlete-applied-cases.js','utf8');
const window={};
vm.runInNewContext(source,{window,Math});
const cases=window.samboAthleteAppliedCases;
assert.equal(Object.keys(cases).length,4);
for(const [title,item] of Object.entries(cases)){
 assert.equal(item.correct,0,'historical source key must remain unchanged');
 const original=JSON.stringify(item.answers);
 const positions=new Set();
 for(let attempt=0;attempt<100;attempt++){
  const html=window.samboAthleteAppliedCaseCard({title},'athlete');
  const list=html.match(/<ol>(.*?)<\/ol>/)?.[1];
  assert.ok(list,'options rendered');
  const options=[...list.matchAll(/<li>(.*?)<\/li>/g)].map(m=>m[1]);
  assert.equal(options.length,item.answers.length);
  assert.deepEqual([...options].sort(),[...item.answers].sort(),'no options lost');
  positions.add(options.indexOf(item.answers[item.correct]));
  assert.ok(html.includes(item.decision),'explanation preserved');
 }
 assert.ok(positions.size>1,'correct option must appear in varying positions');
 assert.equal(JSON.stringify(item.answers),original,'source options untouched');
}
console.log('PASS: all four athlete scenarios vary answer order without modifying keys or explanations');
