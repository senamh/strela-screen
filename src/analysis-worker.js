import {Input,BlobSource,ALL_FORMATS,CanvasSink} from 'mediabunny';
import {attention,attentionPoints,changeMap,quietRanges} from './attention.js';
import {sampleFrames} from './frame-sampler.js';
self.onmessage=async({data})=>{
 let input;
 try{
  input=new Input({source:new BlobSource(data.blob),formats:ALL_FORMATS});
  const track=await input.getPrimaryVideoTrack();if(!track||!await track.canDecode())throw new Error('Video analysis is unavailable for this codec.');
  const end=await track.computeDuration(),start=await track.getFirstTimestamp(),step=Math.max(.5,end/2400),sink=new CanvasSink(track,{width:320,poolSize:2});
  const times=[];for(let t=start;t<end;t+=step)times.push(t);
  // Decode sequentially: timestamp lookups return no frame between keyframes in
  // cue-less WebM written by MediaRecorder, which includes Strela's own recordings.
  let previous=null,i=0;const candidates=[],samples=[];
  for await(const entry of sampleFrames(sink,times)){
    const c=entry.canvas,pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    // The change happened between the two samples, so its time is their midpoint.
    if(previous){const map=changeMap(previous,pixels,c.width,c.height),hit=attention(previous,pixels,c.width,c.height,map);samples.push({t0:times[i-1],t1:times[i],fraction:map.fraction});if(hit)candidates.push({...hit,t:times[i]-step/2});}previous=pixels;
    i++;if(i%4===0)self.postMessage({type:'progress',progress:i/times.length});
  }
  // Every hit feeds the camera's follow track; the sparser points seed editable shots.
  const follow=candidates.map(h=>[+h.t.toFixed(3),+h.x.toFixed(4),+h.y.toFixed(4)]);
  self.postMessage({type:'done',points:attentionPoints(candidates),samples:i,quiet:quietRanges(samples),track:follow,version:4});
 }catch(e){self.postMessage({type:'error',error:e.message});}finally{input?.dispose();}
};
