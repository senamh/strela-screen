document.querySelector('#open').onclick=async()=>{
  const button=document.querySelector('#open');button.disabled=true;
  try{
  const [source]=await chrome.tabs.query({active:true,currentWindow:true});
  const contexts=(await chrome.runtime.getContexts({contextTypes:['TAB']})).filter(c=>c.documentUrl?.startsWith(chrome.runtime.getURL('editor.html')));
  if(contexts.length){
    if(source.id!==contexts[0].tabId)await chrome.runtime.sendMessage({type:'SELECT_SOURCE',target:source.id,studio:contexts[0].tabId});
    await chrome.tabs.update(contexts[0].tabId,{active:true});
    await chrome.windows.update(contexts[0].windowId,{focused:true});
  }
  else await chrome.tabs.create({url:chrome.runtime.getURL('editor.html')+'?target='+source.id});
  window.close();
  }catch(e){button.textContent='Try again';button.disabled=false;document.querySelector('p').textContent=e.message;}
};
