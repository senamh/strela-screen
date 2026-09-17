import {test} from 'node:test';
import assert from 'node:assert/strict';
import {needsPreviewFrame,watchPreviewInvalidation,primePreviewFrame} from '../src/preview-state.js';
import {sourceTime} from '../src/model.js';
const paused={readyState:2,paused:true,busy:false,dirty:false,time:2,paintedTime:2};
test('paused preview does not continuously render an unchanged frame',()=>{
 assert.equal(needsPreviewFrame(paused),false);
 assert.equal(needsPreviewFrame({...paused,dirty:true}),true);
 assert.equal(needsPreviewFrame({...paused,time:3}),true);
});
test('analysis/export skip preview work, resuming with the pending edit',()=>{
 assert.equal(needsPreviewFrame({...paused,dirty:true,busy:true}),false);
 assert.equal(needsPreviewFrame({...paused,dirty:true,busy:false}),true);
 assert.equal(needsPreviewFrame({...paused,paused:false}),true);
 assert.equal(needsPreviewFrame({...paused,dirty:true,readyState:1}),false);
});
test('restored tabs, resized viewports and restored canvases invalidate a paused preview',()=>{
 const canvas=new EventTarget(),video=new EventTarget(),document=new EventTarget(),window=new EventTarget();
 document.visibilityState='visible';let dirty=false;
 const stop=watchPreviewInvalidation({canvas,video,document,window},()=>{dirty=true;});
 for(const [target,type] of [[window,'resize'],[window,'pageshow'],[canvas,'contextrestored'],[document,'visibilitychange']]){
  dirty=false;target.dispatchEvent(new Event(type));assert.equal(dirty,true,type);
  assert.equal(needsPreviewFrame({...paused,dirty}),true);
  dirty=false;assert.equal(needsPreviewFrame({...paused,dirty}),false,'no continuous repaint after recovery');
 }
 document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));assert.equal(dirty,false);
 stop();window.dispatchEvent(new Event('resize'));assert.equal(dirty,false);
});
test('new decoded images invalidate at the same timestamp without rendering while busy',()=>{
 const canvas=new EventTarget(),video=new EventTarget(),document=new EventTarget(),window=new EventTarget();let dirty=false;
 const stop=watchPreviewInvalidation({canvas,video,document,window},()=>{dirty=true;});
 for(const type of ['loadeddata','canplay','seeked']){
  dirty=false;video.dispatchEvent(new Event(type));assert.equal(dirty,true,type);
  assert.equal(needsPreviewFrame({...paused,dirty,busy:true}),false);
  assert.equal(needsPreviewFrame({...paused,dirty,busy:false}),true);
 }
 stop();dirty=false;video.dispatchEvent(new Event('seeked'));canvas.dispatchEvent(new Event('contextrestored'));assert.equal(dirty,false);
});

class PreviewVideo extends EventTarget {
 constructor(){super();this.readyState=4;this.seeking=false;this.value=0;this.listeners=new Set();this.assignments=[];}
 get currentTime(){return this.value;}
 set currentTime(value){this.value=value;this.assignments.push(value);this.seeking=true;}
 addEventListener(type,listener){super.addEventListener(type,listener);this.listeners.add(listener);}
 removeEventListener(type,listener){super.removeEventListener(type,listener);this.listeners.delete(listener);}
 finishSeek(){this.seeking=false;this.dispatchEvent(new Event('seeked'));}
}
test('initial preview explicitly seeks at zero and waits for its decoded frame',async()=>{
 const video=new PreviewVideo();let done=false;
 const job=primePreviewFrame(video,0).then(()=>{done=true;});
 await Promise.resolve();assert.equal(done,false);assert.deepEqual(video.assignments,[0]);
 video.finishSeek();await job;assert.equal(done,true);assert.equal(video.currentTime,0);assert.equal(video.listeners.size,0);
});
test('initial preview uses the first kept clip without moving timeline zero',async()=>{
 const video=new PreviewVideo(),timelineTime=0,clips=[{start:3.25,end:8},{start:10,end:12}];
 const job=primePreviewFrame(video,sourceTime(clips,timelineTime));
 assert.equal(video.currentTime,3.25);assert.equal(timelineTime,0);video.finishSeek();await job;assert.equal(video.listeners.size,0);
});
test('initial preview releases listeners after video errors and seek timeouts',async()=>{
 const video=new PreviewVideo(),job=primePreviewFrame(video,0);video.error={message:'Decode failed'};video.dispatchEvent(new Event('error'));
 await assert.rejects(job,/Decode failed/);assert.equal(video.listeners.size,0);
 const stalled=new PreviewVideo();await assert.rejects(primePreviewFrame(stalled,0,{timeout:1}),/timed out/);assert.equal(stalled.listeners.size,0);
});
test('initial preview accepts immediately available seeks and cleans up setter failures',async()=>{
 const immediate=new PreviewVideo();Object.defineProperty(immediate,'currentTime',{set(value){this.value=value;},get(){return this.value;}});
 await primePreviewFrame(immediate,0);assert.equal(immediate.listeners.size,0);
 const broken=new PreviewVideo();Object.defineProperty(broken,'currentTime',{set(){throw new Error('Seek rejected');}});
 await assert.rejects(primePreviewFrame(broken,0),/Seek rejected/);assert.equal(broken.listeners.size,0);
});
