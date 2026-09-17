import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

// Stable for identical runtime inputs, including uncommitted changes. No machine paths or dates.
export function fingerprint(files){
  const hash=createHash('sha256');
  for(const [name,data] of [...files].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    hash.update(JSON.stringify([name,Buffer.byteLength(data)]));hash.update(data);
  }
  return hash.digest('hex').slice(0,12);
}
export async function buildInfo(root){
  const files=[];
  async function walk(relative){
    for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})){
      if(entry.name.startsWith('.'))continue;
      const name=path.posix.join(relative,entry.name);
      if(entry.isDirectory())await walk(name);
      else if(entry.isFile())files.push([name,await readFile(path.join(root,name))]);
    }
  }
  for(const dir of ['src','ui','scripts'])await walk(dir);
  for(const name of ['package.json','package-lock.json'])files.push([name,await readFile(path.join(root,name))]);
  const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  const manifest=JSON.parse(await readFile(path.join(root,'ui/manifest.json'),'utf8'));
  if(manifest.version!==version)throw new Error('Package and extension versions differ.');
  return {version,id:fingerprint(files)};
}
