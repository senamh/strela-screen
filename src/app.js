import {defaults,duration,sourceTime,timelineTime,split,autoFocus,History,clamp,validateProject} from './model.js';
import {render,size} from './render.js';
import {inspect,thumbnails,demo} from './media.js';
import {Capture,clearChunks} from './capture.js';
import {saveProject,allProjects,allChunks,projectArchive,readArchive} from './storage.js';
const $=id=>document.getElementById(id),video=$('video'),canvas=$('preview');
let project=null,blob=null,url=null,time=0,selected=0,geometry=null,busy=false,history=new History(),thumbs=[],worker=null,exportBlob=null,exportURL=null,saveQueue=Promise.resolve(),saveTimer=null,saveError=false;
let target=new URLSearchParams(location.search).get('target');
const isExtension=!!globalThis.chrome?.runtime?.id;
const say=text=>$('status').textContent=text;
if(isExtension)chrome.runtime.onMessage.addListener((m,sender)=>{
  if(m.type!=='SELECT_SOURCE'||sender.id!==chrome.runtime.id||sender.url!==chrome.runtime.getURL('popup.html')||!Number.isInteger(m.target))return;
  // Only the reused studio receives the new source; never interrupt an active recording.
  chrome.tabs.getCurrent().then(tab=>{if(tab?.id!==m.studio)return;target=String(m.target);const next=new URL(location.href);next.searchParams.set('target',target);window.history.replaceState(null,'',next);if(!busy)say('Source tab updated. Choose Record → Browser tab.');}).catch(()=>{});
});
const clock=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function editing(){return !!project&&!busy;}
function download(data,name){const u=URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000);}
function filename(){return (project?.name||'strela').replace(/[^\p{L}\p{N}_ -]/gu,'').trim().slice(0,70)||'strela';}
function setBusy(value){busy=value;document.querySelectorAll('main button,main input,main select,.topbar button,.topbar input').forEach(e=>e.disabled=value);refreshButtons();}
function refreshButtons(){for(const id of ['play','back','seek','save','export','original','split','trim','trim-start','trim-end'])$(id).disabled=!project||busy;$('delete-clip').disabled=!project||busy||project.clips.length<2;$('auto').disabled=!project||busy||!project.events.length;$('undo').disabled=busy||!history.past.length;$('redo').disabled=busy||!history.future.length;for(const key of ['padding','shadow'])document.querySelector('[data-setting='+key+']').disabled=busy||project?.settings.ratio==='phone';}
function stopPlayback(){video.pause();$('play').textContent='▶';}
function currentSnapshot(){return structuredClone(project);}
function saveLocal(){
  if(!project)return Promise.resolve();clearTimeout(saveTimer);
  const snapshot=currentSnapshot(),source=blob;$('saved').textContent='Saving…';
  const job=saveQueue.catch(()=>{}).then(()=>saveProject(snapshot,source));saveQueue=job;
  return job.then(()=>{saveError=false;$('saved').textContent='Saved on this device';},e=>{saveError=true;$('saved').textContent='Not saved';say('Local save failed: '+e.message+'. Download a .strela backup.');});
}
function changed(){clearTimeout(saveTimer);saveTimer=setTimeout(saveLocal,250);$('export-result').hidden=true;refresh();}
function edit(fn){if(!editing())return;stopPlayback();history.push(currentSnapshot());fn();time=clamp(time,0,duration(project.clips));selected=clamp(selected,0,project.clips.length-1);seekTo(time);changed();}
function refresh(){
  refreshButtons();if(!project)return;
  $('empty').hidden=true;$('name').value=project.name;$('seek').max=duration(project.clips);$('seek').value=time;
  document.querySelectorAll('[data-setting]').forEach(e=>{const value=project.settings[e.dataset.setting];if(e.type==='checkbox')e.checked=value;else e.value=value;});
  document.querySelectorAll('[data-theme]').forEach(e=>e.classList.toggle('selected',e.dataset.theme===project.settings.theme));
  const clips=$('clips');clips.replaceChildren();project.clips.forEach((c,i)=>{const b=document.createElement('button');b.className='clip'+(i===selected?' selected':'');b.style.flex=String(c.end-c.start);b.disabled=busy;b.setAttribute('aria-label',`Select clip ${i+1}`);if(thumbs.length)b.style.backgroundImage=`url("${thumbs[Math.min(thumbs.length-1,Math.floor(c.start/project.duration*thumbs.length))]}")`;const span=document.createElement('span');span.textContent=`${i+1} · ${(c.end-c.start).toFixed(1)}s`;b.append(span);b.onclick=()=>{selected=i;stopPlayback();seekTo(project.clips.slice(0,i).reduce((n,c)=>n+c.end-c.start,0));refresh();};clips.append(b);});
  $('trim-start').value=project.clips[selected].start.toFixed(2);$('trim-end').value=project.clips[selected].end.toFixed(2);
  const points=$('points');points.replaceChildren();project.points.forEach((p,i)=>{if(timelineTime(project.clips,p.t)===null)return;const b=document.createElement('button');b.disabled=busy;b.textContent=(p.auto?'✦ ':'')+p.t.toFixed(1)+'s ×';b.setAttribute('aria-label','Remove focus at '+p.t.toFixed(1)+' seconds');b.onclick=()=>edit(()=>project.points.splice(i,1));points.append(b);});
  $('auto-note').textContent=project.events.length?`${project.events.length} click cues available. Auto-focus stays editable.`:'No click cues in this recording. Pause and click to set focus; desktop apps do not expose global clicks to an extension.';
  $('source-info').textContent=`${project.width} × ${project.height} · ${project.audio?'With audio':'No audio'} · ${(blob.size/1024/1024).toFixed(1)} MB`;
  const [w,h]=size(project.settings.ratio,720);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  video.volume=clamp(project.settings.volume,0,1);
}
function seekTo(t){time=clamp(t,0,duration(project.clips));const st=Math.min(project.duration-.001,sourceTime(project.clips,time));video.currentTime=Math.max(0,st);$('seek').value=time;}
async function openMedia(source,existing=null,events=[]){
  stopPlayback();const metadata=await inspect(source);
  if(!Number.isFinite(metadata.duration)||metadata.duration<=.05)throw new Error('The recording is empty or its duration could not be read.');
  if(existing){existing=validateProject(existing);if(existing.duration>metadata.duration+.1)throw new Error('Project ranges do not match its source video.');}
  const next=existing||{id:crypto.randomUUID(),version:1,name:source.name?.replace(/\.[^.]+$/,'')||'Untitled demo',mime:source.type,...metadata,clips:[{start:0,end:metadata.duration}],events:events.filter(e=>e.t>=0&&e.t<metadata.duration),points:[],settings:{...defaults}};
  if(!existing)next.points=autoFocus(next.events);
  Object.assign(next,{width:metadata.width,height:metadata.height,mediaStart:metadata.mediaStart,audio:metadata.audio});
  if(url)URL.revokeObjectURL(url);blob=source;project=next;url=URL.createObjectURL(source);video.src=url;time=0;selected=0;geometry=null;history=new History();thumbs=[];$('export-result').hidden=true;
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>done(new Error('Video loading timed out.')),12000);const loaded=()=>done();const failed=()=>done(new Error('Video playback is unsupported.'));function done(e){clearTimeout(timer);video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);e?reject(e):resolve();}video.addEventListener('loadeddata',loaded,{once:true});video.addEventListener('error',failed,{once:true});});
  refresh();await saveLocal();const id=project.id;thumbnails(blob).then(images=>{if(project?.id===id){thumbs=images;refresh();}}).catch(()=>{});
  say(next.events.length?'Auto-focus is ready. Play to preview, or pause and click to adjust.':'Ready to edit. Pause and click to add focus.');
}
function frame(){
  if(project&&video.readyState>=2){
    if(!video.paused){let mapped=timelineTime(project.clips,video.currentTime);if(mapped===null){const next=project.clips.find(c=>c.start>=video.currentTime-.02);if(next)video.currentTime=next.start;else{stopPlayback();time=duration(project.clips);}}else time=mapped;}
    geometry=render(canvas,video,project.width,project.height,project,video.currentTime);$('seek').value=time;$('clock').textContent=`${clock(time)} / ${clock(duration(project.clips))}`;
  }
  requestAnimationFrame(frame);
}frame();
video.addEventListener('ended',()=>{stopPlayback();if(project)time=duration(project.clips);});
video.addEventListener('error',()=>say('Video playback failed. Save the original and try importing it again.'));
$('play').onclick=async()=>{if(!editing())return;if(!video.paused)stopPlayback();else{if(time>=duration(project.clips)-.05)seekTo(0);try{await video.play();$('play').textContent='❚❚';}catch(e){say(e.message);}}};
$('back').onclick=()=>{stopPlayback();seekTo(0);};$('seek').oninput=()=>{stopPlayback();seekTo(Number($('seek').value));};
canvas.onclick=e=>{
  if(!editing()||!video.paused||!geometry)return;const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)*canvas.width/b.width,y=(e.clientY-b.top)*canvas.height/b.height,o=geometry.overview,g=o&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h?o:geometry;
  if(x<g.x||y<g.y||x>g.x+g.w||y>g.y+g.h)return;
  edit(()=>project.points.push({id:crypto.randomUUID(),t:video.currentTime,x:(g.crop.x+(x-g.x)/g.w*g.crop.w)/project.width,y:(g.crop.y+(y-g.y)/g.h*g.crop.h)/project.height,auto:false}));
};
$('split').onclick=()=>edit(()=>project.clips=split(project.clips,time));
$('delete-clip').onclick=()=>{if(project?.clips.length>1)edit(()=>project.clips.splice(selected,1));};
$('trim').onclick=()=>{const start=Number($('trim-start').value),end=Number($('trim-end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>project.duration||end-start<.1){say('Choose a valid clip range of at least 0.1 seconds.');return;}const prev=project.clips[selected-1],next=project.clips[selected+1];if(prev&&start<prev.end||next&&end>next.start){say('Clip ranges cannot overlap.');return;}edit(()=>project.clips[selected]={start,end});};
$('auto').onclick=()=>edit(()=>{project.points=[...project.points.filter(p=>!p.auto),...autoFocus(project.events)];});
$('undo').onclick=()=>{if(!editing())return;stopPlayback();project=history.undo(project);selected=clamp(selected,0,project.clips.length-1);seekTo(Math.min(time,duration(project.clips)));changed();};
$('redo').onclick=()=>{if(!editing())return;stopPlayback();project=history.redo(project);selected=clamp(selected,0,project.clips.length-1);seekTo(Math.min(time,duration(project.clips)));changed();};
$('name').onchange=()=>edit(()=>project.name=$('name').value.trim()||'Untitled demo');
document.querySelectorAll('[data-setting]').forEach(e=>e.onchange=()=>{const value=e.type==='checkbox'?e.checked:e.tagName==='SELECT'?e.value:Number(e.value);edit(()=>project.settings[e.dataset.setting]=value);});
document.querySelectorAll('[data-theme]').forEach(e=>e.onclick=()=>edit(()=>project.settings.theme=e.dataset.theme));
$('preset').onchange=()=>{const preset=$('preset').value;edit(()=>Object.assign(project.settings,preset==='phone'?{ratio:'phone',theme:'black',padding:0,radius:0,zoom:1.3,hold:2.8,shadow:false,clicks:false,resolution:1206,fps:60}:preset==='tutorial'?{zoom:2,hold:2.8,ratio:'wide',theme:'mint'}:preset==='social'?{zoom:1.5,hold:1.4,ratio:'portrait',theme:'sunset'}:{zoom:1.7,hold:2,ratio:'wide',theme:'lavender'}));};
$('original').onclick=()=>download(blob,filename()+'-original.'+(blob.type.includes('mp4')?'mp4':'webm'));
$('file').onchange=async e=>{const file=e.target.files[0];if(!file||busy)return;setBusy(true);try{await saveLocal();if(file.name.endsWith('.strela')){const saved=await readArchive(file);await openMedia(saved.blob,saved.project);}else await openMedia(file);}catch(e){say(e.message);}finally{e.target.value='';setBusy(false);}};
$('save').onclick=async()=>{if(!editing())return;setBusy(true);try{say('Packing project and original video…');download(await projectArchive(project,blob),filename()+'.strela');say('Project backup ready. It includes the original video.');}catch(e){say(e.message);}finally{setBusy(false);}};
$('library').onclick=async()=>{try{const entries=(await allProjects()).sort((a,b)=>b.updated-a.updated);$('project-list').replaceChildren();for(const entry of entries){const b=document.createElement('button');b.className='project-card';const title=document.createElement('span'),meta=document.createElement('small');title.textContent=entry.project.name;meta.textContent=`${clock(duration(entry.project.clips))} · ${new Date(entry.updated).toLocaleString()}`;b.append(title,meta);b.onclick=async()=>{if(busy)return;$('library-dialog').close();setBusy(true);try{await saveLocal();await openMedia(entry.blob,entry.project);}catch(e){say(e.message);}finally{setBusy(false);}};$('project-list').append(b);}if(!entries.length)$('project-list').textContent='Your first project will appear here.';$('library-dialog').showModal();}catch(e){say(e.message);}};
const capture=new Capture(state=>{
  $('recording').hidden=['idle','starting'].includes(state);$('record-state').textContent=state==='paused'?'Paused':state==='stopping'?'Saving…':'Recording';$('pause-record').textContent=state==='paused'?'Resume':'Pause';$('pause-record').disabled=!['paused','recording'].includes(state);$('stop-record').disabled=!['paused','recording'].includes(state);
},say);
setInterval(()=>{if(['recording','paused'].includes(capture.state))$('record-time').textContent=clock(capture.elapsed());},300);
function recordDialog(){if(busy)return;stopPlayback();$('tab-note').textContent=isExtension&&target?'Source tab: the tab from which you opened Strela. Clicks are captured only there; after page navigation, manual focus may be needed.':'For automatic focus, open Strela from the extension while viewing the source tab. The browser picker still records screens and windows here.';$('capture-dialog').showModal();}
$('new-record').onclick=$('empty-record').onclick=recordDialog;
$('start-record').onclick=async()=>{
  if(busy)return;const options={mode:$('mode').value,target,mic:$('mic').checked,system:$('system').checked};$('capture-dialog').close();setBusy(true);stopPlayback();
  try{saveLocal();const info=await capture.start(options);$('recording').hidden=false;$('stop-record').disabled=$('pause-record').disabled=false;say(info.tracking?'Recording with click cues. Return here to stop.':'Recording. Auto-focus unavailable for this source; add manual focus after recording.');
    const result=await capture.done;await openMedia(result.blob,null,result.events);if(!saveError)await clearChunks(result.id);
  }catch(e){say('Recording: '+e.message);}finally{setBusy(false);$('recording').hidden=true;}
};
$('pause-record').onclick=()=>capture.pause();$('stop-record').onclick=()=>capture.stop();
$('demo').onclick=async()=>{if(busy)return;setBusy(true);$('progress-title').textContent='Preparing a sample story…';$('progress-label').textContent='Creating an original 8-second clip with audio';$('progress').value=0;$('cancel').hidden=true;$('progress-dialog').showModal();try{const sample=await demo(p=>$('progress').value=p);await openMedia(sample.blob,null,sample.events);project.name='Fieldnotes · product demo';refresh();await saveLocal();}catch(e){say(e.message);}finally{$('progress-dialog').close();setBusy(false);}};
$('export').onclick=()=>{if(!editing())return;$('resolution').value=project.settings.resolution;$('fps').value=project.settings.fps;$('quality-note').textContent='Small text: use MP4 and a 1440p/4K source. Phone mode keeps the full frame above the detail. Upscaling cannot restore missing detail.';$('export-dialog').showModal();};
$('format').onchange=()=>{$('resolution').disabled=$('fps').disabled=$('format').value==='gif';};
function finishExport(){worker?.terminate();worker=null;$('progress-dialog').close();setBusy(false);}
$('cancel').onclick=()=>{finishExport();say('Export cancelled. Your project is unchanged.');};
$('progress-dialog').addEventListener('cancel',e=>e.preventDefault());
$('start-export').onclick=()=>{
  if(!editing())return;stopPlayback();const format=$('format').value;project.settings.resolution=Number($('resolution').value);project.settings.fps=Number($('fps').value);saveLocal();$('export-dialog').close();setBusy(true);$('progress-title').textContent='Rendering your video…';$('progress-label').textContent='Preparing codecs';$('progress').value=0;$('cancel').hidden=false;$('progress-dialog').showModal();
  $('export-result').hidden=true;
  const exportProject=currentSnapshot();
  worker=new Worker('export-worker.js',{type:'module'});const activeWorker=worker;
  worker.onerror=e=>{if(worker!==activeWorker)return;finishExport();say('Export failed: '+e.message);};
  worker.onmessage=async({data})=>{
    if(worker!==activeWorker)return;
    if(data.type==='progress'){$('progress').value=data.progress;$('progress-label').textContent=Math.round(data.progress*100)+'% · frames and audio';}
    if(data.type==='error'){finishExport();say(data.error);}
    if(data.type==='done'){
      try{
        const candidate=new Blob([data.buffer],{type:data.mime});
        const meta=data.mime==='image/gif'?data.summary:await inspect(candidate);
        if(worker!==activeWorker)return;
        if(Math.abs(meta.duration-duration(exportProject.clips))>.15)throw new Error('Output duration differs from the timeline.');
        if(data.mime!=='image/gif'&&exportProject.audio&&exportProject.settings.volume>0&&!meta.audio)throw new Error('Output audio is missing.');
        const [expectedW,expectedH]=size(exportProject.settings.ratio,data.mime==='image/gif'?360:exportProject.settings.resolution);
        if(meta.width!==expectedW||meta.height!==expectedH)throw new Error('Output dimensions do not match the selected format.');
        exportBlob=candidate;if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(exportBlob);
        $('export-video').src=data.mime==='image/gif'?'':exportURL;$('export-video').hidden=data.mime==='image/gif';$('export-image').hidden=data.mime!=='image/gif';
        if(data.mime==='image/gif')$('export-image').src=exportURL;
        $('export-result').hidden=false;$('export-details').textContent=`${meta.width} × ${meta.height} · ${meta.duration.toFixed(2)}s · ${meta.audio?'audio included':'no audio'} · ${(exportBlob.size/1024/1024).toFixed(1)} MB`;
        $('download-export').onclick=()=>download(exportBlob,filename()+'.'+format);
        say(data.mime==='image/gif'?'GIF rendered. Watch or download it below.':'Export passed duration, dimensions and audio-track checks. Watch or download it below.');
      }catch(e){if(worker===activeWorker)say('Output validation failed: '+e.message);}
      finally{if(worker===activeWorker)finishExport();}
    }
  };worker.postMessage({project:exportProject,blob,format});
};
$('watch-export').onclick=()=>{$('watch-dialog').showModal();};$('watch-dialog').addEventListener('close',()=>$('export-video').pause());
window.addEventListener('beforeunload',e=>{if(busy||saveError){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||document.querySelector('dialog[open]'))return;if(e.code==='Space'&&editing()){e.preventDefault();$('play').click();}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();}});
allChunks().then(entries=>{if(!entries.length)return;const groups=new Map();for(const entry of entries){if(!groups.has(entry.id))groups.set(entry.id,[]);groups.get(entry.id).push(entry);}for(const [id,chunks] of groups){const b=document.createElement('button');b.textContent='Recover interrupted recording';b.onclick=async()=>{if(busy)return;setBusy(true);try{const recovered=new Blob(chunks.sort((a,b)=>a.index-b.index).map(c=>c.blob),{type:'video/webm'});await openMedia(recovered);if(!saveError){await clearChunks(id);b.remove();}}catch(e){say('Recovery: '+e.message);}finally{setBusy(false);}};$('empty').append(b);}}).catch(e=>say('Recovery storage unavailable: '+e.message));
refreshButtons();
