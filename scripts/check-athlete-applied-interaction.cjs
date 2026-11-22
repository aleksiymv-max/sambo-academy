// Exercise the actual delegated answer-check handler without external DOM dependencies.
// These checks cover missing selection, correct/incorrect choices and rotated keys.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
let click,change;
const document={addEventListener(type,handler){if(type==='click')click=handler;if(type==='change')change=handler;}};
const window={document};
vm.runInNewContext(fs.readFileSync('athlete-applied-cases.js','utf8'),{window});
assert.equal(typeof click,'function','Delegated click listener missing');
assert.equal(typeof change,'function','Delegated change listener missing');
const cases=window.samboAthleteAppliedCases;
const titles=Object.keys(cases);
assert.equal(titles.length,4,'Unexpected scenario count: review test coverage');
for(const [index,title] of titles.entries()){
  const item=cases[title];
  const offset=index%item.answers.length;
  const html=window.samboAthleteAppliedCaseCard({title},'athlete');
  assert.match(html,/class="sambo-case-check"/);
  assert.match(html,/role="status" aria-live="polite"/);
  let selected=null;
  const feedback={textContent:''};
  const details={open:false};
  const card={
    getAttribute(key){assert.equal(key,'data-case-title');return title;},
    querySelector(selector){
      if(selector==='input[type="radio"]:checked')return selected;
      if(selector==='.sambo-case-feedback')return feedback;
      if(selector==='details.sambo-self-check')return details;
      throw Error('Unexpected selector '+selector);
    }
  };
  const button={closest(selector){
    if(selector==='.sambo-case-check')return this;
    if(selector==='.sambo-athlete-applied-case')return card;
    throw Error('Unexpected closest '+selector);
  }};
  click({target:button});
  assert.match(feedback.textContent,/Сначала выберите/,'Missing selection must be handled');
  assert.equal(details.open,false,'Missing selection should not reveal solution');
  // Malformed DOM values must not be accepted or reveal the solution.
  for(const invalid of ['',' ','NaN','-1',String(item.answers.length),'1.5','01','+0','0x0','0e0','Infinity']){
    selected={value:invalid};
    details.open=false;
    click({target:button});
    assert.match(feedback.textContent,/Некорректный вариант/,'Invalid selection accepted: '+invalid);
    assert.equal(details.open,false,'Invalid selection revealed solution');
  }
  const correctPosition=(item.correct-offset+item.answers.length)%item.answers.length;
  selected={value:String(correctPosition)};
  click({target:button});
  assert.match(feedback.textContent,/^Верно/,'Rotated correct option rejected: '+title);
  assert.equal(details.open,true,'Explanation should open after checking');
  // Switching the selected option must invalidate stale feedback.
  change({target:{matches(selector){assert.equal(selector,'.sambo-case-option input[type="radio"]');return true;},closest(selector){assert.equal(selector,'.sambo-athlete-applied-case');return card;}}});
  assert.match(feedback.textContent,/Ответ изменён/,'Stale grade shown after changing answer');
  details.open=false;
  selected={value:String((correctPosition+1)%item.answers.length)};
  click({target:button});
  assert.match(feedback.textContent,/^Неверно/,'Wrong option accepted: '+title);
  assert.equal(details.open,true,'Wrong answer must show explanation');
}
console.log('PASS: 4 athlete self-check interactions, rotated keys and explanations');
