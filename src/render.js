import {camera,timelineTime,timeline} from './model.js';
export const themes={black:['#000000','#000000','#000000'],lavender:['#d1c6ff','#7972bc','#353c73'],mint:['#d7f5bd','#82b8aa','#294a52'],sunset:['#ffdaa6','#d799a8','#64509b'],midnight:['#303e58','#202b3d','#111723']};
export function size(ratio,resolution=1080){return ratio==='phone'?[resolution,Math.round(resolution*2622/1206/2)*2]:ratio==='portrait'?[resolution,Math.round(resolution*16/9/2)*2]:ratio==='square'?[resolution,resolution]:[Math.round(resolution*16/9/2)*2,resolution];}
export function phoneLayout(W,H,sw,sh){
  const margin=W*.045,top=H*.06,bottom=H*.08,gap=H*.025,available=W-2*margin;
  const fit=Math.min(available/sw,H*.28/sh),w=sw*fit,h=sh*fit;
  return {overview:{x:(W-w)/2,y:top,w,h,crop:{x:0,y:0,w:sw,h:sh}},detail:{x:margin,y:top+h+gap,w:available,h:H-bottom-top-h-gap}};
}
export function render(canvas,source,sw,sh,p,t){
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,s=p.settings,scale=Math.min(W,H)/1080,clips=timeline(p),track=p.analysis?.track||[];
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const grad=ctx.createLinearGradient(0,0,W,H);themes[s.theme].forEach((c,i)=>grad.addColorStop(i/2,c));ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  if(s.ratio==='phone'){
    const {overview,detail}=phoneLayout(W,H,sw,sh),points=p.points.filter(point=>timelineTime(clips,point.t)!==null);
    if(!points.length){const fit=Math.min(W*.91/sw,H*.86/sh),w=sw*fit,h=sh*fit,g={x:(W-w)/2,y:(H-h)/2,w,h,crop:{x:0,y:0,w:sw,h:sh}};if(source)ctx.drawImage(source,0,0,sw,sh,g.x,g.y,w,h);return g;}
    detail.crop=camera(points,t,sw,sh,s,detail.w/detail.h,clips,track);
    for(const g of [overview,detail]){ctx.save();ctx.beginPath();ctx.roundRect(g.x,g.y,g.w,g.h,g===overview?0:Math.min(s.radius*scale,g.w/2,g.h/2));ctx.clip();if(source)ctx.drawImage(source,g.crop.x,g.crop.y,g.crop.w,g.crop.h,g.x,g.y,g.w,g.h);ctx.restore();}
    return {...detail,overview};
  }
  const pad=s.padding*scale,fit=Math.min((W-pad*2)/sw,(H-pad*2)/sh),w=s.ratio==='portrait'?W-pad*2:sw*fit,h=s.ratio==='portrait'?H-pad*2:sh*fit,x=(W-w)/2,y=(H-h)/2,r=Math.min(s.radius*scale,w/2,h/2),crop=camera(p.points,t,sw,sh,s,w/h,clips,track);
  ctx.save();if(s.shadow){ctx.shadowColor='#10132a66';ctx.shadowBlur=48*scale;ctx.shadowOffsetY=22*scale;}ctx.fillStyle='#15161c';ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();
  if(source)ctx.drawImage(source,crop.x,crop.y,crop.w,crop.h,x,y,w,h);
  ctx.restore();return {x,y,w,h,crop};
}
