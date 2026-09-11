import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleFrames} from '../src/frame-sampler.js';
test('variable-frame-rate capture holds the latest frame across gaps and after the last update',async()=>{
  let closed=false;
  const sink={async* canvases(){try{for(const timestamp of [0,1,4.8,7])yield {timestamp,canvas:timestamp};}finally{closed=true;}}};
  const results=[];
  for await(const frame of sampleFrames(sink,[0,.5,1,2.25,4.7,4.8,6,7,8]))results.push(frame.timestamp);
  assert.deepEqual(results,[0,0,1,1,1,4.8,4.8,7,7]);assert(closed);
});
test('sampler closes the decoder on early cancellation and rejects empty media',async()=>{
  let closed=false;
  const sink={async* canvases(){try{yield {timestamp:0};yield {timestamp:1};yield {timestamp:2};}finally{closed=true;}}};
  for await(const frame of sampleFrames(sink,[0,1,2])){assert.equal(frame.timestamp,0);break;}
  assert(closed);
  await assert.rejects(async()=>{for await(const frame of sampleFrames({async* canvases(){}},[0]))void frame;},/no decodable/);
});
test('long gaps restart decoding at the next timestamp when jumping is allowed',async()=>{
  const starts=[],sink={async* canvases(start=0){starts.push(start);for(let t=Math.floor(start);t<60;t++)yield {timestamp:t};}};
  const seen=[];for await(const f of sampleFrames(sink,[0,1,30,31,33,50],{jump:5}))seen.push(f.timestamp);
  assert.deepEqual(seen,[0,1,30,31,33,50]);assert.deepEqual(starts,[0,30,50]);
  starts.length=0;for await(const f of sampleFrames(sink,[0,30]))void f;assert.deepEqual(starts,[0]);
});
