'use strict';
// Archived results must remain visible without silently granting the current revision.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const store=new Map();
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key)
};
const context={window:{},localStorage,renderStudentDashboard(){},authMessage(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('progress.js','utf8'),context,{filename:'progress.js'});
const w=context.window;
const history=index=>Array.from(w.samboJudgeHistoricalCompletions(index));
const indices=index=>Array.from(w.samboJudgeHistoricalIndices(index));
assert.deepEqual(indices(1100),[100]);
assert.deepEqual(indices(1206),[1106]);
assert.deepEqual(indices(1306),[1206,1106]);
assert.deepEqual(indices(1201),[1101]);
assert.deepEqual(indices(1211),[1111]);
assert.deepEqual(indices(100),[]);
assert.deepEqual(indices(1406),[]);
assert.deepEqual(history(1206),[]);
localStorage.setItem('sambo-demo-judge-1106','done');
localStorage.setItem('sambo-demo-judge-100','done');
assert.deepEqual(history(1206),[1106]);
assert.deepEqual(history(1100),[100]);
assert.equal(w.progressDone('judge',1206),false,'Archived pass cannot grant revised pass');
assert.equal(w.progressDone('judge',1100),false,'Foundation historical pass cannot grant new pass');
assert.deepEqual(history(1306),[1106]);
localStorage.setItem('sambo-demo-judge-1206','done');
assert.deepEqual(history(1306),[1206,1106]);
assert.equal(w.progressDone('judge',1306),false,'Future revision cannot be silently passed');
assert.deepEqual(history(1206),[1106],'Current completion is not a historical result');
w.samboProgress.userId='account-A';
w.samboProgress.completed=new Set(['judge:1106','judge:1206']);
assert.deepEqual(history(1306),[1206,1106]);
assert.equal(w.progressDone('judge',1306),false);
w.samboProgress.userId='account-B';
w.samboProgress.completed=new Set();
assert.deepEqual(history(1306),[],'Never expose account A or guest historical results to account B');
assert.equal(w.progressDone('judge',1106),false);
w.samboProgress.completed.add('judge:1306');
assert.equal(w.progressDone('judge',1306),true);
assert.deepEqual(history(1306),[],'Current pass is not an archived pass');
w.samboProgress.userId=null;
assert.deepEqual(history(1306),[1206,1106],'Guest history remains local after logout');
const html=fs.readFileSync('index.html','utf8');
for(const marker of ['samboJudgeHistoricalCompletions(samboModuleProgressIndex(key,i))',
 'class="sambo-archive-note"','data-history-progress=',
 'Для текущей редакции нужен отдельный зачёт.',
 'Все 12 судейских модулей доступны для обучения.']){
 assert.ok(html.includes(marker),'Missing UI integration: '+marker);
}
assert.ok(!html.includes('Остальные модули сохраняются для ознакомления'),'Outdated course status remains');
assert.match(html,/const completed=groups\.filter\(\(_,i\)=>typeof progressDone==='function'&&progressDone\(key,samboModuleProgressIndex\(key,i\)\)\)\.length/,'Current progress must not count history');
console.log('PASS: archived foundation and 11 judge-module result keys are readable and preserved');
console.log('PASS: future revision 1306 may display 1206/1106 but does not inherit completion');
console.log('PASS: guest/account history isolated; module progress counts only current keys');
console.log('LIMITATION: no new exam version activated and no real Supabase account E2E performed');
