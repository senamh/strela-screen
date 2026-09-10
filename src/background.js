// Only the explicitly selected source tab may send recording cues to the studio.
const session=()=>chrome.storage.session.get('recording');
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
  if(sender.id!==chrome.runtime.id)return;
  (async()=>{
    if(m.type==='TAB_STREAM'){
      if(!sender.tab||!sender.url?.startsWith(chrome.runtime.getURL('editor.html')))throw new Error('Open Strela Studio first.');
      return {streamId:await chrome.tabCapture.getMediaStreamId({targetTabId:m.targetTabId,consumerTabId:sender.tab.id})};
    }
    if(m.type==='TRACK_START'){
      if(!sender.url?.startsWith(chrome.runtime.getURL('editor.html')))throw new Error('Invalid studio.');
      const data={target:m.targetTabId,studio:sender.tab.id,id:m.id};
      await chrome.storage.session.set({recording:data});
      try{await chrome.scripting.executeScript({target:{tabId:m.targetTabId},files:['tracker.js']});await chrome.tabs.sendMessage(m.targetTabId,{type:'TRACK',id:m.id});return {tracking:true};}
      catch{await chrome.storage.session.remove('recording');return {tracking:false};}
    }
    if(m.type==='TRACK_STOP'){
      const {recording:r}=await session();if(r&&sender.tab?.id===r.studio){await chrome.tabs.sendMessage(r.target,{type:'UNTRACK',id:r.id}).catch(()=>{});await chrome.storage.session.remove('recording');}return {};
    }
    if(m.type==='CUES'){
      const {recording:r}=await session();if(!r||sender.tab?.id!==r.target||m.id!==r.id)return {};
      const events=(m.events||[]).slice(0,100).filter(e=>e.type==='click'&&Number.isFinite(e.at)&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.x<=1&&e.y>=0&&e.y<=1);
      await chrome.runtime.sendMessage({type:'STUDIO_CUES',id:r.id,events}).catch(()=>{});return {};
    }
    return {};
  })().then(value=>reply({ok:true,...value}),e=>reply({ok:false,error:e.message}));
  return true;
});
chrome.tabs.onRemoved.addListener(async tabId=>{const {recording:r}=await session();if(!r)return;if(r.studio===tabId||r.target===tabId){await chrome.tabs.sendMessage(r.target,{type:'UNTRACK',id:r.id}).catch(()=>{});await chrome.storage.session.remove('recording');}});
