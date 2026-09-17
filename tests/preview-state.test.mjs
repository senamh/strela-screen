import {test} from 'node:test';
import assert from 'node:assert/strict';
import {needsPreviewFrame} from '../src/preview-state.js';
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
