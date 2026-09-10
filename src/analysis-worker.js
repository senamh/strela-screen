import {Input,BlobSource,ALL_FORMATS,CanvasSink} from 'mediabunny';
import {attention,attentionPoints} from './attention.js';
self.onmessage=async({data})=>{
 let input;
 try{
  input=new Input({source:new BlobSource(data.blob),formats:ALL_FORMATS});
  const track=await input.getPrimaryVideoTrack();if(!track||!await track.canDecode())throw new Error('Video analysis is unavailable for this codec.');
  const end=await track.computeDuration(),start=await track.getFirstTimestamp(),step=Math.max(.5,end/2400),sink=new CanvasSink(track,{width:320,poolSize:2});
  const times=[];for(let t=start;t<end;t+=step)times.push(t);
  let previous=null,i=0;const candidates=[];
  for await(const entry of sink.canvasesAtTimestamps(times)){
    if(entry){const c=entry.canvas,pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      if(previous){const hit=attention(previous,pixels,c.width,c.height);if(hit)candidates.push({...hit,t:times[i]});}previous=pixels;
    }else previous=null;
    i++;if(i%4===0)self.postMessage({type:'progress',progress:i/times.length});
  }
  self.postMessage({type:'done',points:attentionPoints(candidates),samples:i});
 }catch(e){self.postMessage({type:'error',error:e.message});}finally{input?.dispose();}
};
