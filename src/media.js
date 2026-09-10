import {Input,BlobSource,ALL_FORMATS,CanvasSink,Output,BufferTarget,CanvasSource,AudioBufferSource,WebMOutputFormat,Quality} from 'mediabunny';
export async function inspect(blob){
  const input=new Input({source:new BlobSource(blob),formats:ALL_FORMATS});
  try{const track=await input.getPrimaryVideoTrack();if(!track||!await track.canDecode())throw new Error('Unsupported video. Use MP4 or WebM.');return {duration:await track.computeDuration(),width:await track.getDisplayWidth(),height:await track.getDisplayHeight(),mediaStart:await track.getFirstTimestamp(),audio:!!await input.getPrimaryAudioTrack()};}finally{input.dispose();}
}
export async function thumbnails(blob,count=10){const input=new Input({source:new BlobSource(blob),formats:ALL_FORMATS});try{const track=await input.getPrimaryVideoTrack(),length=await track.computeDuration(),start=await track.getFirstTimestamp(),sink=new CanvasSink(track,{width:160});const result=[];for await(const entry of sink.canvasesAtTimestamps(Array.from({length:count},(_,i)=>Math.max(start,length*i/count)))){if(entry)result.push(entry.canvas.toDataURL());}return result;}finally{input.dispose();}}
// A deterministic, original fixture exercises the real decoder, audio and exporter.
export async function demo(onProgress){
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d');
  const target=new BufferTarget(),out=new Output({format:new WebMOutputFormat(),target}),video=new CanvasSource(canvas,{codec:'vp8',quality:new Quality('medium')}),audio=new AudioBufferSource({codec:'opus',quality:new Quality('medium')});
  out.addVideoTrack(video,{frameRate:30});out.addAudioTrack(audio);await out.start();
  const clicks=[{type:'click',t:1.5,x:.25,y:.33},{type:'click',t:3.5,x:.72,y:.6},{type:'click',t:5.8,x:.8,y:.2}];
  const sound=new AudioBuffer({length:48000*8,sampleRate:48000,numberOfChannels:1});// No synthetic click sounds.
  const audioJob=audio.add(sound).then(()=>audio.close());
  for(let f=0;f<240;f++){
    const t=f/30;ctx.fillStyle='#f5f6f2';ctx.fillRect(0,0,1280,720);ctx.fillStyle='#fff';ctx.fillRect(0,0,240,720);ctx.fillStyle='#253522';ctx.font='bold 28px sans-serif';ctx.fillText('Fieldnotes',28,60);ctx.font='18px sans-serif';['Overview','Projects','Your team','Settings'].forEach((s,i)=>ctx.fillText(s,28,140+i*58));ctx.font='bold 34px sans-serif';ctx.fillText('A clearer picture.',290,84);ctx.fillStyle='#d7eac5';ctx.fillRect(1030,40,190,54);ctx.fillStyle='#263b23';ctx.font='18px sans-serif';ctx.fillText('New project +',1050,74);
    const cards=[['Active projects','12'],['Completed','84'],['Hours saved','128']];cards.forEach(([s,v],i)=>{ctx.fillStyle='#fff';ctx.fillRect(288+i*305,145,282,150);ctx.fillStyle='#74806e';ctx.font='18px sans-serif';ctx.fillText(s,310+i*305,180);ctx.fillStyle='#253522';ctx.font='bold 44px sans-serif';ctx.fillText(v,310+i*305,245);});
    ctx.fillStyle='#fff';ctx.fillRect(288,330,890,300);ctx.fillStyle='#33432f';ctx.font='22px sans-serif';ctx.fillText(t>3.5?'Project activity · this week':'Project activity',315,372);for(let i=0;i<12;i++){ctx.fillStyle=i===Math.floor(t)%12?'#769a59':'#d5e5c9';const h=60+((i*37)%130);ctx.fillRect(320+i*68,585-h,42,h);}
    if(t>5.8){ctx.fillStyle='#263923';ctx.fillRect(760,104,420,68);ctx.fillStyle='#edf8e7';ctx.font='19px sans-serif';ctx.fillText('Your new project is ready ✓',790,145);}
    await video.add(t,1/30);if(f%15===0)onProgress(f/240);
  }
  video.close();await audioJob;await out.finalize();return {blob:new Blob([target.buffer],{type:'video/webm'}),events:clicks};
}
