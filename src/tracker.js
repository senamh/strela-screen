// No text, keystrokes, form values, URLs or DOM snapshots are collected.
if(!window.__strelaTrackerInstalled){
  window.__strelaTrackerInstalled=true;
  let id=null,queue=[],timer;
  const flush=()=>{if(id&&queue.length)chrome.runtime.sendMessage({type:'CUES',id,events:queue.splice(0,100)}).catch(()=>{});};
  const click=e=>{if(id&&e.isTrusted)queue.push({type:'click',at:Date.now(),x:e.clientX/innerWidth,y:e.clientY/innerHeight});};
  const stop=()=>{flush();id=null;queue=[];clearInterval(timer);document.removeEventListener('pointerdown',click,true);};
  chrome.runtime.onMessage.addListener(m=>{if(m.type==='TRACK'){stop();id=m.id;document.addEventListener('pointerdown',click,true);timer=setInterval(flush,120);}if(m.type==='UNTRACK'&&m.id===id)stop();});
  addEventListener('pagehide',stop);
}
