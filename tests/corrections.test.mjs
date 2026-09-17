import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,camera,validateProject,timeline,timelineTime,sourceTime,duration,History,mergeFocus,markManual} from '../src/model.js';
import {containCrop,render,size} from '../src/render.js';
const base=()=>({id:'test',version:1,duration:40,clips:[{start:0,end:40}],points:[],settings:{...defaults}});
test('regenerating focus preserves edits without duplicating replaced automatic cues',()=>{
 const point={id:'a',t:3,x:.3,y:.4,auto:true};markManual(point);Object.assign(point,{t:6,x:.8,zoom:2});markManual(point);
 const generated=[{id:'new-a',t:3.1,x:.3,y:.4,auto:true},{id:'b',t:8,x:.6,y:.6,auto:true}];
 assert.deepEqual(mergeFocus([point],generated),[point,generated[1]]);assert.equal(point.replaces.t,3);
 assert.equal(mergeFocus([point],[{...generated[0],id:'a',t:15}]).length,1);
 const loaded=validateProject({...base(),points:[{t:1,x:.5,y:.5},{t:2,x:.5,y:.5}]});assert(loaded.points.every(p=>p.id));assert.notEqual(loaded.points[0].id,loaded.points[1].id);
});
test('per-focus zoom and hold override defaults and invalidate camera cache',()=>{
 const p={t:4,x:.5,y:.5,zoom:2.5,hold:6};
 assert(Math.abs(1920/camera([p],6,1920,1080).w-2.5)<.01);
 assert(Math.abs(1920/camera([p],9,1920,1080).w-2.5)<.01);
 const changed={...p,zoom:1.2,hold:.5};assert(Math.abs(1920/camera([changed],4,1920,1080).w-1.2)<.01);
 assert(Math.abs(camera([changed],9,1920,1080).w-1920)<.01);
});
test('nearby manually adjusted points are not merged',()=>{
 const points=[{t:4,x:.5,y:.5,zoom:1.3,hold:.2},{t:5,x:.5,y:.5,zoom:2.7,hold:2}];
 assert(1920/camera(points,5.4,1920,1080).w>2.6);
});
test('protected area stays in every frame across aspects, source sizes and camera moves',()=>{
 for(const [width,height] of [[1920,1080],[5120,1440],[1080,1920]])for(const aspect of [16/9,9/16,1,1206/1800])for(const keepArea of [{x:0,y:0,w:1,h:1},{x:.05,y:.1,w:.9,h:.15},{x:.8,y:.7,w:.2,h:.3}]){
  let prev;for(let t=0;t<10;t+=.05){const c=camera([{t:2,x:.05,y:.1,zoom:3},{t:5,x:.95,y:.9,zoom:2}],t,width,height,{...defaults,keepArea},aspect,null,[[3,.8,.7],[3.5,.82,.72]]);
   const e=1e-6;assert(c.x>=-e&&c.y>=-e&&c.x+c.w<=width+e&&c.y+c.h<=height+e);
   assert(c.x<=keepArea.x*width+e&&c.y<=keepArea.y*height+e&&c.x+c.w>=(keepArea.x+keepArea.w)*width-e&&c.y+c.h>=(keepArea.y+keepArea.h)*height-e);
   if(prev){assert(Math.abs(c.x-prev.x)<width*.15);assert(Math.abs(c.w-prev.w)<width*.15);}prev=c;
  }
 }
});
test('protected content is contained without stretching or rounded-corner clipping in all exports',()=>{
 for(const ratio of ['wide','portrait','square','phone'])for(const res of [720,1080,1206,2160]){
  const draws=[],radii=[],ctx={createLinearGradient:()=>({addColorStop(){}}),fillRect(){},save(){},restore(){},beginPath(){},roundRect:(x,y,w,h,r)=>radii.push(r),fill(){},clip(){},drawImage:(...a)=>draws.push(a)};
  const [width,height]=size(ratio,res),p={...base(),points:[{t:2,x:.8,y:.8}],settings:{...defaults,ratio,keepArea:{x:0,y:0,w:1,h:1}}};
  render({width,height,getContext:()=>ctx},{},1920,1080,p,2);
  for(const [,x,y,w,h,dx,dy,dw,dh] of draws){assert(Math.abs(w/h-dw/dh)<1e-8);assert(dx>=0&&dy>=0&&dx+dw<=width+1e-6&&dy+dh<=height+1e-6);assert.equal(x,0);assert.equal(y,0);}
  assert(radii.every(r=>r===0));
 }
 const g=containCrop({x:0,y:0,w:100,h:200,crop:{w:200,h:100}});assert.equal(g.h,50);assert.equal(g.y,75);
});
test('reading intervals and focus actions remain at normal pace through trimmed output',()=>{
 const p={...base(),clips:[{start:2,end:18},{start:22,end:38}],keepTime:[[8,13],[11,16],[24,27]],points:[{t:30,x:.5,y:.5,hold:4}],analysis:{quiet:[[2,38]]},settings:{...defaults,speedup:true}};
 const clips=timeline(p);assert(duration(clips)<32);
 for(const t of [8,10,12,15.9,24,26.9,29.5,31,33.9]){assert.equal(clips.find(c=>t>=c.start&&t<c.end)?.speed||1,1);assert(Math.abs(sourceTime(clips,timelineTime(clips,t))-t)<1e-8);}
 assert.equal(timelineTime(clips,20),null);
});
test('corrections survive validation and undo; corrupt imports are rejected',()=>{
 const p={...base(),points:[{id:'focus',t:3,x:.4,y:.5,hold:6,zoom:2}],keepTime:[[4,9]],settings:{...defaults,keepArea:{x:.2,y:.3,w:.5,h:.5}}};
 assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))).keepTime,p.keepTime);
 const history=new History();history.push(p);p.points[0].zoom=3;assert.equal(history.undo(p).points[0].zoom,2);
 for(const bad of [{hold:NaN},{hold:0},{zoom:4},{w:-1}])assert.throws(()=>validateProject({...p,points:[{...p.points[0],...bad}]}));
 for(const keepTime of [null,[[9,4]],[[-1,4]],[[0,41]],[[0,Infinity]]])assert.throws(()=>validateProject({...p,keepTime}));
 for(const keepArea of [{x:0,y:0,w:2,h:1},{x:0,y:0,w:0,h:1},{x:NaN,y:0,w:1,h:1}])assert.throws(()=>validateProject({...p,settings:{...defaults,keepArea}}));
 assert.equal(validateProject(base()).settings.keepArea,undefined);
});
