import {test} from 'node:test';import assert from 'node:assert/strict';
import {size,phoneLayout,render,themes} from '../src/render.js';
import {defaults,validateProject} from '../src/model.js';
test('phone output matches native display and every layout preserves complete source within safe margins',()=>{
 assert.deepEqual(size('phone',1206),[1206,2622]);
 for(const ratio of ['wide','portrait','square','phone'])for(const res of [720,1080,1206,2160])assert(size(ratio,res).every(n=>n>0&&n%2===0));
 for(const [sw,sh]of [[3840,2160],[1920,1080],[5120,1440],[1080,1920]])for(const res of [720,1080,1206,2160]){
  const [W,H]=size('phone',res),{overview:o,detail:d}=phoneLayout(W,H,sw,sh);
  assert.deepEqual(o.crop,{x:0,y:0,w:sw,h:sh});assert(Math.abs(o.w/o.h-sw/sh)<1e-8);
  for(const r of [o,d])assert(r.x>=0&&r.y>=H*.05&&r.x+r.w<=W&&r.y+r.h<=H*.93&&r.w>0&&r.h>0);
  assert(o.y+o.h<d.y);
 }
});
test('black phone render draws overview and detail, never click waves',()=>{
 const draws=[],colors=[],ctx={createLinearGradient:()=>({addColorStop:(_,c)=>colors.push(c)}),fillRect(){},save(){},restore(){},beginPath(){},roundRect(){},clip(){},drawImage:(...args)=>draws.push(args),arc(){throw Error('Click wave');}};
 const p=validateProject({version:1,duration:4,clips:[{start:0,end:4}],points:[{t:1,x:0,y:1}],events:[{type:'click',t:1,x:0,y:1}],settings:{...defaults,ratio:'phone',theme:'black',clicks:true,resolution:1206}});
 const g=render({width:1206,height:2622,getContext:()=>ctx},{},3840,2160,p,1);
 assert.equal(draws.length,2);assert.deepEqual(draws[0].slice(1,5),[0,0,3840,2160]);assert(colors.every(c=>c==='#000000'));assert(g.crop.x>=0&&g.crop.y+g.crop.h<=2160);assert.equal(ctx.imageSmoothingQuality,'high');
});
