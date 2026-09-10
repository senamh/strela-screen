import {test}from'node:test';import assert from'node:assert/strict';import {attention,attentionPoints}from'../src/attention.js';
const W=240,H=160,blank=()=>new Uint8ClampedArray(W*H*4);
function rect(a,x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const k=(j*W+i)*4;a[k]=a[k+1]=a[k+2]=255;}return a;}
test('localized UI change produces a valid focus near changed control',()=>{const a=blank(),b=rect(blank(),140,50,30,20),hit=attention(a,b,W,H);assert(hit);assert(Math.abs(hit.x-155/W)<.06);assert(Math.abs(hit.y-60/H)<.06);});
test('static frames, tiny blinking pixels, scene cuts and distributed changes do not trigger focus',()=>{assert.equal(attention(blank(),blank(),W,H),null);assert.equal(attention(blank(),rect(blank(),50,50,2,2),W,H),null);assert.equal(attention(blank(),rect(blank(),0,0,W,H),W,H),null);const b=rect(rect(blank(),10,10,30,20),180,120,30,20);assert.equal(attention(blank(),b,W,H),null);});
test('focus density is limited and points are tagged as visual rather than fake clicks',()=>{const p=attentionPoints([0,.5,1,3,3.5].map(t=>({t,x:.4,y:.6})));assert.deepEqual(p.map(x=>x.t),[0,3]);assert(p.every(x=>x.origin==='visual-change'&&x.auto));});
