// Visible studio owns capture permissions and the recording lifecycle.
const toolsBar=document.createElement('nav');
const record=document.createElement('button'),exportButton=document.createElement('button'),original=document.createElement('button');
record.textContent='Record screen / window';exportButton.textContent='Export styled WebM';original.textContent='Save original';
exportButton.disabled=original.disabled=true;toolsBar.append(record,exportButton,original);document.querySelector('main').prepend(toolsBar);
let capture,media,sourceBlob,exporting=false;
let abortExport;
const cancel=document.createElement('button');cancel.textContent='Cancel export';cancel.hidden=true;toolsBar.append(cancel);cancel.onclick=()=>abortExport?.();
const say=text=>document.querySelector('#status').textContent=text;
function save(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000);}
function type(){return ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));}
function load(blob){sourceBlob=blob;video.pause();if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);video.src=url;points=[];list();exportButton.disabled=original.disabled=false;}
document.querySelector('#file').addEventListener('change',e=>{if(e.target.files[0]){sourceBlob=e.target.files[0];exportButton.disabled=original.disabled=false;}});
record.onclick=async()=>{
  if(capture?.state==='recording'){capture.stop();return;}
  if(exporting)return;
  try{media=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});const chunks=[];capture=new MediaRecorder(media,{mimeType:type()});capture.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};capture.onstop=()=>{media.getTracks().forEach(t=>t.stop());load(new Blob(chunks,{type:capture.mimeType}));record.textContent='Record screen / window';say('Recording ready. Pause and click to add focus moments.');};media.getVideoTracks()[0].onended=()=>{if(capture.state==='recording')capture.stop();};capture.start(1000);record.textContent='Stop recording';say('Recording. Keep this tab open and return here to stop.');}catch(e){media?.getTracks().forEach(t=>t.stop());say(e.message);}
};
original.onclick=()=>save(sourceBlob,'strela-original.'+(sourceBlob.type.includes('mp4')?'mp4':'webm'));
exportButton.onclick=async()=>{
  if(exporting||capture?.state==='recording'||video.readyState<2)return;
  exporting=true;window.strelaBusy=true;const controls=[...document.querySelectorAll('button,input')];controls.forEach(c=>c.disabled=true);cancel.hidden=false;cancel.disabled=false;let output,encoder,cleanup=()=>{};
  let rejectFailure;const failure=new Promise((_,reject)=>rejectFailure=reject);failure.catch(()=>{});
  abortExport=()=>rejectFailure(new Error('Export cancelled.'));
  const visibility=()=>{if(document.hidden)abortExport();};document.addEventListener('visibilitychange',visibility);
  try{
    video.pause();if(video.currentTime!==0){await Promise.race([failure,new Promise((resolve,reject)=>{const timer=setTimeout(()=>{video.removeEventListener('seeked',ready);reject(new Error('Could not seek video.'));},10000);const ready=()=>{clearTimeout(timer);resolve();};video.addEventListener('seeked',ready,{once:true});video.currentTime=0;})]);}
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    output=canvas.captureStream(30);
    const audio=video.captureStream();audio.getAudioTracks().forEach(t=>output.addTrack(t));
    const chunks=[];encoder=new MediaRecorder(output,{mimeType:type(),videoBitsPerSecond:8000000});encoder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    const done=new Promise(r=>encoder.onstop=r);encoder.onerror=e=>rejectFailure(e.error||new Error('Encoding failed.'));encoder.start(250);say('Exporting in real time. Switching tabs cancels export.');
    const ended=new Promise(resolve=>{const finish=()=>resolve();const error=()=>rejectFailure(new Error('Video playback failed.'));video.addEventListener('ended',finish,{once:true});video.addEventListener('error',error,{once:true});cleanup=()=>{video.removeEventListener('ended',finish);video.removeEventListener('error',error);};});
    await Promise.race([video.play(),failure]);await Promise.race([ended,failure]);encoder.stop();await Promise.race([done,failure]);save(new Blob(chunks,{type:encoder.mimeType}),'strela-styled.webm');say('Styled WebM exported.');
  }catch(e){say(e.message);}finally{cleanup();document.removeEventListener('visibilitychange',visibility);video.pause();if(encoder?.state==='recording')encoder.stop();output?.getTracks().forEach(t=>t.stop());exporting=false;window.strelaBusy=false;abortExport=null;cancel.hidden=true;controls.forEach(c=>c.disabled=false);}
};
window.addEventListener('beforeunload',e=>{if(exporting||capture?.state==='recording'){e.preventDefault();e.returnValue='';}});
