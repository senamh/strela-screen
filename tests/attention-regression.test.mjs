import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changeMap,analyseAttention,attentionPoints,quietRanges} from '../src/attention.js';
import {scenarios,W,H} from './fixtures/attention-scenarios.mjs';
for(const scenario of scenarios)test('screen regression: '+scenario.name,()=>{
  const frames=scenario.frames.slice(1).map((f,i)=>({t:(f.t+scenario.frames[i].t)/2,map:changeMap(scenario.frames[i].pixels,f.pixels,W,H)}));
  const {candidates}=analyseAttention(frames);
  assert.equal(candidates.length,scenario.hits);
  if(scenario.target){const hit=candidates.at(-1);assert(Math.abs(hit.x-scenario.target[0])<.06);assert(Math.abs(hit.y-scenario.target[1])<.06);}
  if(scenario.points)assert.equal(attentionPoints(candidates).length,scenario.points);
});
test('filtered background changes are not relabelled as idle time',()=>{
  const {frames}=scenarios[11],samples=frames.slice(1).map((f,i)=>({t0:frames[i].t,t1:f.t,fraction:changeMap(frames[i].pixels,f.pixels,W,H).fraction}));
  assert.deepEqual(quietRanges(samples),[]);
});
