import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildInfo,fingerprint} from '../scripts/build-info.mjs';

test('build fingerprint is stable across file order but changes with content or names',()=>{
  const files=[['a.js',Buffer.from('one')],['b.js',Buffer.from('two')]],id=fingerprint(files);
  assert.match(id,/^[a-f0-9]{12}$/);
  assert.equal(id,fingerprint([...files].reverse()));
  assert.notEqual(id,fingerprint([files[0],['b.js',Buffer.from('new')]]));
  assert.notEqual(id,fingerprint([files[0],['c.js',Buffer.from('two')]]));
  assert.notEqual(fingerprint([['ab','c']]),fingerprint([['a','bc']]));
});
test('built editor and popup identify the exact runtime inputs without network requests',async()=>{
  const expected=await buildInfo(process.cwd()),root='dist/strela-screen/';
  assert.deepEqual(JSON.parse(await readFile(root+'build-info.json','utf8')),expected);
  for(const name of ['app','popup']){
    const script=await readFile(root+name+'.js','utf8');
    assert(script.includes(expected.id));assert(!script.includes('__STRELA_BUILD_LABEL__'));
  }
  for(const name of ['editor','popup'])assert((await readFile(root+name+'.html','utf8')).includes('id="build-info"'));
});
