import {Input,BlobSource,ALL_FORMATS,CanvasSink,AudioSampleSink,AudioSample,Output,BufferTarget,CanvasSource,AudioSampleSource,Mp4OutputFormat,WebMOutputFormat,Quality,canEncodeVideo,canEncodeAudio} from 'mediabunny';
import {duration,sourceTime,validateProject} from './model.js';
import {render,size} from './render.js';
import {GIFEncoder,quantize,applyPalette} from 'gifenc';
import {sampleFrames} from './frame-sampler.js';
self.onmessage=async({data})=>{
  let input,output;
  try{
    const p=validateProject(data.project),mp4=data.format==='mp4',fps=p.settings.fps;
    input=new Input({source:new BlobSource(data.blob),formats:ALL_FORMATS});
    const vt=await input.getPrimaryVideoTrack(),at=await input.getPrimaryAudioTrack();
    if(!vt||!await vt.canDecode())throw new Error('This video cannot be decoded. Try importing an MP4 or WebM recorded in Chrome.');
    if(data.format==='gif'){
      const total=duration(p.clips);if(total>60)throw new Error('GIF exports are limited to 60 seconds. Trim the video or export MP4.');
      const [w,h]=size(p.settings.ratio,360),canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d'),sink=new CanvasSink(vt,{poolSize:2}),gif=GIFEncoder(),count=Math.ceil(total*15);
      const times=function*(){for(let i=0;i<count;i++)yield Math.max(p.mediaStart||0,sourceTime(p.clips,i/15));};let i=0;
      for await(const entry of sampleFrames(sink,times())){
        if(!entry)throw new Error('Missing GIF source frame.');render(canvas,entry.canvas,p.width,p.height,p,sourceTime(p.clips,i/15));
        const rgba=ctx.getImageData(0,0,w,h).data,palette=quantize(rgba,256),delay=(Math.round(Math.min(total,(i+1)/15)*100)-Math.round(i/15*100))*10;gif.writeFrame(applyPalette(rgba,palette),w,h,{palette,delay,repeat:0});i++;if(i%3===0)self.postMessage({type:'progress',progress:i/count});
      }
      gif.finish();const buffer=gif.bytes().buffer;self.postMessage({type:'done',buffer,mime:'image/gif',summary:{width:w,height:h,duration:total,audio:false}},[buffer]);return;
    }
    const [w,h]=size(p.settings.ratio,p.settings.resolution);let codec=mp4?'avc':'vp9';
    // H.264 stops at about 4096 px per side, so a 2160 px phone frame (2160×4696) falls back to HEVC in MP4.
    if(!await canEncodeVideo(codec,{width:w,height:h})){
      if(mp4&&await canEncodeVideo('hevc',{width:w,height:h}))codec='hevc';
      else throw new Error(`${mp4?'H.264':'VP9'} encoding is unavailable at ${w}×${h}. Choose a lower resolution${mp4?' or WebM':''}.`);
    }
    const canvas=new OffscreenCanvas(w,h),source=new CanvasSource(canvas,{codec,bitrate:Math.max(12000000,Math.min(100000000,Math.round(w*h*fps*.18)))});
    const target=new BufferTarget();output=new Output({format:mp4?new Mp4OutputFormat({fastStart:'in-memory'}):new WebMOutputFormat(),target});
    output.addVideoTrack(source,{frameRate:fps});
    let audioSource,rate,channels;
    if(at&&p.settings.volume>0){
      rate=await at.getSampleRate();channels=await at.getNumberOfChannels();
      if(!await at.canDecode())throw new Error('Audio cannot be decoded. Mute the project explicitly to export without audio.');
      if(!await canEncodeAudio(mp4?'aac':'opus',{sampleRate:rate,numberOfChannels:channels}))throw new Error('Audio encoding is unavailable. Try WebM, or mute the project to export without sound.');
      audioSource=new AudioSampleSource({codec:mp4?'aac':'opus',quality:new Quality('high')});output.addAudioTrack(audioSource);
    }
    await output.start();
    const total=duration(p.clips),frameCount=Math.ceil(total*fps),sink=new CanvasSink(vt,{poolSize:2});
    const times=function*(){for(let i=0;i<frameCount;i++)yield Math.max(p.mediaStart||0,sourceTime(p.clips,i/fps));};
    const encodeVideo=async()=>{
      let i=0;
      for await(const entry of sampleFrames(sink,times())){
        if(!entry)throw new Error('A video frame is missing at '+(i/fps).toFixed(2)+'s.');
        render(canvas,entry.canvas,p.width,p.height,p,sourceTime(p.clips,i/fps));
        await source.add(i/fps,Math.min(1/fps,total-i/fps));i++;
        if(i%5===0)self.postMessage({type:'progress',progress:i/frameCount*.9});
      }
      source.close();
    };
    const encodeAudio=async()=>{
      if(!audioSource)return;
      const sink=new AudioSampleSink(at);let outputFrames=0;
      const add=async(data,n)=>{const sample=new AudioSample({data,format:'f32-planar',sampleRate:rate,numberOfChannels:channels,timestamp:outputFrames/rate});try{await audioSource.add(sample);outputFrames+=n;}finally{sample.close();}};
      const silent=async count=>{while(count>0){const n=Math.min(count,rate);await add(new Float32Array(n*channels),n);count-=n;}};
      for(const clip of p.clips){
        let cursor=0;const length=Math.round((clip.end-clip.start)*rate);
        for await(const b of sink.samples(clip.start,clip.end)){
          try{
          const offset=Math.round((b.timestamp-clip.start)*rate);
          if(b.sampleRate!==rate)throw new Error('Audio sample rate changes are not supported.');
          const begin=Math.max(0,-offset,cursor-offset),end=Math.min(b.numberOfFrames,length-offset);
          if(end<=begin)continue;
          const start=offset+begin;if(start>cursor)await silent(start-cursor);
          const n=end-begin,data=new Float32Array(n*channels);
          for(let c=0;c<channels;c++)b.copyTo(data.subarray(c*n,(c+1)*n),{planeIndex:c,format:'f32-planar',frameOffset:begin,frameCount:n});
          for(let k=0;k<data.length;k++)data[k]=Math.max(-1,Math.min(1,data[k]*p.settings.volume));
          await add(data,n);cursor=offset+end;
          }finally{b.close();}
        }
        if(cursor<length)await silent(length-cursor);
      }
      audioSource.close();
    };
    await Promise.all([encodeVideo(),encodeAudio()]);self.postMessage({type:'progress',progress:.96});await output.finalize();
    self.postMessage({type:'done',buffer:target.buffer,mime:mp4?'video/mp4':'video/webm',codec},[target.buffer]);
  }catch(e){await output?.cancel().catch(()=>{});self.postMessage({type:'error',error:e.message});}finally{input?.dispose();}
};
