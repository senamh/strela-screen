import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {defaults,validateProject,outputRate} from '../src/model.js';
import {render,size,themes} from '../src/render.js';

const project=settings=>({version:1,duration:4,clips:[{start:0,end:4}],points:[],settings});
test('new projects and projects without a saved backdrop default to black',()=>{
  assert.equal(defaults.theme,'black');
  assert.equal(validateProject(project()).settings.theme,'black');
  assert.equal(validateProject(project({ratio:'phone'})).settings.theme,'black');
});
test('opening a saved project preserves its explicitly chosen backdrop',()=>{
  for(const theme of Object.keys(themes))assert.equal(validateProject(project({theme})).settings.theme,theme);
});
test('the default renderer paints a pure black backdrop in every canvas format',()=>{
  for(const ratio of ['wide','portrait','square','phone']){
    const colors=[],fills=[],gradient={addColorStop:(_,color)=>colors.push(color)};
    const ctx={createLinearGradient:()=>gradient,fillRect(...rect){fills.push({style:this.fillStyle,rect});},save(){},restore(){},beginPath(){},roundRect(){},clip(){},fill(){}};
    const [width,height]=size(ratio,1080);
    render({width,height,getContext:()=>ctx},null,1920,1080,validateProject(project({ratio})),0);
    assert.deepEqual(colors,['#000000','#000000','#000000']);
    assert.deepEqual(fills,[{style:gradient,rect:[0,0,width,height]}]);
  }
});
test('the initial editor swatch and all presets match the black default',async()=>{
  const html=await readFile(new URL('../ui/editor.html',import.meta.url),'utf8');
  const swatches=[...html.matchAll(/<button\b[^>]*data-theme="([^"]+)"[^>]*>/g)];
  assert.deepEqual(swatches.filter(([tag])=>/class="[^"]*\bselected\b/.test(tag)).map(([,theme])=>theme),[defaults.theme]);
  const source=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  const handler=source.split('\n').find(line=>line.startsWith("$('preset').onchange="));
  assert(handler);
  const preset={value:'product'},p=project({theme:'lavender'});
  vm.runInNewContext(handler,{$:()=>preset,edit:fn=>fn(),project:p,defaults,outputRate});
  for(const value of ['product','tutorial','social','phone']){
    p.settings.theme='lavender';preset.value=value;preset.onchange();
    assert.equal(p.settings.theme,'black',value);
  }
});
