import {camera,timelineTime} from './model.js';
export const themes={lavender:['#d1c6ff','#7972bc','#353c73'],mint:['#d7f5bd','#82b8aa','#294a52'],sunset:['#ffdaa6','#d799a8','#64509b'],midnight:['#303e58','#202b3d','#111723']};
export function size(ratio,resolution=1080){return ratio==='portrait'?[resolution,Math.round(resolution*16/9/2)*2]:ratio==='square'?[resolution,resolution]:[Math.round(resolution*16/9/2)*2,resolution];}
export function render(canvas,source,sw,sh,p,t){
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,s=p.settings,scale=Math.min(W,H)/1080;
  const grad=ctx.createLinearGradient(0,0,W,H);themes[s.theme].forEach((c,i)=>grad.addColorStop(i/2,c));ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  const pad=s.padding*scale,fit=Math.min((W-pad*2)/sw,(H-pad*2)/sh),w=s.ratio==='portrait'?W-pad*2:sw*fit,h=s.ratio==='portrait'?H-pad*2:sh*fit,x=(W-w)/2,y=(H-h)/2,r=Math.min(s.radius*scale,w/2,h/2),crop=camera(p.points.filter(point=>timelineTime(p.clips,point.t)!==null),t,sw,sh,s,w/h);
  ctx.save();if(s.shadow){ctx.shadowColor='#10132a66';ctx.shadowBlur=48*scale;ctx.shadowOffsetY=22*scale;}ctx.fillStyle='#15161c';ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();
  if(source)ctx.drawImage(source,crop.x,crop.y,crop.w,crop.h,x,y,w,h);
  if(s.clicks){for(const e of p.events||[]){const dt=t-e.t;if(dt<0||dt>.55||timelineTime(p.clips,e.t)===null)continue;const px=x+(e.x*sw-crop.x)/crop.w*w,py=y+(e.y*sh-crop.y)/crop.h*h;ctx.strokeStyle='rgba(207,255,132,'+(1-dt/.55)+')';ctx.lineWidth=3*scale;ctx.beginPath();ctx.arc(px,py,(12+dt*45)*scale,0,Math.PI*2);ctx.stroke();}}
  ctx.restore();return {x,y,w,h,crop};
}
