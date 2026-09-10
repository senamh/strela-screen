export const defaults = {theme:'lavender',ratio:'wide',padding:64,radius:20,zoom:1.7,hold:2,shadow:true,clicks:false,volume:1,fps:30,resolution:1080};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ease=x=>{x=clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
export function duration(clips){return clips.reduce((n,c)=>n+(c.end-c.start),0);}
export function sourceTime(clips,time){let elapsed=0;for(const c of clips){const d=c.end-c.start;if(time<elapsed+d)return c.start+Math.max(0,time-elapsed);elapsed+=d;}return clips.at(-1)?.end||0;}
export function timelineTime(clips,time){let elapsed=0;for(const c of clips){if(time>=c.start&&time<c.end)return elapsed+time-c.start;elapsed+=c.end-c.start;}return null;}
export function split(clips,time){let elapsed=0;for(let i=0;i<clips.length;i++){const c=clips[i],d=c.end-c.start;if(time>elapsed+.08&&time<elapsed+d-.08){const at=c.start+time-elapsed;return [...clips.slice(0,i),{...c,end:at},{...c,start:at},...clips.slice(i+1)];}elapsed+=d;}return clips;}
export function autoFocus(events){
  const clicks=events.filter(e=>e.type==='click'&&Number.isFinite(e.t)&&e.x>=0&&e.x<=1&&e.y>=0&&e.y<=1).sort((a,b)=>a.t-b.t);
  const groups=[];
  for(const e of clicks){const last=groups.at(-1);if(last&&e.t-last.last<1.3&&Math.hypot(e.x-last.x,e.y-last.y)<.18){last.x=(last.x*last.count+e.x)/(last.count+1);last.y=(last.y*last.count+e.y)/(last.count+1);last.last=e.t;last.count++;}else groups.push({...e,last:e.t,count:1});}
  return groups.map(g=>({id:crypto.randomUUID(),t:g.t,x:g.x,y:g.y,auto:true}));
}
export function camera(points,t,width,height,settings=defaults,aspect=width/height){
  let total=0,x=0,y=0,uncovered=1;
  for(const p of points){const weight=ease((settings.hold-Math.abs(t-p.t))/.8);total+=weight;x+=p.x*weight;y+=p.y*weight;uncovered*=1-weight;}
  const amount=1-uncovered,z=1+(settings.zoom-1)*amount,baseW=Math.min(width,height*aspect),baseH=baseW/aspect,w=baseW/z,h=baseH/z;
  x=total?.5+(x/total-.5)*amount:.5;y=total?.5+(y/total-.5)*amount:.5;
  return {x:clamp(x*width-w/2,0,width-w),y:clamp(y*height-h/2,0,height-h),w,h};
}
export function validateProject(raw){
  if(!raw||raw.version!==1||!Number.isFinite(raw.duration)||raw.duration<=0||raw.duration>86400)throw new Error('Unsupported or invalid Strela project.');
  if(!Array.isArray(raw.clips)||!raw.clips.length||raw.clips.length>1000||raw.clips.some(c=>!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end>raw.duration+.01||c.end-c.start<.05))throw new Error('Invalid clip ranges.');
  if(raw.clips.some((c,i)=>i>0&&c.start<raw.clips[i-1].end))throw new Error('Clip ranges must be ordered and non-overlapping.');
  if(!Array.isArray(raw.points)||raw.points.length>10000||raw.points.some(p=>!Number.isFinite(p.t)||p.t<0||p.t>raw.duration||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))throw new Error('Invalid focus points.');
  const s={...defaults,...raw.settings};
  if(!['wide','portrait','square','phone'].includes(s.ratio)||!['lavender','mint','sunset','midnight','black'].includes(s.theme))throw new Error('Invalid visual settings.');
  for(const [key,min,max] of [['padding',0,180],['radius',0,80],['zoom',1,3],['hold',.8,5],['volume',0,2]]){if(!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw new Error('Invalid '+key);}
  if(![30,60].includes(s.fps)||![720,1080,1206,2160].includes(s.resolution))throw new Error('Invalid export settings.');
  const events=Array.isArray(raw.events)?raw.events.filter(e=>e.type==='click'&&Number.isFinite(e.t)&&e.t>=0&&e.t<=raw.duration&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.x<=1&&e.y>=0&&e.y<=1).slice(0,10000):[];
  return {...raw,name:String(raw.name||'Untitled').slice(0,100),settings:s,events};
}
export class History {
  constructor(){this.past=[];this.future=[];}
  push(p){this.past.push(structuredClone(p));if(this.past.length>60)this.past.shift();this.future=[];}
  undo(p){if(!this.past.length)return p;this.future.push(structuredClone(p));return this.past.pop();}
  redo(p){if(!this.future.length)return p;this.past.push(structuredClone(p));return this.future.pop();}
}
