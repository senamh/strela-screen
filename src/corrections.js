import {markManual} from './model.js';
// Manual corrections use the same project data and renderer as analysis and export.
export function createCorrections({getProject,isEditing,edit,seek,say,video}){
  const $=id=>document.getElementById(id);
  let selected=null,projectId=null,relocating=false,pending=null,anchor=null;
  const panel=document.createElement('section');panel.className='corrections';panel.hidden=true;
  panel.innerHTML=`<div id="focus-editor" hidden><div class="correction-fields">
    <label>Source time (s)<input id="focus-time" type="number" min="0" step=".1"></label>
    <label>Hold (s)<input id="focus-hold" type="number" min=".2" max="30" step=".1"></label>
    <label>Zoom<input id="focus-zoom" type="number" min="1" max="3" step=".1"></label>
    <button id="focus-apply">Apply focus</button><button id="focus-move" aria-pressed="false">Move in preview</button><button id="focus-remove">Remove focus</button><button id="focus-done">Done</button>
    </div><p>Hold uses playback seconds; the next focus takes precedence. Changes appear in the preview.</p></div>
    <details><summary>Keep content visible / preserve reading time</summary>
    <div class="correction-fields"><button id="area-open">Choose visible area</button><button id="area-clear" hidden>Clear area</button><span id="area-note"></span></div>
    <div class="correction-fields"><label>Source in (s)<input id="keep-in" type="number" min="0" step=".1" value="0"></label><label>Source out (s)<input id="keep-out" type="number" min="0" step=".1" value="5"></label><button id="keep-add">Keep original pace</button></div>
    <div id="keep-list"></div><p>Still frames can contain reading or narration. Pause speed-up is optional; protect those intervals before enabling it.</p></details>`;
  document.querySelector('.timeline').append(panel);
  const dialog=document.createElement('dialog');dialog.id='area-dialog';dialog.setAttribute('aria-labelledby','area-title');dialog.setAttribute('aria-describedby','area-description');
  dialog.innerHTML=`<form method="dialog"><button class="close" aria-label="Close visible area">×</button></form><h2 id="area-title">Keep this area visible</h2><p id="area-description">Drag over the source frame or enter percentages. The area is preserved throughout the video, including during transitions. A large area reduces magnification.</p><canvas id="area-preview" aria-label="Drag to select the protected source area"></canvas><div class="correction-fields">${['x','y','w','h'].map((k,i)=>`<label>${['Left','Top','Width','Height'][i]} (%)<input id="area-${k}" type="number" min="0" max="100" step=".1"></label>`).join('')}</div><p id="area-error" role="status"></p><button id="area-save" class="primary">Keep area visible</button>`;
  document.body.append(dialog);
  const focus=()=>getProject()?.points.find(p=>p.id===selected);
  function refresh(){
    const p=getProject();panel.hidden=!p;if(!p)return;
    if(projectId!==p.id){projectId=p.id;selected=null;relocating=false;}
    const f=focus(),points=$('points');points.replaceChildren();
    p.points.forEach(point=>{
      if(!p.clips.some(c=>point.t>=c.start&&point.t<c.end))return;
      const b=document.createElement('button');b.disabled=!isEditing();b.textContent=(point.auto?'✦ ':'')+point.t.toFixed(1)+'s';b.setAttribute('aria-label','Edit focus at '+point.t.toFixed(1)+' source seconds');b.setAttribute('aria-pressed',String(point===f));
      b.onclick=()=>{selected=point.id;relocating=false;seek(point.t);refresh();};points.append(b);
    });
    $('focus-editor').hidden=!f;
    if(f){$('focus-time').value=f.t.toFixed(2);$('focus-time').max=p.duration-.001;$('focus-hold').value=f.hold??p.settings.hold;$('focus-zoom').value=f.zoom??p.settings.zoom;}
    if(!f)relocating=false;
    $('focus-move').setAttribute('aria-pressed',String(relocating));$('focus-move').textContent=relocating?'Click a new location…':'Move in preview';
    $('area-clear').hidden=!p.settings.keepArea;$('area-note').textContent=p.settings.keepArea?'Protected throughout the video.':'Full source shown while choosing.';
    const list=$('keep-list');list.replaceChildren();
    (p.keepTime||[]).forEach(([a,b],i)=>{const button=document.createElement('button');button.disabled=!isEditing();button.textContent=`${a.toFixed(1)}–${b.toFixed(1)}s ×`;button.setAttribute('aria-label',`Remove original-pace range ${a} to ${b} seconds`);button.onclick=()=>edit(()=>p.keepTime.splice(i,1));list.append(button);});
  }
  for(const [id,key,min,max] of [['focus-time','t',0,Infinity],['focus-hold','hold',.2,30],['focus-zoom','zoom',1,3]])$(id).onchange=()=>{
    const p=getProject(),f=focus(),value=Number($(id).value),limit=key==='t'?p.duration-.001:max;
    if(!f||$(id).value===''||!Number.isFinite(value)||value<min||value>limit){say('Enter a valid focus value.');refresh();return;}
    edit(()=>{markManual(f);f[key]=value;if(key==='zoom'){delete f.w;delete f.h;}p.points.sort((a,b)=>a.t-b.t);});seek(f.t);
  };
  $('focus-move').onclick=()=>{relocating=!relocating;refresh();};
  $('focus-apply').onclick=()=>{
    const p=getProject(),f=focus(),t=Number($('focus-time').value),hold=Number($('focus-hold').value),zoom=Number($('focus-zoom').value);
    if(!f||!['focus-time','focus-hold','focus-zoom'].every(id=>$(id).value!=='')||![t,hold,zoom].every(Number.isFinite)||t<0||t>=p.duration||hold<.2||hold>30||zoom<1||zoom>3){say('Enter valid time, hold (0.2–30 s) and zoom (1–3).');return;}
    edit(()=>{markManual(f);Object.assign(f,{t,hold,zoom});delete f.w;delete f.h;p.points.sort((a,b)=>a.t-b.t);});seek(t);
  };
  $('focus-done').onclick=()=>{selected=null;refresh();};
  $('focus-remove').onclick=()=>edit(()=>{const p=getProject();p.points=p.points.filter(f=>f.id!==selected);selected=null;});
  $('keep-add').onclick=()=>{
    const p=getProject(),a=Number($('keep-in').value),b=Number($('keep-out').value);
    if(!$('keep-in').value||!$('keep-out').value||!Number.isFinite(a)||!Number.isFinite(b)||a<0||b>p.duration||b-a<.1){say('Choose a source interval of at least 0.1 seconds within the recording.');return;}
    edit(()=>{const ranges=[...(p.keepTime||[]),[a,b]].sort((x,y)=>x[0]-y[0]);p.keepTime=[];for(const r of ranges){const last=p.keepTime.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else p.keepTime.push(r);}});
  };
  const areaCanvas=$('area-preview');
  function paint(){
    const ctx=areaCanvas.getContext('2d');ctx.drawImage(video,0,0,areaCanvas.width,areaCanvas.height);
    if(pending){const {x,y,w,h}=pending,style=getComputedStyle(areaCanvas);ctx.fillStyle=style.getPropertyValue('--accent-soft').trim();ctx.fillRect(x*areaCanvas.width,y*areaCanvas.height,w*areaCanvas.width,h*areaCanvas.height);ctx.strokeStyle=style.getPropertyValue('--accent').trim();ctx.lineWidth=2;ctx.strokeRect(x*areaCanvas.width,y*areaCanvas.height,w*areaCanvas.width,h*areaCanvas.height);}
  }
  function areaInputs(){for(const k of ['x','y','w','h'])$('area-'+k).value=(pending[k]*100).toFixed(2);$('area-error').textContent='';paint();}
  $('area-open').onclick=()=>{
    if(!isEditing())return;video.pause();const p=getProject(),fit=Math.min(960/p.width,540/p.height);
    areaCanvas.width=Math.round(p.width*fit);areaCanvas.height=Math.round(p.height*fit);pending={...(p.settings.keepArea||{x:.1,y:.1,w:.8,h:.8})};anchor=null;dialog.showModal();areaInputs();
  };
  const coords=e=>{const r=areaCanvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};};
  areaCanvas.onpointerdown=e=>{anchor=coords(e);areaCanvas.setPointerCapture(e.pointerId);};
  areaCanvas.onpointermove=e=>{if(!anchor)return;const c=coords(e);pending={x:Math.min(c.x,anchor.x),y:Math.min(c.y,anchor.y),w:Math.abs(c.x-anchor.x),h:Math.abs(c.y-anchor.y)};areaInputs();};
  areaCanvas.onpointerup=areaCanvas.onpointercancel=()=>{anchor=null;};
  const readArea=()=>Object.fromEntries(['x','y','w','h'].map(k=>[k,$('area-'+k).value===''?NaN:Number($('area-'+k).value)/100]));
  for(const k of ['x','y','w','h'])$('area-'+k).oninput=()=>{pending=readArea();if(Object.values(pending).every(Number.isFinite))paint();};
  $('area-save').onclick=()=>{
    const a=readArea();if(!Object.values(a).every(Number.isFinite)||a.x<0||a.y<0||a.w<=0||a.h<=0||a.x+a.w>1+1e-9||a.y+a.h>1+1e-9){$('area-error').textContent='Choose a non-empty rectangle inside the source.';return;}
    edit(()=>getProject().settings.keepArea={...a});dialog.close();
  };
  $('area-clear').onclick=()=>edit(()=>delete getProject().settings.keepArea);
  return {refresh,place(x,y){
    const p=getProject(),f=focus();
    edit(()=>{if(relocating&&f){markManual(f);Object.assign(f,{x,y});delete f.w;delete f.h;relocating=false;}else{const point={id:crypto.randomUUID(),t:video.currentTime,x,y,auto:false};p.points.push(point);selected=point.id;}});
  }};
}
