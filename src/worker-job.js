// One job per worker. Termination is also the cancellation boundary for codec work.
export function workerJob(url,data,onProgress,signal){
  return new Promise((resolve,reject)=>{
    let worker,settled=false;
    const cleanup=()=>{
      signal?.removeEventListener('abort',abort);
      if(worker){worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();}
    };
    const finish=(error,result)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve(result);};
    const abort=()=>finish(new DOMException('Processing cancelled','AbortError'));
    if(signal?.aborted){abort();return;}
    try{
      worker=new Worker(url,{type:'module'});
      signal?.addEventListener('abort',abort,{once:true});
      worker.onerror=e=>{e.preventDefault?.();finish(new Error(e.message||'Processing failed.'));};
      worker.onmessageerror=()=>finish(new Error('The processing worker returned an unreadable message.'));
      worker.onmessage=({data:result})=>{
        if(settled)return;
        if(result?.type==='progress'){
          try{onProgress?.(result.progress);}catch(error){finish(error);}
        }else if(result?.type==='done')finish(null,result);
        else if(result?.type==='error')finish(new Error(result.error||'Processing failed.'));
      };
      worker.postMessage(data);
    }catch(error){finish(error);}
  });
}
