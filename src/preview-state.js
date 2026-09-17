// Paused previews are repainted only after an edit or a newly decoded seek frame.
export function needsPreviewFrame({readyState,paused,busy,dirty,time,paintedTime}){
  return readyState>=2&&!busy&&(dirty||!paused||time!==paintedTime);
}

// Explicitly seek once after load, even at zero. A hidden, never-played video may
// report loadeddata before its initial frame is available to drawImage.
export function primePreviewFrame(video,time,{timeout=12000}={}){
  return new Promise((resolve,reject)=>{
    let settled=false;
    const cleanup=()=>{
      clearTimeout(timer);
      for(const type of ['seeked','loadeddata','canplay'])video.removeEventListener(type,ready);
      video.removeEventListener('error',failed);
    };
    const finish=error=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve();};
    const ready=()=>{if(!video.seeking&&video.readyState>=2)finish();};
    const failed=()=>finish(new Error(video.error?.message||'The first video frame could not be loaded.'));
    const timer=setTimeout(()=>finish(new Error('The first video frame timed out.')),timeout);
    for(const type of ['seeked','loadeddata','canplay'])video.addEventListener(type,ready);
    video.addEventListener('error',failed);
    try{video.currentTime=time;ready();}catch(error){finish(error);}
  });
}

// A paused video can keep the same timestamp after its canvas backing store or
// decoded image is restored. These events request one repaint, not an idle loop.
export function watchPreviewInvalidation({canvas,video,document:doc,window:win},invalidate){
  const listeners=[];
  const on=(target,type,listener=invalidate)=>{target.addEventListener(type,listener);listeners.push([target,type,listener]);};
  for(const type of ['loadeddata','canplay','seeked'])on(video,type);
  on(canvas,'contextrestored');
  on(win,'resize');on(win,'pageshow');
  on(doc,'visibilitychange',()=>{if(doc.visibilityState!=='hidden')invalidate();});
  return ()=>{for(const [target,type,listener] of listeners)target.removeEventListener(type,listener);};
}
