/* Deployment parity gate: a green browser test must not mask an older Pages revision.
 * Compare the deployed page shell, styles and judge JavaScript bytes with checked-out GitHub Actions files.
 * No authentication, user data or database writes.
 */
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const assets=[
 'index.html','privacy.html','judge-foundations.css','auth-config.js',
 'athlete-applied-cases.js','judge-admission-v2.css','judge-admission-exam-v3.js',
 'judge-program-admission-v2.js',
 'progress.js','judge-foundations.js','judge-exam-foundations-v2.js',
 'judge-exam-sanctions-v3.js','judge-exam-independent.js',
 'judge-course-engine.js','judge-program-bridge.js',
 'judge-program-admission.js','judge-program-participants.js',
 'judge-program-officials.js','judge-program-bout.js',
 'judge-program-scoring.js','judge-program-sanctions.js',
 'judge-program-infrastructure.js','judge-program-combat.js',
 'judge-program-beach.js','judge-program-demo.js',
 'judge-program-practicum.js'
];
const digest=b=>createHash('sha256').update(b).digest('hex').slice(0,16);

// Cloudflare Pages may publish a main push after Actions starts; allow a bounded
// convergence window, but never treat a stale or missing asset as a pass.
async function compareOne(base,asset,{attempts=30,waitMs=5000}={}){
 const expected=await readFile(asset);
 const url=new URL(asset,base).toString();
 let detail='no response';
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const response=await fetch(url,{
    cache:'no-store',
    headers:{'Cache-Control':'no-cache'},
    signal:AbortSignal.timeout(15000)
   });
   if(response.ok){
    const actual=Buffer.from(await response.arrayBuffer());
    if(actual.equals(expected))return {asset,ok:true,attempt,detail:'SHA256 '+digest(expected)};
    detail='revision mismatch (local '+digest(expected)+', live '+digest(actual)+')';
   }else detail='HTTP '+response.status;
  }catch(error){detail=String(error?.message||error).slice(0,180);}
  if(attempt<attempts)await delay(waitMs);
 }
 return {asset,ok:false,attempt:attempts,detail};
}

async function selfTest(){
 for(const asset of ['privacy.html','athlete-applied-cases.js','judge-admission-v2.css','judge-admission-exam-v3.js','judge-program-admission-v2.js']){
  assert.ok(assets.includes(asset),'required course asset missing from deployment parity manifest: '+asset);
 }
 assert.equal(new Set(assets).size,assets.length,'deployment parity manifest contains duplicate assets');
 const hits=new Map();
 const server=createServer(async(req,res)=>{
  const asset=new URL(req.url,'http://localhost').pathname.slice(1);
  if(asset==='judge-course-engine.js'||asset==='index.html'){
   const count=(hits.get(asset)||0)+1;hits.set(asset,count);
   res.writeHead(200,{'Content-Type':asset==='index.html'?'text/html':'application/javascript'});
   res.end(count===1?'stale revision':await readFile(asset));
  }else{res.writeHead(404);res.end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port+'/';
  const recovered=await compareOne(base,'judge-course-engine.js',{attempts:3,waitMs:20});
  assert.equal(recovered.ok,true);
  assert.equal(recovered.attempt,2);
  const recoveredShell=await compareOne(base,'index.html',{attempts:3,waitMs:20});
  assert.equal(recoveredShell.ok,true);
  assert.equal(recoveredShell.attempt,2);
  const missing=await compareOne(base,'judge-foundations.css',{attempts:2,waitMs:20});
  assert.equal(missing.ok,false);
  assert.equal(missing.detail,'HTTP 404');
  console.log('PASS: stale JavaScript and HTML revisions are retried and fresh bytes are accepted');
  console.log('PASS: missing deployed asset fails closed');
 }finally{await new Promise(resolve=>server.close(resolve));}
}

if(process.argv.includes('--self-test')){
 await selfTest();
}else{
 const base=process.env.SAMBO_DEPLOYMENT_URL||'https://sambo-academy.pages.dev/';
 const results=await Promise.all(assets.map(asset=>compareOne(base,asset)));
 for(const r of results)console.log((r.ok?'PASS ':'FAIL ')+r.asset+' — '+r.detail+' (attempt '+r.attempt+')');
 const passed=results.filter(r=>r.ok).length;
 console.log('DEPLOYMENT PARITY '+passed+'/'+results.length+' matched checked-out source');
 if(passed!==results.length)process.exitCode=1;
}
