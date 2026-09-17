// Deterministic synthetic screen changes, not recordings of third-party applications.
// Coordinates are source pixels. Retain these fixtures when tuning detection thresholds.
export const W=240,H=160;
const blank=()=>new Uint8ClampedArray(W*H*4);
const box=(x,y,w,h,value=255)=>pixels=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const k=(j*W+i)*4;pixels[k]=pixels[k+1]=pixels[k+2]=value;}};
const both=(...ops)=>p=>ops.forEach(op=>op(p));
const steps=(ops,dt=.5)=>{const frames=[{t:0,pixels:blank()}];ops.forEach((op,i)=>{const pixels=frames.at(-1).pixels.slice();op(pixels);frames.push({t:(i+1)*dt,pixels});});return frames;};
const blink=(extra=null)=>Array.from({length:8},(_,i)=>both(box(10,10,30,20,i%2?0:255),...(extra&&i===7?[extra]:[])));
export const scenarios=[
  {name:'01 static reading page',frames:steps([()=>{},()=>{}]),hits:0},
  {name:'02 tiny caret blink',frames:steps(Array.from({length:8},(_,i)=>box(90,60,1,4,i%2?0:255))),hits:0},
  {name:'03 left toolbar control',frames:steps([box(10,70,20,20)]),hits:1,target:[.083,.5]},
  {name:'04 right inspector control',frames:steps([box(200,60,30,20)]),hits:1,target:[.896,.438]},
  {name:'05 bottom-edge status',frames:steps([box(190,140,40,20)]),hits:1,target:[.875,.938]},
  {name:'06 localized dialog',frames:steps([box(70,50,70,40)]),hits:1,target:[.438,.438]},
  {name:'07 large panel needs overview',frames:steps([box(30,20,180,100)]),hits:0},
  {name:'08 scene cut',frames:steps([box(0,0,W,H)]),hits:0},
  {name:'09 sparse full-page scrolling',frames:steps([both(...Array.from({length:12},(_,i)=>box(10,10+i*12,210,2)))]),hits:0},
  {name:'10 competing equal changes',frames:steps([both(box(10,10,30,20),box(180,120,30,20))]),hits:0},
  {name:'11 dominant action with small noise',frames:steps([both(box(150,90,40,30),box(10,10,10,10))]),hits:1,target:[.708,.656]},
  {name:'12 repeated reversible badge',frames:steps(blink()),hits:0},
  {name:'13 badge plus distant small action',frames:steps(blink(box(190,110,20,20))),hits:1,target:[.833,.75]},
  {name:'14 badge plus equal-size action',frames:steps(blink(box(180,110,30,20))),hits:1,target:[.813,.75]},
  {name:'15 cumulative typing',frames:steps(Array.from({length:6},(_,i)=>box(60+i*10,70,8,12))),hits:6},
  {name:'16 growing progress indicator',frames:steps(Array.from({length:6},(_,i)=>box(60+i*10,70,10,10))),hits:6},
  {name:'17 distinct actions 1.5 seconds apart',frames:steps([box(20,20,30,20),box(180,120,30,20)],1.5),hits:2,points:2},
  {name:'18 distributed animation',frames:steps(Array.from({length:8},(_,i)=>both(box(10,10,30,20,i%2?0:255),box(180,120,30,20,i%2?0:255)))),hits:0},
  {name:'19 action after background episode',frames:[...steps(blink()),{t:9,pixels:(()=>{const p=blank();box(10,10,30,20)(p);return p;})()}],hits:1,target:[.104,.125]},
  {name:'20 dim local control',frames:steps([box(140,60,30,20,70)]),hits:1,target:[.646,.438]},
];
