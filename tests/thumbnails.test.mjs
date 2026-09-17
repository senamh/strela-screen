import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {sampleFrames} from '../src/frame-sampler.js';

const mediaSource=await readFile(new URL('../src/media.js',import.meta.url),'utf8');
const implementation=mediaSource.slice(mediaSource.indexOf('export async function thumbnails'),mediaSource.indexOf('// A deterministic')).replace('export ','');
const appSource=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const lifecycle=appSource.slice(appSource.indexOf('function cancelThumbnails'),appSource.indexOf('function refreshButtons'));
const cancelHandler=appSource.match(/^\$\('cancel'\)\.onclick=.*$/m)?.[0].replace("$('cancel').onclick=",'this.cancel=');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));

function mediaHarness({blockAt=null,fallback=false,fail=false}={}){
  const started=deferred(),stats={inputs:0,disposed:0,lookups:0,sequential:0,closed:0};
  const wait=input=>{started.resolve();return new Promise((resolve,reject)=>{input.rejectPending=reject;});};
  class Input {
    constructor(){stats.inputs++;this.track={input:this,computeDuration:async()=>3,getFirstTimestamp:async()=>0};}
    async getPrimaryVideoTrack(){if(blockAt==='metadata')await wait(this);return this.track;}
    dispose(){stats.disposed++;this.rejectPending?.(new Error('InputDisposedError'));}
  }
  class CanvasSink {
    constructor(track){this.input=track.input;}
    async* canvasesAtTimestamps(times){
      stats.lookups++;try{
        if(blockAt==='timestamps')await wait(this.input);
        if(fail)throw new Error('Decoder failed');
        for(const timestamp of times)yield fallback?null:{canvas:{toDataURL:()=>String(timestamp)}};
      }finally{stats.closed++;}
    }
    async* canvases(){
      stats.sequential++;try{
        if(blockAt==='fallback')await wait(this.input);
        for(const timestamp of [0,1,2,3])yield {timestamp,canvas:{toDataURL:()=>String(timestamp)}};
      }finally{stats.closed++;}
    }
  }
  const context={Input,BlobSource:class {},ALL_FORMATS:[],CanvasSink,sampleFrames,DOMException};
  runInNewContext(implementation+';this.run=thumbnails;',context);
  return {run:context.run,stats,started:started.promise};
}

test('cancelled thumbnails do not create an input',async()=>{
  const h=mediaHarness(),controller=new AbortController();controller.abort();
  await assert.rejects(h.run(new Blob(),3,controller.signal),error=>error.name==='AbortError');
  assert.equal(h.stats.inputs,0);
});

test('completed thumbnails dispose once and detach their abort listener',async()=>{
  const h=mediaHarness(),controller=new AbortController();let removed=0;
  const remove=controller.signal.removeEventListener.bind(controller.signal);
  controller.signal.removeEventListener=(...args)=>{removed++;return remove(...args);};
  assert.deepEqual([...await h.run(new Blob(),3,controller.signal)],['0','1','2']);
  assert.equal(h.stats.disposed,1);assert.equal(removed,1);controller.abort();assert.equal(h.stats.disposed,1);
});

for(const stage of ['metadata','timestamps','fallback'])test(`thumbnail cancellation interrupts pending ${stage} work and closes its input`,async()=>{
  const h=mediaHarness({blockAt:stage,fallback:stage==='fallback'}),controller=new AbortController();
  const job=h.run(new Blob(),3,controller.signal);await h.started;controller.abort();
  assert.equal(h.stats.disposed,1,'abort disposes synchronously, without waiting for another frame');
  await assert.rejects(job,error=>error.name==='AbortError');assert.equal(h.stats.disposed,1);
  assert.equal(h.stats.closed,stage==='metadata'?0:stage==='fallback'?2:1);
});

test('cue-less WebM thumbnails retain the sequential fallback',async()=>{
  const h=mediaHarness({fallback:true});
  assert.deepEqual([...await h.run(new Blob(),3)],['0','1','2']);
  assert.equal(h.stats.lookups,1);assert.equal(h.stats.sequential,1);assert.equal(h.stats.closed,2);assert.equal(h.stats.disposed,1);
});

test('thumbnail decoder errors retain the original failure and release resources',async()=>{
  const h=mediaHarness({fail:true});
  await assert.rejects(h.run(new Blob(),3),/Decoder failed/);assert.equal(h.stats.disposed,1);
});

function lifecycleHarness(){
  const timers=new Map(),jobs=[];let timerId=0,refreshes=0;
  const context={busy:false,project:{id:'same-project'},blob:new Blob(['first']),thumbs:[],thumbnailPending:true,thumbnailGeneration:1,thumbnailTimer:null,thumbnailController:null,AbortController,
    setTimeout:callback=>{timers.set(++timerId,callback);return timerId;},clearTimeout:id=>timers.delete(id),refresh:()=>refreshes++,
    thumbnails:(source,count,signal)=>{const job={...deferred(),source,count,signal};jobs.push(job);return job.promise;}};
  runInNewContext(lifecycle,context);
  return {context,jobs,timers,get refreshes(){return refreshes;},tick(){const callbacks=[...timers.values()];timers.clear();for(const callback of callbacks)callback();}};
}

test('thumbnails wait until processing is idle and run only once after success',async()=>{
  const h=lifecycleHarness(),c=h.context;c.busy=true;c.queueThumbnails();assert.equal(h.timers.size,0);
  c.busy=false;c.queueThumbnails();c.queueThumbnails();assert.equal(h.timers.size,1);h.tick();assert.equal(h.jobs.length,1);
  h.jobs[0].resolve(['ready']);await settle();assert.deepEqual([...c.thumbs],['ready']);assert.equal(h.refreshes,1);
  c.queueThumbnails();h.tick();assert.equal(h.jobs.length,1);
});

test('an immediate automatic export cancels queued thumbnails before a decoder starts',()=>{
  const h=lifecycleHarness(),c=h.context;c.queueThumbnails();c.busy=true;c.cancelThumbnails();h.tick();assert.equal(h.jobs.length,0);
  c.busy=false;c.queueThumbnails();h.tick();assert.equal(h.jobs.length,1);
});

test('busy work aborts active thumbnails and stale completion cannot replace a same-id reopened project',async()=>{
  const h=lifecycleHarness(),c=h.context;c.queueThumbnails();h.tick();const first=h.jobs[0];
  c.busy=true;c.cancelThumbnails();assert(first.signal.aborted);assert.equal(c.thumbnailController,null);
  c.project={id:'same-project'};c.blob=new Blob(['replacement']);c.thumbnailGeneration++;c.thumbnailPending=true;
  c.busy=false;c.queueThumbnails();h.tick();const second=h.jobs[1],active=c.thumbnailController;
  first.resolve(['stale']);await settle();assert.equal(h.refreshes,0);assert.equal(c.thumbnailController,active);
  second.resolve(['current']);await settle();assert.deepEqual([...c.thumbs],['current']);assert.equal(h.refreshes,1);
});

test('a generation change rejects a late thumbnail result even if the project id is unchanged',async()=>{
  const h=lifecycleHarness(),c=h.context;c.queueThumbnails();h.tick();c.thumbnailGeneration++;
  h.jobs[0].resolve(['stale']);await settle();assert.equal(h.refreshes,0);assert.deepEqual([...c.thumbs],[]);
});

test('thumbnail failures do not schedule automatic retry loops',async()=>{
  const h=lifecycleHarness(),c=h.context;c.queueThumbnails();h.tick();h.jobs[0].reject(new Error('Unsupported codec'));await settle();
  c.queueThumbnails();h.tick();assert.equal(h.jobs.length,1);assert.equal(c.thumbnailController,null);assert.equal(c.thumbnailPending,false);
});

for(const operation of ['analysis','export','demo'])test(`explicit ${operation} cancellation leaves no active or queued thumbnail decoder`,async()=>{
  const h=lifecycleHarness(),c=h.context;c.queueThumbnails();h.tick();c.busy=true;
  c.demoController=operation==='demo'?new AbortController():null;c.analysisController=operation==='analysis'?new AbortController():null;
  c.finishExport=()=>{c.busy=false;c.queueThumbnails();};c.say=()=>{};
  runInNewContext(cancelHandler,c);c.cancel();
  assert(h.jobs[0].signal.aborted);assert.equal(c.thumbnailController,null);assert.equal(c.thumbnailPending,false);
  // Analysis/demo finish in their async finally blocks after the click handler returns.
  c.busy=false;c.queueThumbnails();h.tick();assert.equal(h.jobs.length,1);assert.equal(h.timers.size,0);
  h.jobs[0].resolve(['late cancelled result']);await settle();assert.equal(h.refreshes,0);
});
