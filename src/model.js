export const defaults = {theme:'lavender',ratio:'wide',padding:64,radius:20,zoom:1.7,hold:2,shadow:true,clicks:false,volume:1,fps:30,resolution:1080,size:'balanced',speedup:false};
// Target bits per pixel per frame and the floor for each export size. Screen footage is mostly static,
// so variable-bitrate files stay well below the target; 'best' keeps the 0.4.x rate.
export const SIZES={best:{bpp:.18,min:12e6},balanced:{bpp:.07,min:6e6},small:{bpp:.035,min:3e6}};
// Output cadence for a source frame rate: 25/50 fps sources keep a 50 fps grid, since 60 fps would
// repeat every fifth frame and make scrolling judder; everything else, including variable-rate
// screen capture, renders at 60.
export function outputRate(sourceFps){return sourceFps>=22&&sourceFps<=27||sourceFps>=45&&sourceFps<=55?50:60;}
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ease=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
// Clips may carry a playback speed (sped-up pauses); timeline time is source time divided by it.
const rate=c=>c.speed||1;
export function duration(clips){return clips.reduce((n,c)=>n+(c.end-c.start)/rate(c),0);}
export function sourceTime(clips,time){let elapsed=0;for(const c of clips){const d=(c.end-c.start)/rate(c);if(time<elapsed+d)return c.start+Math.max(0,time-elapsed)*rate(c);elapsed+=d;}return clips.at(-1)?.end||0;}
export function timelineTime(clips,time){let elapsed=0;for(const c of clips){if(time>=c.start&&time<c.end)return elapsed+(time-c.start)/rate(c);elapsed+=(c.end-c.start)/rate(c);}return null;}
export function split(clips,time){let elapsed=0;for(let i=0;i<clips.length;i++){const c=clips[i],d=(c.end-c.start)/rate(c);if(time>elapsed+.08&&time<elapsed+d-.08){const at=c.start+(time-elapsed)*rate(c);return [...clips.slice(0,i),{...c,end:at},{...c,start:at},...clips.slice(i+1)];}elapsed+=d;}return clips;}
// Pauses found by analysis play faster instead of being cut, so cursor drift stays visible. Half a
// second at each edge keeps normal speed; the rest is squeezed towards one second, at most 16x
// (the browser's playback-rate limit, which the preview relies on).
export const PAUSE={min:3,edge:.5,max:16};
export function speedUpPauses(clips,quiet){
  const out=[];
  for(const c of clips){
    let cursor=c.start;
    for(const [a,b] of quiet){
      const from=Math.max(a+PAUSE.edge,cursor),to=Math.min(b-PAUSE.edge,c.end);
      if(b-a<PAUSE.min||to-from<1)continue;
      if(from>cursor)out.push({...c,start:cursor,end:from});
      out.push({...c,start:from,end:to,speed:Math.min(PAUSE.max,Math.max(2,Math.round(to-from)))});cursor=to;
    }
    if(c.end>cursor)out.push({...c,start:cursor,end:c.end});
  }
  return out;
}
// The clips that play: the user's edit, with pauses sped up when that setting is on.
export function timeline(p){return p.settings?.speedup&&p.analysis?.quiet?.length?speedUpPauses(p.clips,p.analysis.quiet):p.clips;}
export function autoFocus(events){
  const clicks=events.filter(e=>e.type==='click'&&Number.isFinite(e.t)&&e.x>=0&&e.x<=1&&e.y>=0&&e.y<=1).sort((a,b)=>a.t-b.t);
  const groups=[];
  for(const e of clicks){const last=groups.at(-1);if(last&&e.t-last.last<1.3&&Math.hypot(e.x-last.x,e.y-last.y)<.18){last.x=(last.x*last.count+e.x)/(last.count+1);last.y=(last.y*last.count+e.y)/(last.count+1);last.last=e.t;last.count++;}else groups.push({...e,last:e.t,count:1});}
  return groups.map(g=>({id:crypto.randomUUID(),t:g.t,x:g.x,y:g.y,auto:true}));
}
// Camera planning. Focus points are grouped into shots. The frame arrives LEAD seconds before an
// action and stays at least `hold` seconds after it; when the next shot is close, it pans straight
// there instead of zooming out and back in. Averaging neighbouring points parked the frame between
// two actions, so shots are visited one at a time. Narrow layouts (phone detail, portrait, square)
// rest on the last shot rather than a slice through the source centre. The planned crops are chased
// by a critically damped spring and cached at 60 Hz, so preview and export read one smooth path.
const LEAD=.4,ZOOM_IN=.9,ZOOM_OUT=.9,PAN_MAX=1,PAN_MIN=.4,CONNECT=1.5,MIN_HOLD=.6,MERGE_T=1.2,MERGE_D=.12,RATE=60,OMEGA=14,LAG=2/OMEGA;
const paths=new Map();
// Timeline position of a source time; times inside removed gaps map to the next kept clip.
function timelineClamp(clips,t){let elapsed=0;for(const c of clips){if(t<c.start)return elapsed;if(t<c.end)return elapsed+(t-c.start)/rate(c);elapsed+=(c.end-c.start)/rate(c);}return elapsed;}
function shots(points){
  const out=[];
  for(const p of points){const last=out.at(-1);if(last&&p.t-last.t1<MERGE_T&&Math.hypot(p.x-last.x,p.y-last.y)<MERGE_D){const n=last.n+1;last.x=(last.x*last.n+p.x)/n;last.y=(last.y*last.n+p.y)/n;last.t1=p.t;last.n=n;if(p.w>0&&p.h>0){last.w=Math.max(last.w||0,p.w);last.h=Math.max(last.h||0,p.h);}}else out.push({t0:p.t,t1:p.t,x:p.x,y:p.y,w:p.w,h:p.h,n:1});}
  return out;
}
function plan(points,settings,bw,bh){
  const sticky=bw<.98||bh<.98,list=shots(points),keys=[];
  const crop=(x,y,z)=>{const w=bw/z,h=bh/z;return {x:clamp(x-w/2,0,1-w),y:clamp(y-h/2,0,1-h),w,h};};
  // Visual changes carry their changed area: small controls get a closer shot, large panels a wider one.
  const shot=s=>crop(s.x,s.y,s.w>0&&s.h>0?clamp(.6*Math.min(bw/s.w,bh/s.h),1+(settings.zoom-1)*.4,settings.zoom):settings.zoom);
  const rest=s=>crop(sticky&&s?s.x:.5,sticky&&s?s.y:.5,1);
  const key=(t,r)=>keys.push({t:keys.length?Math.max(t,keys.at(-1).t):t,r});
  // One crop object per shot: the path treats consecutive keys sharing a crop as a hold.
  const rects=list.map(shot);key(-1,rest(list[0]));let arrived=false;
  list.forEach((s,i)=>{
    const r=rects[i],next=list[i+1],leave=s.t1+settings.hold;
    if(!arrived){const start=Math.max(keys.at(-1).t,s.t0-LEAD-ZOOM_IN);key(start,keys.at(-1).r);key(Math.max(s.t0-LEAD,start+PAN_MIN),r);}
    arrived=!!next&&next.t0-LEAD-ZOOM_IN-(leave+ZOOM_OUT)<CONNECT;
    if(arrived){const start=Math.max(next.t0-LEAD-PAN_MAX,s.t1+MIN_HOLD);key(start,r);key(Math.max(next.t0-LEAD,start+PAN_MIN),rects[i+1]);}
    else{key(leave,r);key(leave+ZOOM_OUT,rest(s));}
  });
  return keys;
}
// Follow: while the frame holds a shot or rests between shots, later visual changes inside the
// central 75% leave it still; a change beyond that shifts it only part of the way (Screenize's dead
// zone), so the frame keeps up with the work without chasing every flicker. Changes are read
// slightly ahead (FOLLOW.look) so the move starts as the action does.
// A shift takes 0.6 s plus 0.9 s per frame width travelled, at most 1.2 s, so long moves are not whip pans.
// While zoomed on a shot, changes within `reach` of it are followed at once. A change farther away is
// followed only when another change landed near it within `confirm` seconds before: a dialog being
// opened and used, rather than a single redraw somewhere else on screen.
const FOLLOW={safe:.75,correction:.45,look:.15,move:.6,perWidth:.9,maxMove:1.2,reach:.25,confirm:1.5,near:.15};
function follow(centre,half,hit){const off=hit-centre,safe=half*FOLLOW.safe;if(Math.abs(off)<=safe)return centre;const next=hit-Math.sign(off)*safe*(1-FOLLOW.correction);return clamp(next,half,1-half);}
// Exact step of a critically damped spring towards a target held constant over dt.
function chase(x,v,goal,dt){const y=x-goal,e=Math.exp(-OMEGA*dt),a=v+OMEGA*y;return [goal+(y+a*dt)*e,(v-OMEGA*a*dt)*e];}
const trackIds=new WeakMap();
function trackId(track){if(!track.length)return '';if(!trackIds.has(track))trackIds.set(track,JSON.stringify(track));return trackIds.get(track);}
function path(points,track,settings,width,height,aspect){
  const id=JSON.stringify([points.map(p=>[p.t,p.x,p.y,p.w,p.h]),settings.zoom,settings.hold,width,height,aspect])+trackId(track);
  if(paths.has(id))return paths.get(id);
  const bw=Math.min(width,height*aspect)/width,bh=Math.min(width/aspect,height)/height,keys=plan(points,settings,bw,bh);
  const count=Math.ceil((keys.at(-1).t+2)*RATE)+1,data=new Float64Array(count*3),v=[0,0,0],c=[];
  // A follow shift eases from where the frame is to its new offset over FOLLOW.move seconds.
  let seg=0,held=null,shift={fx:0,fy:0,tx:0,ty:0,t0:0,d:FOLLOW.move},next=0;
  const now=t=>{const e=ease((t-shift.t0)/shift.d);return {x:shift.fx+(shift.tx-shift.fx)*e,y:shift.fy+(shift.ty-shift.fy)*e};};
  const moved=(r,o)=>({...r,x:clamp(r.x+o.x,0,1-r.w),y:clamp(r.y+o.y,0,1-r.h)});
  for(let i=0;i<count;i++){
    const t=i/RATE+LAG;while(seg+1<keys.length&&keys[seg+1].t<=t)seg++;
    const a=keys[seg],b=keys[seg+1];let g;
    if(!b||t<=a.t||a.r===b.r){
      // Holding: a new shot or rest resets the shift and only reads changes from that moment on.
      if(held!==a.r){held=a.r;shift={fx:0,fy:0,tx:0,ty:0,t0:t,d:FOLLOW.move};while(next<track.length&&track[next][0]<t)next++;}
      while(next<track.length&&track[next][0]<=t+FOLLOW.look){const [ht,hx,hy]=track[next],prev=track[next-1];next++;
        if(a.r.w<bw-1e-9&&Math.hypot(hx-(a.r.x+a.r.w/2),hy-(a.r.y+a.r.h/2))>FOLLOW.reach&&!(prev&&ht-prev[0]<=FOLLOW.confirm&&Math.hypot(hx-prev[1],hy-prev[2])<=FOLLOW.near))continue;
        const r=moved(a.r,{x:shift.tx,y:shift.ty}),o=now(t),tx=shift.tx+follow(r.x+r.w/2,r.w/2,hx)-(r.x+r.w/2),ty=shift.ty+follow(r.y+r.h/2,r.h/2,hy)-(r.y+r.h/2);if(tx!==shift.tx||ty!==shift.ty)shift={fx:o.x,fy:o.y,tx,ty,t0:t,d:Math.min(FOLLOW.maxMove,FOLLOW.move+FOLLOW.perWidth*Math.hypot(tx-o.x,ty-o.y))};}
      g=moved(a.r,now(t));
    }else{
      // Moving on: start from where following left the frame, so the planned move has no jump.
      const e=ease((t-a.t)/(b.t-a.t)),from=held===a.r?moved(a.r,now(t)):a.r;g={};for(const k of ['x','y','w','h'])g[k]=from[k]+(b.r[k]-from[k])*e;
    }
    const goal=[g.x,g.y,g.w];
    for(let k=0;k<3;k++){if(!i)c[k]=goal[k];else[c[k],v[k]]=chase(c[k],v[k],goal[k],1/RATE);}
    const w=clamp(c[2],0,bw),h=w*bh/bw;data.set([clamp(c[0],0,1-w),clamp(c[1],0,1-h),w],i*3);
  }
  const last=keys.at(-1),result={data,end:(count-1)/RATE,final:held===last.r?moved(last.r,{x:shift.tx,y:shift.ty}):last.r,ratio:bh/bw};
  if(paths.size>7)paths.delete(paths.keys().next().value);paths.set(id,result);return result;
}
// `track` holds [time, x, y] visual changes in source time; it only refines framing between the
// planned moves, which still come from the editable focus points.
export function camera(points,t,width,height,settings=defaults,aspect=width/height,clips=null,track=[]){
  const timed=[];for(const p of points){const at=clips?timelineTime(clips,p.t):p.t;if(at!==null)timed.push({...p,t:at});}timed.sort((a,b)=>a.t-b.t);
  const follows=clips?track.map(([s,x,y])=>[timelineTime(clips,s),x,y]).filter(h=>h[0]!==null):track;
  if(clips&&track.length&&!trackIds.has(follows)){trackIds.set(follows,trackId(track)+JSON.stringify(clips));}
  const {data,end,final,ratio}=path(timed,follows,settings,width,height,aspect),at=Math.max(0,clips?timelineClamp(clips,t):t);
  let r=final;
  if(at<end){const f=at*RATE,i=Math.floor(f),k=f-i,j=i*3,n=j+3;r={x:data[j]+(data[n]-data[j])*k,y:data[j+1]+(data[n+1]-data[j+1])*k,w:data[j+2]+(data[n+2]-data[j+2])*k};r.h=r.w*ratio;}
  return {x:r.x*width,y:r.y*height,w:r.w*width,h:r.h*height};
}
export function validateProject(raw){
  if(!raw||raw.version!==1||!Number.isFinite(raw.duration)||raw.duration<=0||raw.duration>86400)throw new Error('Unsupported or invalid Strela project.');
  if(!Array.isArray(raw.clips)||!raw.clips.length||raw.clips.length>1000||raw.clips.some(c=>!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end>raw.duration+.01||c.end-c.start<.05))throw new Error('Invalid clip ranges.');
  if(raw.clips.some((c,i)=>i>0&&c.start<raw.clips[i-1].end))throw new Error('Clip ranges must be ordered and non-overlapping.');
  if(raw.clips.some(c=>c.speed!==undefined&&!(c.speed>=1&&c.speed<=PAUSE.max)))throw new Error('Invalid clip speed.');
  if(!Array.isArray(raw.points)||raw.points.length>10000||raw.points.some(p=>!Number.isFinite(p.t)||p.t<0||p.t>raw.duration||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))throw new Error('Invalid focus points.');
  const s={...defaults,...raw.settings};
  if(!['wide','portrait','square','phone'].includes(s.ratio)||!['lavender','mint','sunset','midnight','black'].includes(s.theme))throw new Error('Invalid visual settings.');
  for(const [key,min,max] of [['padding',0,180],['radius',0,80],['zoom',1,3],['hold',.8,5],['volume',0,2]]){if(!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw new Error('Invalid '+key);}
  if(typeof s.speedup!=='boolean')throw new Error('Invalid pause setting.');
  if(![30,50,60].includes(s.fps)||![720,1080,1206,2160].includes(s.resolution)||!Object.hasOwn(SIZES,s.size))throw new Error('Invalid export settings.');
  const events=Array.isArray(raw.events)?raw.events.filter(e=>e.type==='click'&&Number.isFinite(e.t)&&e.t>=0&&e.t<=raw.duration&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.x<=1&&e.y>=0&&e.y<=1).slice(0,10000):[];
  return {...raw,name:String(raw.name||'Untitled').slice(0,100),settings:s,events};
}
export class History {
  constructor(){this.past=[];this.future=[];}
  push(p){this.past.push(structuredClone(p));if(this.past.length>60)this.past.shift();this.future=[];}
  undo(p){if(!this.past.length)return p;this.future.push(structuredClone(p));return this.past.pop();}
  redo(p){if(!this.future.length)return p;this.past.push(structuredClone(p));return this.future.pop();}
}
