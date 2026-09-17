import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {workerJob} from '../src/worker-job.js';
import {analyzeVideo} from '../src/analyze.js';
import {demo} from '../src/media.js';

let workers,originalWorker;
class MockWorker {
  constructor(url,options){this.url=url;this.options=options;this.terminations=0;workers.push(this);}
  postMessage(data){this.posted=data;}
  terminate(){this.terminations++;}
  message(data){this.onmessage?.({data});}
}
beforeEach(()=>{workers=[];originalWorker=globalThis.Worker;globalThis.Worker=MockWorker;});
afterEach(()=>{if(originalWorker===undefined)delete globalThis.Worker;else globalThis.Worker=originalWorker;});

function assertStopped(worker){
  assert.equal(worker.terminations,1);
  for(const name of ['onmessage','onerror','onmessageerror'])assert.equal(worker[name],null);
}

test('worker job forwards progress and payload, then releases its worker on completion',async()=>{
  const payload={example:1},progress=[],job=workerJob('fixture.js',payload,p=>progress.push(p));
  const worker=workers[0];assert.equal(worker.url,'fixture.js');assert.deepEqual(worker.options,{type:'module'});assert.equal(worker.posted,payload);
  worker.message({type:'progress',progress:.5});worker.message({type:'done',value:42});
  assert.deepEqual(await job,{type:'done',value:42});assert.deepEqual(progress,[.5]);assertStopped(worker);
});
test('worker job cancellation rejects promptly and ignores a queued stale completion',async()=>{
  const controller=new AbortController(),job=workerJob('fixture.js',{},null,controller.signal),worker=workers[0],queued=worker.onmessage;
  controller.abort();queued({data:{type:'done',value:'too late'}});
  await assert.rejects(job,e=>e.name==='AbortError');assertStopped(worker);
});
test('an already cancelled job does not create a worker',async()=>{
  const controller=new AbortController();controller.abort();
  await assert.rejects(workerJob('fixture.js',{},null,controller.signal),e=>e.name==='AbortError');assert.equal(workers.length,0);
});
test('completed worker jobs detach their abort listener',async()=>{
  const controller=new AbortController();let removed=0;
  const remove=controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.removeEventListener=(...args)=>{removed++;return remove(...args);};
  const job=workerJob('fixture.js',{},null,controller.signal),worker=workers[0];worker.message({type:'done'});await job;
  controller.abort();assert.equal(removed,1);assertStopped(worker);
});
test('worker-reported processing errors terminate the job',async()=>{
  const job=workerJob('fixture.js',{}),worker=workers[0];worker.message({type:'error',error:'Codec unavailable'});
  await assert.rejects(job,/Codec unavailable/);assertStopped(worker);
});
test('worker runtime and deserialization errors terminate the job',async()=>{
  let job=workerJob('fixture.js',{}),worker=workers.at(-1),prevented=false;
  worker.onerror({message:'Decoder failed',preventDefault(){prevented=true;}});
  await assert.rejects(job,/Decoder failed/);assert(prevented);assertStopped(worker);
  job=workerJob('fixture.js',{});worker=workers.at(-1);worker.onmessageerror({});
  await assert.rejects(job,/unreadable message/);assertStopped(worker);
});
test('worker construction and synchronous postMessage failures reject without leaking a worker',async()=>{
  globalThis.Worker=class{constructor(){throw new Error('Worker unavailable');}};
  await assert.rejects(workerJob('fixture.js',{}),/Worker unavailable/);assert.equal(workers.length,0);
  globalThis.Worker=class extends MockWorker{postMessage(){throw new DOMException('Cannot clone input','DataCloneError');}};
  await assert.rejects(workerJob('fixture.js',{}),e=>e.name==='DataCloneError');assertStopped(workers[0]);
});
test('a failing progress callback rejects and terminates the worker',async()=>{
  const job=workerJob('fixture.js',{},()=>{throw new Error('Progress callback failed');}),worker=workers[0];
  worker.message({type:'progress',progress:.5});await assert.rejects(job,/Progress callback failed/);assertStopped(worker);
});
test('analysis retains its result contract and uses cancellable worker cleanup',async()=>{
  const source=new Blob(['video']),controller=new AbortController(),job=analyzeVideo(source,()=>{},controller.signal),worker=workers[0];
  assert.equal(worker.url,'analysis-worker.js');assert.equal(worker.posted.blob,source);
  controller.abort();await assert.rejects(job,e=>e.name==='AbortError');assertStopped(worker);
  const retry=analyzeVideo(source,()=>{}),result={type:'done',points:[{t:1,x:.5,y:.5}],version:5};workers.at(-1).message(result);
  assert.deepEqual(await retry,result);assertStopped(workers.at(-1));
});
test('demo returns the original Blob/events API from the worker and supports cancellation',async()=>{
  const job=demo(()=>{}),worker=workers[0],events=[{type:'click',t:1.5,x:.25,y:.33}];
  assert.equal(worker.url,'demo-worker.js');worker.message({type:'done',buffer:new Uint8Array([1,2,3]).buffer,mime:'video/webm',events});
  const result=await job;assert.equal(result.blob.type,'video/webm');assert.equal(result.blob.size,3);assert.deepEqual(result.events,events);assertStopped(worker);
  const controller=new AbortController(),cancelled=demo(()=>{},controller.signal);controller.abort();
  await assert.rejects(cancelled,e=>e.name==='AbortError');assertStopped(workers.at(-1));
});
