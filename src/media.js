import {Input,BlobSource,ALL_FORMATS,CanvasSink,EncodedPacketSink} from 'mediabunny';
import {sampleFrames} from './frame-sampler.js';
import {workerJob} from './worker-job.js';
// Median spacing of the first packets, read from the container without decoding. The median ignores
// the long gaps that variable-rate screen capture leaves on static screens.
async function frameRate(track){
  const times=[];for await(const p of new EncodedPacketSink(track).packets(undefined,undefined,{metadataOnly:true})){times.push(p.timestamp);if(times.length>=240)break;}
  times.sort((a,b)=>a-b);const gaps=times.slice(1).map((t,i)=>t-times[i]).filter(d=>d>1e-4).sort((a,b)=>a-b);
  return gaps.length?1/gaps[Math.floor(gaps.length/2)]:0;
}
// Export validation reads container metadata only, so an HEVC file this browser cannot decode still passes.
export async function inspect(blob,{decode=true}={}){
  const input=new Input({source:new BlobSource(blob),formats:ALL_FORMATS});
  try{const track=await input.getPrimaryVideoTrack();if(!track||decode&&!await track.canDecode())throw new Error('Unsupported video. Use MP4 or WebM.');return {duration:await track.computeDuration(),width:await track.getDisplayWidth(),height:await track.getDisplayHeight(),mediaStart:await track.getFirstTimestamp(),audio:!!await input.getPrimaryAudioTrack(),sourceFps:decode?await frameRate(track):0};}finally{input.dispose();}
}
export async function thumbnails(blob,count=10,signal){
  const checkCancelled=()=>{if(signal?.aborted)throw new DOMException('Thumbnail generation cancelled.','AbortError');};
  checkCancelled();
  const input=new Input({source:new BlobSource(blob),formats:ALL_FORMATS});let disposed=false;
  // Disposing the input interrupts pending reads and closes the sink's decoder immediately.
  const dispose=()=>{if(!disposed){disposed=true;input.dispose();}};
  signal?.addEventListener('abort',dispose,{once:true});
  try{
    const track=await input.getPrimaryVideoTrack();checkCancelled();
    if(!track)throw new Error('The video has no track for thumbnails.');
    const length=await track.computeDuration();checkCancelled();
    const start=await track.getFirstTimestamp();checkCancelled();
    const times=Array.from({length:count},(_,i)=>Math.max(start,length*i/count));let result=[];
    for await(const entry of new CanvasSink(track,{width:160}).canvasesAtTimestamps(times)){checkCancelled();if(entry)result.push(entry.canvas.toDataURL());}
    checkCancelled();
    // Cue-less WebM (MediaRecorder) misses timestamp lookups; decode it in order instead.
    if(result.length<count){result=[];for await(const entry of sampleFrames(new CanvasSink(track,{width:160,poolSize:2}),times)){checkCancelled();result.push(entry.canvas.toDataURL());}}
    checkCancelled();return result;
  }catch(error){checkCancelled();throw error;}
  finally{signal?.removeEventListener('abort',dispose);dispose();}
}
// A deterministic, original fixture exercises the real decoder, audio and exporter.
export async function demo(onProgress,signal){
  const result=await workerJob('demo-worker.js',{},onProgress,signal);
  return {blob:new Blob([result.buffer],{type:result.mime}),events:result.events};
}
