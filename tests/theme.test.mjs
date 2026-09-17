import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../ui/theme.css',import.meta.url),'utf8');
const token=name=>{const value=css.match(new RegExp('--'+name+':\\s*(#[a-f0-9]{6});','i'))?.[1];assert(value,name);return value;};
const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(token(a)),y=luminance(token(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('red interface preserves readable text and visible keyboard focus',()=>{
 for(const pair of [['text','bg'],['muted','surface'],['on-primary','primary'],['on-primary','primary-hover']])assert(contrast(...pair)>=4.5,pair.join('/')+' contrast');
 assert(contrast('focus','surface')>=3);
});
test('primary action and editable field boundaries remain distinct from panels',()=>{
 assert(contrast('primary','surface')>=4.5);
 assert(contrast('control-line','surface-raised')>=3);
 assert(contrast('text','accent-tint')>=4.5);
});
test('import and recording are reachable above preview with unique controller IDs',async()=>{
 const html=await readFile(new URL('../ui/editor.html',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const id of ['file','new-record'])assert(html.indexOf('id="'+id+'"')<html.indexOf('id="preview"'));
 assert(html.includes('aria-label="Import video or Strela project"'));
 assert.equal((html.match(/class="settings-group"/g)||[]).length,3);
});
test('editor and popup load the same packaged interface palette',async()=>{
 for(const file of ['editor.html','popup.html']){const html=await readFile(new URL('../dist/strela-screen/'+file,import.meta.url),'utf8');assert(html.indexOf('href="theme.css"')<html.indexOf('href="'+file.replace('html','css')+'"'));}
 assert.equal(await readFile(new URL('../dist/strela-screen/theme.css',import.meta.url),'utf8'),css);
});
