import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
test('reopening the popup updates the reused studio source and focuses its window',async()=>{
  const button={},calls=[],message={};let closed=false;
  const chrome={runtime:{getURL:x=>'chrome-extension://strela/'+x,getContexts:async()=>[{documentUrl:'chrome-extension://strela/editor.html?target=1',tabId:9,windowId:2}],sendMessage:async m=>Object.assign(message,m)},tabs:{query:async()=>[{id:7}],update:async(...args)=>calls.push(args)},windows:{update:async(...args)=>calls.push(args)}};
  vm.runInNewContext(await readFile('src/popup.js','utf8'),{chrome,document:{querySelector:()=>button},window:{close:()=>closed=true}});
  await button.onclick();assert.equal(message.type,'SELECT_SOURCE');assert.equal(message.target,7);assert.equal(message.studio,9);assert.equal(calls[0][0],9);assert.equal(calls[1][0],2);assert(closed);
});
