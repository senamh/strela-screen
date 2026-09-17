import {Output,BufferTarget,CanvasSource,AudioSample,AudioSampleSource,WebMOutputFormat,Quality} from 'mediabunny';

// Original deterministic fixture, drawn and encoded off the interface thread.
self.onmessage=async()=>{
  let out;
  try{
    const canvas=new OffscreenCanvas(1280,720),ctx=canvas.getContext('2d');
    const target=new BufferTarget(),video=new CanvasSource(canvas,{codec:'vp8',quality:new Quality('medium')}),audio=new AudioSampleSource({codec:'opus',quality:new Quality('medium')});
    out=new Output({format:new WebMOutputFormat(),target});
    out.addVideoTrack(video,{frameRate:30});out.addAudioTrack(audio);await out.start();
    const events=[{type:'click',t:1.5,x:.25,y:.33},{type:'click',t:3.5,x:.72,y:.6},{type:'click',t:5.8,x:.8,y:.2}];
    const encodeAudio=async()=>{
      // Eight seconds of silence preserve the audio-track test without click sounds.
      for(let second=0;second<8;second++){
        const sample=new AudioSample({data:new Float32Array(48000),format:'f32-planar',sampleRate:48000,numberOfChannels:1,timestamp:second});
        try{await audio.add(sample);}finally{sample.close();}
      }
      audio.close();
    };
    const encodeVideo=async()=>{
      for(let f=0;f<240;f++){
        const t=f/30;ctx.fillStyle='#f5f6f2';ctx.fillRect(0,0,1280,720);ctx.fillStyle='#fff';ctx.fillRect(0,0,240,720);ctx.fillStyle='#253522';ctx.font='bold 28px sans-serif';ctx.fillText('Fieldnotes',28,60);ctx.font='18px sans-serif';['Overview','Projects','Your team','Settings'].forEach((s,i)=>ctx.fillText(s,28,140+i*58));ctx.font='bold 34px sans-serif';ctx.fillText('A clearer picture.',290,84);ctx.fillStyle='#d7eac5';ctx.fillRect(1030,40,190,54);ctx.fillStyle='#263b23';ctx.font='18px sans-serif';ctx.fillText('New project +',1050,74);
        const cards=[['Active projects','12'],['Completed','84'],['Hours saved','128']];cards.forEach(([s,v],i)=>{ctx.fillStyle='#fff';ctx.fillRect(288+i*305,145,282,150);ctx.fillStyle='#74806e';ctx.font='18px sans-serif';ctx.fillText(s,310+i*305,180);ctx.fillStyle='#253522';ctx.font='bold 44px sans-serif';ctx.fillText(v,310+i*305,245);});
        ctx.fillStyle='#fff';ctx.fillRect(288,330,890,300);ctx.fillStyle='#33432f';ctx.font='22px sans-serif';ctx.fillText(t>3.5?'Project activity · this week':'Project activity',315,372);for(let i=0;i<12;i++){ctx.fillStyle=i===Math.floor(t)%12?'#769a59':'#d5e5c9';const h=60+((i*37)%130);ctx.fillRect(320+i*68,585-h,42,h);}
        if(t>5.8){ctx.fillStyle='#263923';ctx.fillRect(760,104,420,68);ctx.fillStyle='#edf8e7';ctx.font='19px sans-serif';ctx.fillText('Your new project is ready ✓',790,145);}
        await video.add(t,1/30);if(f%15===0)self.postMessage({type:'progress',progress:f/240});
      }
      video.close();
    };
    await Promise.all([encodeVideo(),encodeAudio()]);await out.finalize();
    self.postMessage({type:'done',buffer:target.buffer,mime:'video/webm',events},[target.buffer]);
  }catch(error){await out?.cancel().catch(()=>{});self.postMessage({type:'error',error:error.message});}
};
