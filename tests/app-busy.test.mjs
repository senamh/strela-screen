import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

test('entering a busy operation pauses playback before suspending timeline updates',async()=>{
 const source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 const implementation=source.match(/^function setBusy\(value\)\{.*\}$/m)?.[0];
 assert(implementation,'setBusy controller is available for an isolated state-transition check');
 const order=[],control={disabled:false};
 const context={busy:false,previewDirty:false,stopPlayback:()=>order.push('pause'),cancelThumbnails:()=>order.push('cancel thumbnails'),queueThumbnails:()=>order.push('queue thumbnails'),document:{querySelectorAll:()=>[control]},refreshButtons:()=>order.push('refresh')};
 runInNewContext(implementation+';setBusy(true);',context);
 assert.deepEqual(order,['pause','cancel thumbnails','refresh']);assert.equal(context.busy,true);assert.equal(context.previewDirty,true);assert.equal(control.disabled,true);
 order.length=0;runInNewContext('setBusy(false)',context);
 assert.deepEqual(order,['refresh','queue thumbnails']);assert.equal(context.busy,false);assert.equal(control.disabled,false);
});
