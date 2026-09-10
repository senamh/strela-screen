export function analyzeVideo(blob,onProgress,signal){
 return new Promise((resolve,reject)=>{
  const worker=new Worker('analysis-worker.js',{type:'module'});
  const cleanup=()=>{worker.terminate();signal?.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new DOMException('Analysis cancelled','AbortError'));};
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=e=>{cleanup();reject(new Error(e.message||'Analysis failed'));};
  worker.onmessage=({data})=>{if(data.type==='progress')onProgress(data.progress);else if(data.type==='done'){cleanup();resolve(data);}else if(data.type==='error'){cleanup();reject(new Error(data.error));}};
  worker.postMessage({blob});
 });
}
