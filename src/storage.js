import {encodeArchive,decodeArchive} from './archive-codec.js';
let dbPromise;
function db(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('strela',1);r.onupgradeneeded=()=>{r.result.createObjectStore('projects',{keyPath:'id'});r.result.createObjectStore('recording',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transact(store,mode,action){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction(store,mode),req=action(tx.objectStore(store));tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export const saveProject=(project,blob)=>transact('projects','readwrite',s=>s.put({id:project.id,project,blob,updated:Date.now()}));
export const allProjects=()=>transact('projects','readonly',s=>s.getAll());
export const getProject=id=>transact('projects','readonly',s=>s.get(id));
export const saveChunk=(id,index,blob)=>transact('recording','readwrite',s=>s.put({key:id+':'+String(index).padStart(8,'0'),id,index,blob}));
export const allChunks=()=>transact('recording','readonly',s=>s.getAll());
export async function clearChunks(id){const database=await db();await new Promise((resolve,reject)=>{const tx=database.transaction('recording','readwrite'),s=tx.objectStore('recording'),r=s.openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value.id===id)c.delete();c.continue();}};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
async function archiveJob(mode,bytes,project){
  if(typeof Worker==='undefined')return mode==='encode'?{bytes:encodeArchive(project,bytes)}:decodeArchive(bytes);
  return new Promise((resolve,reject)=>{
    const worker=new Worker('archive-worker.js',{type:'module'});
    worker.onmessage=({data})=>{worker.terminate();data.ok?resolve(data):reject(new Error(data.error));};
    worker.onerror=e=>{worker.terminate();reject(new Error(e.message||'Project archive failed.'));};
    worker.postMessage({mode,bytes,project},[bytes.buffer]);
  });
}
export async function projectArchive(project,blob){const result=await archiveJob('encode',new Uint8Array(await blob.arrayBuffer()),project);return new Blob([result.bytes],{type:'application/zip'});}
export async function readArchive(blob){
  if(blob.size>1024**3)throw new Error('Project archives above 1 GB are not supported yet.');
  const bytes=new Uint8Array(await blob.arrayBuffer());
  const result=await archiveJob('decode',bytes);
  return {project:result.project,blob:new Blob([result.bytes],{type:result.project.mime||'video/webm'})};
}
