const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const seek = document.querySelector('#seek');
let points = [], url, frame, crop;
const strength = document.createElement('input');
strength.type = 'range'; strength.min = '1.1'; strength.max = '2.5'; strength.step = '.1'; strength.value = '1.7';
const label = document.createElement('label');
label.textContent = 'Zoom strength '; label.append(strength);
document.querySelector('main').append(label);
function editingLocked() { return Boolean(window.strelaBusy); }
document.querySelector('#file').onchange = e => {
  const file = e.target.files[0]; if (!file || editingLocked()) return;
  video.pause(); if(url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(file); video.src = url; points = []; frame = null; list();
};
video.onloadedmetadata = () => {
  if(Number.isFinite(video.duration)) seek.max = video.duration;
  else { video.addEventListener('seeked', () => { seek.max = Number.isFinite(video.duration) ? video.duration : 1; video.currentTime = 0; }, {once:true}); video.currentTime = 1e10; }
};
video.onerror = () => document.querySelector('#status').textContent = 'This video could not be decoded.';
document.querySelector('#play').onclick = () => {
  if(!url || editingLocked()) return;
  video.paused ? video.play().catch(e => document.querySelector('#status').textContent=e.message) : video.pause();
};
seek.oninput = () => { if(url && !editingLocked()) video.currentTime = Number(seek.value); };
canvas.onclick = e => {
  if(!frame || !crop || !video.paused || editingLocked()) return;
  const b = canvas.getBoundingClientRect(), x = (e.clientX-b.left)*1280/b.width, y = (e.clientY-b.top)*720/b.height;
  if(x<frame.x || x>frame.x+frame.w || y<frame.y || y>frame.y+frame.h) return;
  // Map the click back through the current camera, rather than the uncropped video.
  points.push({t:video.currentTime, x:(crop.x+(x-frame.x)/frame.w*crop.w)/video.videoWidth, y:(crop.y+(y-frame.y)/frame.h*crop.h)/video.videoHeight});
  points.sort((a,b)=>a.t-b.t); list();
};
function list() {
  const box=document.querySelector('#points'); box.replaceChildren();
  points.forEach((p,i)=>{const b=document.createElement('button'); b.textContent='Focus '+p.t.toFixed(1)+'s ×';b.onclick=()=>{if(editingLocked())return;points.splice(i,1);list();};box.append(b);});
}
function draw() {
  const g=ctx.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#b5b0eb');g.addColorStop(1,'#44446e');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);
  if(video.readyState>=2) {
    const fit=Math.min(1160/video.videoWidth,600/video.videoHeight),w=video.videoWidth*fit,h=video.videoHeight*fit;
    frame={x:(1280-w)/2,y:(720-h)/2,w,h};
    crop=StrelaMotion.camera(points,video.currentTime,video.videoWidth,video.videoHeight,Number(strength.value));
    ctx.save();ctx.beginPath();ctx.roundRect(frame.x,frame.y,w,h,18);ctx.clip();ctx.drawImage(video,crop.x,crop.y,crop.w,crop.h,frame.x,frame.y,w,h);ctx.restore();
    seek.value=video.currentTime;document.querySelector('#time').textContent=video.currentTime.toFixed(1)+'s';
  }
  requestAnimationFrame(draw);
}
const engineScript=document.createElement('script');engineScript.src='motion.js';
engineScript.onload=()=>{draw();const mediaScript=document.createElement('script');mediaScript.src='studio-media.js';document.body.append(mediaScript);};
document.body.append(engineScript);
