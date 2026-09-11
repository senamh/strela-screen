import {defaults,duration,sourceTime,timelineTime,split,autoFocus,History,clamp,validateProject,outputRate,timeline} from './model.js';
import {render,size} from './render.js';
import {inspect,thumbnails,demo} from './media.js';
import {Capture,clearChunks} from './capture.js';
import {saveProject,allProjects,allChunks,projectArchive,readArchive} from './storage.js';
import {analyzeVideo} from './analyze.js';
let analysisController=null,autoDownload=false;
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
// Playback follows the effective timeline: the user's clips with pauses sped up when enabled.
const plays=()=>timeline(project);
const clock=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function editing(){return !!project&&!busy;}
function download(data,name){const u=URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),60000);}
function filename(){return (project?.name||'strela').replace(/[^\p{L}\p{N}_ -]/gu,'').trim().slice(0,70)||'strela';}
function setBusy(value){busy=value;document.querySelectorAll('main button,main input,main select,.topbar button,.topbar input').forEach(e=>e.disabled=value);refreshButtons();}
function refreshButtons(){for(const id of ['play','back','seek','save','export','original','split','trim','trim-start','trim-end'])$(id).disabled=!project||busy;$('delete-clip').disabled=!project||busy||project.clips.length<2;$('auto').disabled=!project||busy;$('undo').disabled=busy||!history.past.length;$('redo').disabled=busy||!history.future.length;for(const key of ['padding','shadow'])document.querySelector('[data-setting='+key+']').disabled=busy||project?.settings.ratio==='phone';}
function stopPlayback(){video.pause();$('play').textContent='▶';}
function currentSnapshot(){return structuredClone(project);}
function saveLocal(){
  if(!project)return Promise.resolve();clearTimeout(saveTimer);
  const snapshot=currentSnapshot(),source=blob;$('saved').textContent='Saving…';
  const job=saveQueue.catch(()=>{}).then(()=>saveProject(snapshot,source));saveQueue=job;
  return job.then(()=>{saveError=false;$('saved').textContent='Saved on this device';},e=>{saveError=true;$('saved').textContent='Not saved';say('Local save failed: '+e.message+'. Download a .strela backup.');});
}
function changed(){clearTimeout(saveTimer);saveTimer=setTimeout(saveLocal,250);$('export-result').hidden=true;refresh();}
function edit(fn){if(!editing())return;stopPlayback();history.push(currentSnapshot());fn();time=clamp(time,0,duration(plays()));selected=clamp(selected,0,project.clips.length-1);seekTo(time);changed();}
function refresh(){
  refreshButtons();if(!project)return;
  $('empty').hidden=true;$('name').value=project.name;$('seek').max=duration(plays());$('seek').value=time;
  document.querySelectorAll('[data-setting]').forEach(e=>{const value=project.settings[e.dataset.setting];if(e.type==='checkbox')e.checked=value;else e.value=value;});
  document.querySelectorAll('[data-theme]').forEach(e=>e.classList.toggle('selected',e.dataset.theme===project.settings.theme));
  const clips=$('clips');clips.replaceChildren();project.clips.forEach((c,i)=>{const b=document.createElement('button');b.className='clip'+(i===selected?' selected':'');b.style.flex=String(c.end-c.start);b.disabled=busy;b.setAttribute('aria-label',`Select clip ${i+1}`);if(thumbs.length)b.style.backgroundImage=`url("${thumbs[Math.min(thumbs.length-1,Math.floor(c.start/project.duration*thumbs.length))]}")`;const span=document.createElement('span');span.textContent=`${i+1} · ${(c.end-c.start).toFixed(1)}s`;b.append(span);b.onclick=()=>{selected=i;stopPlayback();seekTo(timelineTime(plays(),c.start)??0);refresh();};clips.append(b);});
  $('trim-start').value=project.clips[selected].start.toFixed(2);$('trim-end').value=project.clips[selected].end.toFixed(2);
  const points=$('points');points.replaceChildren();project.points.forEach((p,i)=>{if(timelineTime(project.clips,p.t)===null)return;const b=document.createElement('button');b.disabled=busy;b.textContent=(p.auto?'✦ ':'')+p.t.toFixed(1)+'s ×';b.setAttribute('aria-label','Remove focus at '+p.t.toFixed(1)+' seconds');b.onclick=()=>edit(()=>project.points.splice(i,1));points.append(b);});
  const sped=plays().filter(c=>c.speed>1),pauses=(project.analysis?.quiet||[]).filter(([a,b])=>b-a>=3).length;$('speedup').checked=!!project.settings.speedup;
  $('pause-note').textContent=project.settings.speedup?(sped.length?`${sped.length} pause${sped.length===1?'':'s'} sped up: ${clock(duration(project.clips))} → ${clock(duration(plays()))}. Their audio is muted.`:'No pauses of 3 seconds or longer.'):project.analysis?.version===4?`${pauses} pause${pauses===1?'':'s'} of 3 seconds or longer found.`:'Plays stretches without on-screen change up to 16× faster. Their audio is muted.';
  const found=project.analysis?.points.length??0;
  $('auto-note').textContent=project.events.length?`${project.events.length} click cues available. Auto-focus stays editable.`:project.analysis?project.analysis.error?'Analysis unavailable; full frame preserved. Pause and click to add focus.':found?`${found} visual focus point${found===1?'':'s'}. Review focus before sharing.`:'No reliable local changes: full frame preserved. Pause and click to add focus.':'Generate auto-focus analyses the video on this device. You can also pause and click to add focus.';
  $('source-info').textContent=`${project.width} × ${project.height} · ${project.audio?'With audio':'No audio'} · ${(blob.size/1024/1024).toFixed(1)} MB`;
  const [w,h]=size(project.settings.ratio,720);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  video.volume=clamp(project.settings.volume,0,1);
}
function seekTo(t){time=clamp(t,0,duration(plays()));const st=Math.min(project.duration-.001,sourceTime(plays(),time));video.currentTime=Math.max(0,st);$('seek').value=time;}
async function openMedia(source,existing=null,events=[]){
  stopPlayback();const metadata=await inspect(source);
  if(!Number.isFinite(metadata.duration)||metadata.duration<=.05)throw new Error('The recording is empty or its duration could not be read.');
  if(existing){existing=validateProject(existing);if(existing.duration>metadata.duration+.1)throw new Error('Project ranges do not match its source video.');}
  const next=existing||{id:crypto.randomUUID(),version:1,name:source.name?.replace(/\.[^.]+$/,'')||'Untitled demo',mime:source.type,...metadata,clips:[{start:0,end:metadata.duration}],events:events.filter(e=>e.t>=0&&e.t<metadata.duration),points:[],settings:{...defaults}};
  if(!existing)next.points=autoFocus(next.events);
  Object.assign(next,{width:metadata.width,height:metadata.height,mediaStart:metadata.mediaStart,audio:metadata.audio,sourceFps:metadata.sourceFps});
  if(url)URL.revokeObjectURL(url);blob=source;project=next;url=URL.createObjectURL(source);video.src=url;time=0;selected=0;geometry=null;history=new History();thumbs=[];$('export-result').hidden=true;
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>done(new Error('Video loading timed out.')),12000);const loaded=()=>done();const failed=()=>done(new Error('Video playback is unsupported.'));function done(e){clearTimeout(timer);video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);e?reject(e):resolve();}video.addEventListener('loadeddata',loaded,{once:true});video.addEventListener('error',failed,{once:true});});
  refresh();await saveLocal();const id=project.id;thumbnails(blob).then(images=>{if(project?.id===id){thumbs=images;refresh();}}).catch(()=>{});
  say(next.events.length?'Auto-focus is ready. Play to preview, or pause and click to adjust.':'Ready to edit. Pause and click to add focus.');
}
function frame(){
  if(project&&video.readyState>=2){
    if(!video.paused){const clips=plays(),now=clips.find(c=>video.currentTime>=c.start&&video.currentTime<c.end),speed=now?.speed||1;if(video.playbackRate!==speed){video.playbackRate=speed;video.muted=speed>1;}let mapped=timelineTime(clips,video.currentTime);if(mapped===null){const next=clips.find(c=>c.start>=video.currentTime-.02);if(next)video.currentTime=next.start;else{stopPlayback();time=duration(plays());}}else time=mapped;}
    geometry=render(canvas,video,project.width,project.height,project,video.currentTime);$('seek').value=time;$('clock').textContent=`${clock(time)} / ${clock(duration(plays()))}`;
  }
  requestAnimationFrame(frame);
}frame();
video.addEventListener('ended',()=>{stopPlayback();if(project)time=duration(plays());});
video.addEventListener('error',()=>say('Video playback failed. Save the original and try importing it again.'));
$('play').onclick=async()=>{if(!editing())return;if(!video.paused)stopPlayback();else{if(time>=duration(plays())-.05)seekTo(0);try{await video.play();$('play').textContent='❚❚';}catch(e){say(e.message);}}};
$('back').onclick=()=>{stopPlayback();seekTo(0);};$('seek').oninput=()=>{stopPlayback();seekTo(Number($('seek').value));};
canvas.onclick=e=>{
  if(!editing()||!video.paused||!geometry)return;const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)*canvas.width/b.width,y=(e.clientY-b.top)*canvas.height/b.height,o=geometry.overview,g=o&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h?o:geometry;
  if(x<g.x||y<g.y||x>g.x+g.w||y>g.y+g.h)return;
  edit(()=>project.points.push({id:crypto.randomUUID(),t:video.currentTime,x:(g.crop.x+(x-g.x)/g.w*g.crop.w)/project.width,y:(g.crop.y+(y-g.y)/g.h*g.crop.h)/project.height,auto:false}));
};
// Split the user's edit at the same source moment, whatever speed the effective timeline plays at.
$('split').onclick=()=>edit(()=>project.clips=split(project.clips,timelineTime(project.clips,sourceTime(plays(),time))??time));
$('delete-clip').onclick=()=>{if(project?.clips.length>1)edit(()=>project.clips.splice(selected,1));};
$('trim').onclick=()=>{const start=Number($('trim-start').value),end=Number($('trim-end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>project.duration||end-start<.1){say('Choose a valid clip range of at least 0.1 seconds.');return;}const prev=project.clips[selected-1],next=project.clips[selected+1];if(prev&&start<prev.end||next&&end>next.start){say('Clip ranges cannot overlap.');return;}edit(()=>project.clips[selected]={...project.clips[selected],start,end});};
// Visual analysis in a worker. The caller owns busy state; an AbortError means the user cancelled.
async function findFocus(){
  analysisController=new AbortController();
  $('progress-title').textContent='Finding areas of attention…';$('progress-label').textContent='Analysing your video locally';$('progress').value=0;$('cancel').hidden=false;$('cancel').textContent='Cancel analysis';$('progress-dialog').showModal();
  try{return await analyzeVideo(blob,p=>{$('progress').value=p;$('progress-label').textContent=Math.round(p*100)+'% · visual analysis';},analysisController.signal);}
  catch(error){if(error.name==='AbortError')throw error;return {points:[],samples:0,error:error.message};}
  finally{analysisController=null;$('progress-dialog').close();}
}
function focusReport(result){return result.error?'Analysis failed: '+result.error+' Pause and click the video to add focus.':result.points.length?`${result.points.length} focus point${result.points.length===1?'':'s'} found. Play to preview, then export.`:'No clear areas of change found, so the full frame stays. Pause and click the video to add focus.';}
$('auto').onclick=async()=>{
  if(!editing())return;
  if(project.events.length){edit(()=>project.points=[...project.points.filter(p=>!p.auto),...autoFocus(project.events)]);say(`${project.points.filter(p=>p.auto).length} focus points from recorded clicks.`);return;}
  // Version 2 fixed missed WebM frames, 3 added changed-area sizes, 4 adds pauses and the follow track. Older analyses are redone.
  let result=project.analysis?.version===4&&!project.analysis.error&&project.analysis.points.length?project.analysis:null;
  if(!result){stopPlayback();setBusy(true);try{result=await findFocus();}catch(error){say('Analysis cancelled. Focus points are unchanged.');}finally{setBusy(false);}}
  if(!result)return;
  edit(()=>{project.points=[...project.points.filter(p=>!p.auto),...structuredClone(result.points)];project.analysis={method:'visual-change',...result};});
  say(focusReport(result));
};
$('speedup').onchange=async()=>{
  if(!editing()){refresh();return;}
  const on=$('speedup').checked;
  if(on&&project.analysis?.version!==4){
    // Pauses come from analysis; earlier analyses did not record them.
    stopPlayback();setBusy(true);let result;try{result=await findFocus();}catch(error){say('Analysis cancelled. Pauses play at normal speed.');}finally{setBusy(false);}
    if(!result||result.error){if(result?.error)say('Analysis failed: '+result.error);refresh();return;}
    edit(()=>{project.analysis={method:'visual-change',...result};project.settings.speedup=true;});
  }else edit(()=>project.settings.speedup=on);
  const sped=plays().filter(c=>c.speed>1).length;
  say(!on?'Pauses play at normal speed.':sped?`Sped up ${sped} pause${sped===1?'':'s'}: ${clock(duration(project.clips))} → ${clock(duration(plays()))}. Undo restores normal speed.`:'No pauses of 3 seconds or longer to speed up.');
};
$('undo').onclick=()=>{if(!editing())return;stopPlayback();project=history.undo(project);selected=clamp(selected,0,project.clips.length-1);seekTo(Math.min(time,duration(plays())));changed();};
$('redo').onclick=()=>{if(!editing())return;stopPlayback();project=history.redo(project);selected=clamp(selected,0,project.clips.length-1);seekTo(Math.min(time,duration(plays())));changed();};
$('name').onchange=()=>edit(()=>project.name=$('name').value.trim()||'Untitled demo');
document.querySelectorAll('[data-setting]').forEach(e=>e.onchange=()=>{const value=e.type==='checkbox'?e.checked:e.tagName==='SELECT'?e.value:Number(e.value);edit(()=>project.settings[e.dataset.setting]=value);});
document.querySelectorAll('[data-theme]').forEach(e=>e.onclick=()=>edit(()=>project.settings.theme=e.dataset.theme));
$('preset').onchange=()=>{const preset=$('preset').value;edit(()=>Object.assign(project.settings,preset==='phone'?{ratio:'phone',theme:'black',padding:0,radius:0,zoom:1.8,hold:2.8,shadow:false,clicks:false,resolution:1206,fps:outputRate(project.sourceFps)}:preset==='tutorial'?{zoom:2,hold:2.8,ratio:'wide',theme:'mint'}:preset==='social'?{zoom:1.5,hold:1.4,ratio:'portrait',theme:'sunset'}:{zoom:1.7,hold:2,ratio:'wide',theme:'lavender'}));};
$('original').onclick=()=>download(blob,filename()+'-original.'+(blob.type.includes('mp4')?'mp4':'webm'));
async function importMedia(file){if(!file||busy)return;setBusy(true);let renderAfter=false;try{
  await saveLocal();if(file.name.toLowerCase().endsWith('.strela')){const saved=await readArchive(file);await openMedia(saved.blob,saved.project);}
  else{
    await openMedia(file);const result=await findFocus();
    project.points=result.points;project.analysis={method:'visual-change',...result};
    Object.assign(project.settings,{ratio:'phone',theme:'black',padding:0,radius:0,zoom:1.8,hold:2.8,shadow:false,clicks:false,resolution:1206,fps:outputRate(project.sourceFps)});
    $('preset').value='phone';refresh();await saveLocal();renderAfter=true;
  }
 }catch(error){say(error.name==='AbortError'?'Analysis cancelled. Original video remains available.':error.message);}
 finally{setBusy(false);}
 if(renderAfter){$('format').value='mp4';$('resolution').value='1206';$('fps').value=String(project.settings.fps);$('size').value=project.settings.size;autoDownload=true;$('start-export').click();}
}
$('file').onchange=async e=>{try{await importMedia(e.target.files[0]);}finally{e.target.value='';}};
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
  try{saveLocal();const info=await capture.start(options);$('recording').hidden=false;$('stop-record').disabled=$('pause-record').disabled=false;say(info.tracking?'Recording with click cues. Return here to stop.':'Recording. After you stop, Strela finds focus from visual changes in the video.');
    const result=await capture.done;await openMedia(result.blob,null,result.events);if(!saveError)await clearChunks(result.id);
    // Screens and windows expose no clicks, so find focus visually as an import does.
    if(!project.events.length){try{const found=await findFocus();project.points=found.points;project.analysis={method:'visual-change',...found};refresh();await saveLocal();say(focusReport(found));}catch(e){if(e.name!=='AbortError')throw e;say('Analysis cancelled. Use Generate auto-focus later, or pause and click to add focus.');}}
  }catch(e){say('Recording: '+e.message);}finally{setBusy(false);$('recording').hidden=true;}
};
$('pause-record').onclick=()=>capture.pause();$('stop-record').onclick=()=>capture.stop();
$('demo').onclick=async()=>{if(busy)return;setBusy(true);$('progress-title').textContent='Preparing a sample story…';$('progress-label').textContent='Creating a sample for the automatic import pipeline';$('progress').value=0;$('cancel').hidden=true;$('progress-dialog').showModal();let sample;try{sample=await demo(p=>$('progress').value=p);}catch(e){say(e.message);}finally{$('progress-dialog').close();setBusy(false);}if(sample)await importMedia(new File([sample.blob],'Fieldnotes demo.webm',{type:sample.blob.type}));};
$('export').onclick=()=>{if(!editing())return;for(const o of $('fps').options)o.textContent=o.value+' fps'+(project.sourceFps&&Number(o.value)===outputRate(project.sourceFps)?' · matches source':'');$('resolution').value=project.settings.resolution;$('fps').value=project.settings.fps;$('size').value=project.settings.size;$('quality-note').textContent='Small text: use MP4 and a 1440p/4K source. Phone mode keeps the full frame above the detail. Upscaling cannot restore missing detail.';$('export-dialog').showModal();};
$('format').onchange=()=>{$('resolution').disabled=$('fps').disabled=$('size').disabled=$('format').value==='gif';};
function finishExport(){worker?.terminate();worker=null;$('progress-dialog').close();setBusy(false);}
$('cancel').onclick=()=>{if(analysisController){analysisController.abort();return;}finishExport();say('Export cancelled. Your project is unchanged.');};
$('progress-dialog').addEventListener('cancel',e=>e.preventDefault());
$('start-export').onclick=()=>{
  if(!editing())return;stopPlayback();const format=$('format').value;project.settings.resolution=Number($('resolution').value);project.settings.fps=Number($('fps').value);project.settings.size=$('size').value;saveLocal();$('export-dialog').close();setBusy(true);$('progress-title').textContent='Rendering your video…';$('progress-label').textContent='Preparing codecs';$('progress').value=0;$('cancel').hidden=false;$('cancel').textContent='Cancel export';$('progress-dialog').showModal();
  $('export-result').hidden=true;
  // Only the automatic import render saves on its own; manual exports wait for Download.
  const saveAfter=autoDownload;autoDownload=false;
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
        const meta=data.mime==='image/gif'?data.summary:await inspect(candidate,{decode:false});
        if(worker!==activeWorker)return;
        if(Math.abs(meta.duration-duration(timeline(exportProject)))>.15)throw new Error('Output duration differs from the timeline.');
        if(data.mime!=='image/gif'&&exportProject.audio&&exportProject.settings.volume>0&&!meta.audio)throw new Error('Output audio is missing.');
        const [expectedW,expectedH]=size(exportProject.settings.ratio,data.mime==='image/gif'?360:exportProject.settings.resolution);
        if(meta.width!==expectedW||meta.height!==expectedH)throw new Error('Output dimensions do not match the selected format.');
        exportBlob=candidate;if(exportURL)URL.revokeObjectURL(exportURL);exportURL=URL.createObjectURL(exportBlob);
        $('export-video').src=data.mime==='image/gif'?'':exportURL;$('export-video').hidden=data.mime==='image/gif';$('export-image').hidden=data.mime!=='image/gif';
        if(data.mime==='image/gif')$('export-image').src=exportURL;
        $('export-result').hidden=false;$('export-details').textContent=`${meta.width} × ${meta.height} · ${meta.duration.toFixed(2)}s · ${meta.audio?'audio included':'no audio'} · ${(exportBlob.size/1024/1024).toFixed(1)} MB`;
        // A distinct name keeps the render apart from a source file with the same project name.
        $('download-export').onclick=()=>download(exportBlob,filename()+' - Strela.'+format);if(saveAfter)$('download-export').click();
        say((data.mime==='image/gif'?'GIF rendered. Watch or download it below.':'Export passed duration, dimensions and audio-track checks. Watch or download it below.')+(data.codec==='hevc'?' Encoded as HEVC (H.265): H.264 does not support this frame size.':'')+(exportProject.points.length?'':' No focus points, so the video keeps the full frame.')+(saveAfter?` Download started: ${filename()} - Strela.${format}`:''));
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
