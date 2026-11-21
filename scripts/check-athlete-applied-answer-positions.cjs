// Regression: rendered athlete self-checks must not always place the answer first.
// This intentionally tests the real browser-facing HTML without altering exam keys.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('athlete-applied-cases.js','utf8'),context);
const cases=context.window.samboAthleteAppliedCases;
const render=context.window.samboAthleteAppliedCaseCard;
const positions=[];
for(const title of Object.keys(cases)){
  const item=cases[title];
  const html=render({title},'athlete');
  const options=[...html.matchAll(/<input type="radio"[^>]*value="(\d+)"[^>]*> ([^<]+)<\/label>/g)].map(m=>m[2]);
  assert.equal(options.length,item.answers.length,title);
  assert.match(html,/class="sambo-case-check"/,title);
  assert.match(html,/aria-live="polite"/,title);
  const answer=html.match(/<strong>Правильный ответ:<\/strong> ([^<]+)/);
  assert.ok(answer,title);
  const position=options.indexOf(answer[1]);
  assert.ok(position>=0,title);
  positions.push(position);
  assert.equal(item.correct,0,'Stored historical answer key changed: '+title);
  assert.equal(render({title},'judge'),'','Athlete case leaked into judge course');
}
assert.ok(new Set(positions).size>1,'All displayed correct answers have the same position');
console.log('PASS athlete applied self-check displayed correct positions: '+positions.join(','));
