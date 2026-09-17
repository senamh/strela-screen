// Two reproducible archives: an unpacked-extension folder and a store-root layout.
import {zipSync} from 'fflate';
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {buildInfo} from './build-info.mjs';

export const REPOSITORY='senamh/strela-screen';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const compare=(a,b)=>a<b?-1:a>b?1:0;
const documents=['THIRD_PARTY_NOTICES.md','INSTALL_RU.md','QA.md','RELEASE_CHECKLIST.md','MOBILE.md','RELEASE_NOTES.md'];
const uiFiles=['editor.html','editor.css','theme.css','popup.html','popup.css','manifest.json','capture-check.html','capture-check.css','capture-check.js'];
const entries=['app','export-worker','archive-worker','analysis-worker','demo-worker','background','tracker','popup'];

export async function readTree(dir,prefix=''){
  const files={};
  for(const entry of (await readdir(path.join(dir,prefix),{withFileTypes:true})).sort((a,b)=>compare(a.name,b.name))){
    if(entry.name==='.DS_Store')continue;
    const name=path.posix.join(prefix,entry.name);
    if(entry.isDirectory())Object.assign(files,await readTree(dir,name));
    else if(entry.isFile())files[name]=await readFile(path.join(dir,name));
    else throw new Error(`Non-regular package entry: ${name}`);
  }
  return files;
}

export function makeArtifacts(files,info){
  if(!/^\d+\.\d+\.\d+$/.test(info.version)||!(/^[a-f0-9]{12}$/).test(info.id))throw new Error('Invalid build metadata.');
  const sorted=Object.entries(files).sort(([a],[b])=>compare(a,b));
  for(const [name] of sorted)if(!name||name.startsWith('/')||name.includes('\\')||name.split('/').some(p=>!p||p.startsWith('.')))throw new Error(`Unsafe archive path: ${name}`);
  // fflate writes local calendar fields. A fixed local date produces identical DOS
  // timestamps in every timezone; UTC midnight would not do so.
  const options={level:9,mtime:new Date(2000,0,1,0,0,0),os:0,attrs:0};
  const artifacts=[
    {name:`strela-screen-${info.version}.zip`,layout:'unpacked-folder',bytes:zipSync(Object.fromEntries(sorted.map(([name,bytes])=>[`strela-screen/${name}`,bytes])),options)},
    {name:`strela-screen-${info.version}-store.zip`,layout:'store-root',bytes:zipSync(Object.fromEntries(sorted),options)}
  ];
  const manifest={schemaVersion:1,repository:REPOSITORY,version:info.version,tag:`v${info.version}`,buildId:info.id,filesPerArchive:sorted.length,assets:artifacts.map(({name,layout,bytes})=>({name,layout,bytes:bytes.length,sha256:sha256(bytes)}))};
  return {artifacts,manifest,checksums:manifest.assets.map(asset=>`${asset.sha256}  ${asset.name}\n`).join('')};
}

export async function packageRelease(root=process.cwd()){
  const dir=path.join(root,'dist/strela-screen'),current=await buildInfo(root);
  const files=await readTree(dir),built=JSON.parse(files['build-info.json']),version=JSON.parse(files['manifest.json']).version;
  if(built.id!==current.id||built.version!==version||version!==current.version)throw new Error('The build is stale. Run npm run build before packaging.');
  // Documentation is copied, not bundled, so also check it and every static asset.
  const copied=new Map([...documents.map(name=>[name,name]),...uiFiles.map(name=>[name,`ui/${name}`])]);
  for(const name of Object.keys(await readTree(path.join(root,'ui/icons'))))copied.set(`icons/${name}`,`ui/icons/${name}`);
  for(const name of ['mediabunny','fflate','gifenc'])copied.set(`licenses/${name}.txt`,`node_modules/${name}/${name==='gifenc'?'LICENSE.md':'LICENSE'}`);
  const expected=[...copied.keys(),'build-info.json',...entries.map(name=>`${name}.js`)].sort(compare);
  if(JSON.stringify(Object.keys(files).sort(compare))!==JSON.stringify(expected))throw new Error('Unexpected or missing built files. Rebuild in a clean dist/strela-screen directory.');
  for(const [name,source] of copied)if(!files[name].equals(await readFile(path.join(root,source))))throw new Error(`Stale copied file: ${name}. Run npm run build.`);
  const result=makeArtifacts(files,current),out=path.join(root,'outputs');await mkdir(out,{recursive:true});
  for(const {name,bytes} of result.artifacts)await writeFile(path.join(out,name),bytes);
  await writeFile(path.join(out,'release-manifest.json'),JSON.stringify(result.manifest,null,2)+'\n');
  await writeFile(path.join(out,'SHA256SUMS'),result.checksums);
  const release=result.manifest.assets[0];
  await writeFile(path.join(out,'GUMROAD_UPLOAD.md'),`# Gumroad: Strela Screen ${current.version}\n\nUpload only **${release.name}**, not the store ZIP or source-code archive.\n\n- Build: ${current.id}\n- Bytes: ${release.bytes}\n- SHA-256: ${release.sha256}\n- GitHub release: https://github.com/${REPOSITORY}/releases/tag/v${current.version}\n- Public product: https://shaurma.gumroad.com/l/strela-screen\n\nAfter GitHub verification, upload this exact ZIP to the existing product, update the version and release notes, and save. Preserve the zero minimum price, account settings and previous package for rollback. Do not send a customer email without approval. Reload the content page to confirm the server-hosted attachment, then check the public description. A successful upload alone is not a verified download. Never attach a user's recordings or project backups.\n\nRollback: restore the previous package as the recommended download; do not delete the old release, uninstall the extension or remove local projects. Keep the failed version available with a warning while investigating.\n`);
  return result.manifest;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const manifest=await packageRelease();console.log(`Packed ${manifest.assets.map(asset=>asset.name).join(' and ')} (${manifest.filesPerArchive} files each); checksums and release manifest are in outputs/.`);
}
