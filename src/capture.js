import {saveChunk,clearChunks} from './storage.js';
const send=async m=>{const r=await chrome.runtime.sendMessage(m);if(!r?.ok)throw new Error(r?.error||'Extension connection failed.');return r;};
export class Capture {
  constructor(onState,onError){this.onState=onState;this.onError=onError;this.state='idle';this.events=[];}
  async start({mode,target,mic,system}){
    if(this.state!=='idle')throw new Error('A recording is already running.');
    this.id=crypto.randomUUID();this.raw=[];this.events=[];this.chunks=[];this.index=0;this.writes=Promise.resolve();this.persistError=null;this.pauses=[];this.setState('starting');
    try{
      let stream;
      if(mode==='tab'&&target&&globalThis.chrome?.runtime?.id){
        const {streamId}=await send({type:'TAB_STREAM',targetTabId:Number(target)});
        stream=await navigator.mediaDevices.getUserMedia({video:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:streamId}},audio:system?{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:streamId}}:false});
        this.restoreTabAudio=true;
      }else{
        stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:mode==='window'?'window':mode==='tab'?'browser':'monitor',frameRate:60},audio:system,selfBrowserSurface:'exclude'});
      }
      this.raw.push(...stream.getTracks());
      const audios=stream.getAudioTracks();
      if(mic){const microphone=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});this.raw.push(...microphone.getTracks());audios.push(...microphone.getAudioTracks());}
      const output=new MediaStream(stream.getVideoTracks());
      if(audios.length){
        this.context=new AudioContext();await this.context.resume();const dest=this.context.createMediaStreamDestination();
        audios.forEach((t,i)=>{const source=this.context.createMediaStreamSource(new MediaStream([t]));source.connect(dest);if(this.restoreTabAudio&&i<stream.getAudioTracks().length)source.connect(this.context.destination);});
        output.addTrack(dest.stream.getAudioTracks()[0]);
      }
      const mimeType=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
      if(!mimeType)throw new Error('WebM capture is unavailable in this browser.');
      this.recorder=new MediaRecorder(output,{mimeType,videoBitsPerSecond:14000000});
      this.recorder.ondataavailable=e=>{if(!e.data.size)return;this.chunks.push(e.data);const i=this.index++;this.writes=this.writes.then(()=>saveChunk(this.id,i,e.data)).catch(e=>{this.persistError=e;this.onError('Recovery storage is full. Save the original after stopping.');});};
      this.done=new Promise(resolve=>this.resolveDone=resolve);
      this.recorder.onstop=()=>this.finish();
      this.recorder.onerror=e=>{this.onError(e.error?.message||'Recording interrupted');if(this.recorder.state!=='inactive')this.recorder.stop();};
      stream.getVideoTracks()[0].onended=()=>this.stop();
      this.started=Date.now();this.recorder.start(1000);this.setState('recording');
      this.tracking=false;
      if(mode==='tab'&&target&&globalThis.chrome?.runtime?.id){
        this.listener=m=>{if(m.type!=='STUDIO_CUES'||m.id!==this.id||!['recording','paused'].includes(this.state))return;for(const e of m.events){const t=this.eventTime(e.at);if(t!==null)this.events.push({...e,t});}};
        chrome.runtime.onMessage.addListener(this.listener);
        this.tracking=(await send({type:'TRACK_START',targetTabId:Number(target),id:this.id})).tracking;
      }
      return {tracking:this.tracking,hasAudio:audios.length>0};
    }catch(e){if(this.recorder?.state==='recording'){this.recorder.stop();await this.done;}else{await this.cleanup();this.setState('idle');}throw e;}
  }
  eventTime(at){if(at<this.started)return null;let skipped=0;for(const p of this.pauses){if(at>=p.start&&at<(p.end??Infinity))return null;if(p.end&&at>=p.end)skipped+=p.end-p.start;}return (at-this.started-skipped)/1000;}
  elapsed(){return ((this.state==='paused'?this.pauses.at(-1).start:Date.now())-this.started-this.pauses.filter(p=>p.end).reduce((n,p)=>n+p.end-p.start,0))/1000;}
  pause(){if(this.state==='recording'){this.recorder.pause();this.pauses.push({start:Date.now()});this.setState('paused');}else if(this.state==='paused'){this.pauses.at(-1).end=Date.now();this.recorder.resume();this.setState('recording');}}
  stop(){if(['recording','paused'].includes(this.state)){this.seconds=this.elapsed();this.setState('stopping');this.recorder.stop();}return this.done;}
  async finish(){await this.cleanup();await this.writes;const result={blob:new Blob(this.chunks,{type:this.recorder.mimeType}),events:this.events,tracking:this.tracking,id:this.id,duration:this.seconds||this.elapsed()};this.chunks=[];this.setState('idle');this.resolveDone(result);}
  async cleanup(){if(this.listener){chrome.runtime.onMessage.removeListener(this.listener);this.listener=null;await send({type:'TRACK_STOP'}).catch(()=>{});}this.raw?.forEach(t=>t.stop());if(this.context){await this.context.close();this.context=null;}this.restoreTabAudio=false;}
  setState(state){this.state=state;this.onState(state);}
}
export {clearChunks};
