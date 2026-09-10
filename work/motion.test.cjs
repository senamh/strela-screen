const assert=require('node:assert/strict');
const {camera}=require('../motion.js');
assert.deepEqual(camera([],0,1920,1080),{x:0,y:0,w:1920,h:1080});
const points=[{t:2,x:.1,y:.2},{t:3,x:.9,y:.8}];
let previous;
for(let t=-1;t<7;t+=.001){
 const c=camera(points,t,1920,1080);
 assert(c.x>=0&&c.y>=0&&c.x+c.w<=1920.00001&&c.y+c.h<=1080.00001);
 if(previous)assert(Math.abs(c.x-previous.x)<5,'camera discontinuity');
 previous=c;
}
assert.deepEqual(camera(points,6,1920,1080),{x:0,y:0,w:1920,h:1080});
assert.deepEqual(camera(points,2.5,1920,1080),camera([...points].reverse(),2.5,1920,1080));
console.log('Camera tests passed: boundaries, overlapping transitions, order independence, full-frame return.');
