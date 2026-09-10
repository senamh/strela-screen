// Independent of frame rate: identical camera for preview, seeking and export.
const StrelaMotion = (() => {
  const smooth = x => { x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10); };
  function camera(points,t,width,height,zoom=1.7) {
    let total=0,x=0,y=0,uncovered=1;
    for(const p of points) {
      const weight=smooth((2-Math.abs(t-p.t))/.8);
      total+=weight; x+=p.x*weight;y+=p.y*weight;uncovered*=1-weight;
    }
    const z=1+(zoom-1)*(1-uncovered),w=width/z,h=height/z;
    if(total>0){x/=total;y/=total;}else{x=y=.5;}
    return {x:Math.max(0,Math.min(width-w,x*width-w/2)),y:Math.max(0,Math.min(height-h,y*height-h/2)),w,h};
  }
  return {camera};
})();
if(typeof module!=='undefined') module.exports=StrelaMotion;
