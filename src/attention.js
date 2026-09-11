// Conservative visual-change detector, not OCR or semantic/cursor recognition.
// Reject scene cuts, scrolling and scattered motion instead of inventing focus.
const cols=24,rows=16;
// Changed pixels per grid cell and the changed share of the frame.
export function changeMap(previous,current,width,height){
  const weights=new Float64Array(cols*rows);let changed=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,d=(Math.abs(current[i]-previous[i])+Math.abs(current[i+1]-previous[i+1])+Math.abs(current[i+2]-previous[i+2]))/3;
    if(d<30)continue;changed++;weights[Math.min(rows-1,Math.floor(y/height*rows))*cols+Math.min(cols-1,Math.floor(x/width*cols))]+=d;
  }
  return {weights,fraction:changed/(width*height)};
}
export function attention(previous,current,width,height,map=changeMap(previous,current,width,height)){
  const {weights,fraction}=map;
  if(fraction<.0015||fraction>.22)return null;
  const peak=Math.max(...weights);if(!peak)return null;
  const seen=new Set(),groups=[];
  for(let i=0;i<weights.length;i++){
    if(seen.has(i)||weights[i]<peak*.15)continue;
    const queue=[i];seen.add(i);let mass=0,x=0,y=0,minX=cols,minY=rows,maxX=0,maxY=0;
    while(queue.length){const k=queue.pop(),cx=k%cols,cy=Math.floor(k/cols),w=weights[k];mass+=w;x+=(cx+.5)*w;y+=(cy+.5)*w;minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
      for(const n of [k-1,k+1,k-cols,k+cols])if(n>=0&&n<weights.length&&Math.abs(n%cols-cx)+Math.abs(Math.floor(n/cols)-cy)===1&&!seen.has(n)&&weights[n]>=peak*.15){seen.add(n);queue.push(n);}
    }groups.push({x:x/mass/cols,y:y/mass/rows,w:(maxX-minX+1)/cols,h:(maxY-minY+1)/rows,mass,area:(maxX-minX+1)*(maxY-minY+1)/(cols*rows)});
  }
  groups.sort((a,b)=>b.mass-a.mass);const best=groups[0],total=weights.reduce((a,b)=>a+b,0);
  return best&&best.mass/total>.65&&best.area<.28?{x:best.x,y:best.y,w:best.w,h:best.h,confidence:best.mass/total}:null;
}
export function attentionPoints(candidates){
  const points=[];
  for(const c of candidates){const last=points.at(-1);if(last&&c.t-last.t<2.5)continue;
    points.push({id:crypto.randomUUID(),t:c.t,x:c.x,y:c.y,...(c.w>0&&c.h>0?{w:c.w,h:c.h}:{}),auto:true,origin:'visual-change'});
  }return points;
}
// A pause is a run of sample pairs where almost nothing changes (under 0.012% of the 320 px frame,
// a few pixels). A moving cursor or typing changes more than that, so neither counts as a pause;
// at 0.06% both were sped up. Returned as [start, end] source seconds.
export const QUIET=.00012;
export function quietRanges(samples){
  const out=[];
  for(const {t0,t1,fraction} of samples){if(fraction>=QUIET)continue;const last=out.at(-1);if(last&&t0<=last[1]+1e-6)last[1]=t1;else out.push([t0,t1]);}
  return out.filter(([a,b])=>b-a>=1).map(([a,b])=>[+a.toFixed(3),+b.toFixed(3)]);
}
