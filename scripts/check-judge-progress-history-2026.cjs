'use strict';
// Regression: historical judge progress survives a module revision and a simulated
// Supabase save/relogin/restore cycle. This is NOT a live-account E2E test.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const stored=new Map();
const localStorage={
  getItem:k=>stored.has(k)?stored.get(k):null,
  setItem:(k,v)=>stored.set(k,String(v))
};
let redraws=0, messages=[];
function runtime(){
  const ctx={localStorage,renderStudentDashboard:()=>{redraws++;},authMessage:m=>messages.push(m)};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('progress.js','utf8'),ctx,{filename:'progress.js'});
  return ctx;
}
const rows=new Map([['alice',new Set(['judge:1100','judge:1206'])],['bob',new Set()]]);
let failRead=false,failWrite=false;
const client={
  from(table){
    assert.equal(table,'lesson_progress');
    return {
      select(fields){
        assert.equal(fields,'course_key,lesson_index');
        return {eq:async(column,user)=>{
          assert.equal(column,'user_id');
          if(failRead)return {data:null,error:new Error('mock read failure')};
          const data=Array.from(rows.get(user)||[]).map(k=>{
            const [course_key,lesson_index]=k.split(':');
            return {course_key,lesson_index:Number(lesson_index)};
          });
          return {data,error:null};
        }};
      },
      async upsert(row,options){
        assert.equal(options.onConflict,'user_id,course_key,lesson_index');
        assert.equal(options.ignoreDuplicates,true);
        if(failWrite)return {error:new Error('mock write failure')};
        rows.get(row.user_id).add(row.course_key+':'+row.lesson_index);
        return {error:null};
      }
    };
  }
};

async function main(){
  let p=runtime();
  assert.equal(await p.saveSamboProgress('judge',1206),true);
  assert.equal(p.progressDone('judge',1206),true);
  p=runtime(); // simulate a browser reload, same localStorage
  assert.equal(p.progressDone('judge',1206),true);
  assert.equal(p.progressDone('judge',1306),false);
  p.samboAuthClient=client;
  assert.equal(await p.loadSamboProgress({id:'alice'}),true,'successful authenticated load must report success');
  assert.equal(p.progressDone('judge',1100),true);
  assert.equal(p.progressDone('judge',1206),true,'historical 1206 remains available');
  assert.equal(p.progressDone('judge',1306),false,'a future revised exam is not silently passed');
  assert.equal(await p.saveSamboProgress('judge',1306),true);
  assert.equal(p.progressDone('judge',1306),true);
  assert.equal(rows.get('alice').has('judge:1206'),true,'old result must not be overwritten');
  assert.equal(await p.loadSamboProgress({id:'bob'}),true);
  assert.equal(p.progressDone('judge',1206),false,'progress must be isolated per account');
  assert.equal(p.progressDone('judge',1306),false);
  assert.equal(await p.loadSamboProgress({id:'alice'}),true);
  assert.equal(p.progressDone('judge',1206),true);
  assert.equal(p.progressDone('judge',1306),true,'relogin restores new result');
  failWrite=true;
  assert.equal(await p.saveSamboProgress('judge',1406),false);
  assert.equal(p.progressDone('judge',1406),false,'failed write cannot mark module complete');
  failWrite=false;
  failRead=true;
  assert.equal(await p.loadSamboProgress({id:'alice'}),false,'failed read must not report success');
  assert.equal(p.samboProgress.error,true);
  assert.equal(await p.saveSamboProgress('judge',1406),false);
  failRead=false;
  assert.ok(redraws>0);
  assert.ok(messages.length>0);
  console.log('PASS: anonymous local history survives reload; no automatic pass for future revision');
  console.log('PASS: simulated authenticated save, relogin and restore retain old and new result indices');
  console.log('PASS: account isolation and failed read/write do not produce false completion');
  console.log('LIMITATION: simulated Supabase client only; real-account E2E remains open');

  const context={window:{}};vm.createContext(context);
  for(const name of ['judge-course-engine.js','judge-program-admission.js','judge-program-participants.js',
    'judge-program-officials.js','judge-program-bout.js','judge-program-scoring.js',
    'judge-program-sanctions.js','judge-program-infrastructure.js','judge-program-combat.js',
    'judge-program-beach.js','judge-program-demo.js','judge-program-practicum.js',
    'judge-exam-independent.js']){
    vm.runInContext(fs.readFileSync(name,'utf8'),context,{filename:name});
  }
  const mod=context.window.samboJudgeCourseEngine.modules[5];
  const worked=mod.lessons.flatMap(l=>l.blocks).find(b=>b[0].includes('Пограничный случай статьи 34(9)'));
  assert.ok(worked,'Worked boundary case must appear in sanctions lesson');
  for(const token of ['01:10','01:40','03:00','первые предупреждения получены в разное время',
    'проигравшим считается синий','если первые предупреждения обоих получены одновременно',
    'специальное условие статьи 34(9) не выполнено','вопрос № 47']){
    assert.ok(worked[1].includes(token),'Missing normative condition: '+token);
  }
  const question=mod.questions[6];
  assert.equal(question.q,'Спортсмен получил первое предупреждение, а затем одновременно с соперником — второе. Что важно для итогового равенства?');
  assert.equal(question.correct,2);
  assert.equal(question.a[2],'Время получения первых предупреждений и критерии статьи 34');
  assert.equal(mod.examRevision,2);
  console.log('PASS: art. 34(9) worked and counter-examples distinguish the missing first-warning condition');
  console.log('PASS: historical exam item 47 and examRevision=2 unchanged pending safe versioning');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
