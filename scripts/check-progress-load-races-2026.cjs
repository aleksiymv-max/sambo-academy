'use strict';
// Regression for out-of-order authenticated progress loads. No real Supabase credentials.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const requests=[],writes=[];
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
let renders=0;
const ctx={window:null,localStorage:{getItem:()=>null,setItem:()=>{}},
 renderStudentDashboard:()=>renders++,authMessage:()=>{}};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('progress.js','utf8'),ctx,{filename:'progress.js'});
ctx.samboAuthClient={from(table){
 assert.equal(table,'lesson_progress');
 return {
  select(columns){assert.equal(columns,'course_key,lesson_index');return {
   eq(column,userId){assert.equal(column,'user_id');const d=deferred();requests.push({userId,...d});return d.promise;}
  };},
  upsert(row){const d=deferred();writes.push({row,...d});return d.promise;}
 };
}};
const rows=(...indices)=>({data:indices.map(lesson_index=>({course_key:'judge',lesson_index})),error:null});
async function main(){
 const first=ctx.loadSamboProgress({id:'alice'});
 const second=ctx.loadSamboProgress({id:'alice'});
 assert.equal(requests.length,2);
 requests[1].resolve(rows(2100));
 assert.equal(await second,true);
 assert.equal(ctx.progressDone('judge',2100),true);
 requests[0].resolve(rows(1100));
 assert.equal(await first,false,'Older same-account load must be ignored');
 assert.equal(ctx.progressDone('judge',2100),true);
 assert.equal(ctx.progressDone('judge',1100),false);

 const third=ctx.loadSamboProgress({id:'alice'});
 const fourth=ctx.loadSamboProgress({id:'alice'});
 requests[3].resolve(rows(1306));
 assert.equal(await fourth,true);
 requests[2].resolve({data:null,error:{message:'stale failure'}});
 assert.equal(await third,false);
 assert.equal(ctx.samboProgress.error,false,'Stale failure must not poison current session');
 assert.equal(ctx.progressDone('judge',1306),true);

 const alice=ctx.loadSamboProgress({id:'alice'});
 const bob=ctx.loadSamboProgress({id:'bob'});
 requests[5].resolve(rows(1206));
 assert.equal(await bob,true);
 requests[4].resolve(rows(2100));
 assert.equal(await alice,false);
 assert.equal(ctx.samboProgress.userId,'bob');
 assert.equal(ctx.progressDone('judge',1206),true);
 assert.equal(ctx.progressDone('judge',2100),false,'Other account data must remain hidden');

 // A write may finish after a new read starts; do not discard that saved pass.
 const saving=ctx.saveSamboProgress('judge',2100);
 assert.equal(writes.length,1);
 assert.equal(writes[0].row.user_id,'bob');
 const loading=ctx.loadSamboProgress({id:'bob'});
 writes[0].resolve({error:null});
 assert.equal(await saving,true);
 requests[6].resolve(rows(1206)); // stale DB snapshot excludes the new pass
 assert.equal(await loading,true);
 assert.equal(ctx.progressDone('judge',2100),true,'Read must not erase successful concurrent write');
 assert.equal(ctx.progressDone('judge',1206),true);

 // The latest read may fail; failed reads must not allow unverified completion.
 const failed=ctx.loadSamboProgress({id:'bob'});
 requests[7].resolve({data:null,error:{message:'read unavailable'}});
 assert.equal(await failed,false);
 assert.equal(ctx.samboProgress.error,true);
 assert.equal(await ctx.saveSamboProgress('judge',1210),false);
 assert.equal(ctx.progressDone('judge',1210),false);
 assert.ok(renders>=4);
 console.log('PASS: overlapping same-account reads, stale errors and account switches are isolated');
 console.log('PASS: concurrent successful write survives a stale read snapshot');
 console.log('PASS: current read failures cannot grant an unverified result');
 console.log('LIMITATION: simulated Supabase client; live-account E2E still required');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
