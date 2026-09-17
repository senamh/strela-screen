import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {unzipSync} from 'fflate';
import {makeArtifacts,packageRelease,readTree,sha256} from '../scripts/package.mjs';
import {buildInfo} from '../scripts/build-info.mjs';
import {validateManifest,assertTestedCommit,assertRemoteCommit,assertReusableAsset,assertAssetSet,run} from '../scripts/release.mjs';

const info={version:'0.6.1',id:'123456789abc'};
const files={'manifest.json':Buffer.from('{"version":"0.6.1"}'),'z.js':Buffer.from('last'),'a.js':Buffer.from('first')};
test('release ZIPs have deterministic order, metadata, layouts and checksums',()=>{
  const first=makeArtifacts(files,info),second=makeArtifacts(Object.fromEntries(Object.entries(files).reverse()),info);
  assert.deepEqual(first,second);
  const [release,store]=first.artifacts.map(a=>unzipSync(a.bytes));
  assert.deepEqual(Object.keys(release),['strela-screen/a.js','strela-screen/manifest.json','strela-screen/z.js']);
  assert.deepEqual(Object.keys(store),['a.js','manifest.json','z.js']);
  for(const [name,bytes] of Object.entries(files))assert.deepEqual(Buffer.from(store[name]),bytes);
  for(const asset of first.manifest.assets){assert.equal(asset.sha256,sha256(first.artifacts.find(a=>a.name===asset.name).bytes));assert(first.checksums.includes(`${asset.sha256}  ${asset.name}\n`));}
  assert.equal(first.manifest.buildId,info.id);
});
test('ZIP bytes are identical across host timezones',()=>{
  const script="import {makeArtifacts,sha256} from './scripts/package.mjs'; console.log(makeArtifacts({'a.txt':Buffer.from('same')},{version:'0.6.1',id:'123456789abc'}).artifacts.map(a=>sha256(a.bytes)).join(','));";
  const hashes=['UTC','Pacific/Honolulu','Asia/Tokyo'].map(TZ=>execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:process.cwd(),env:{...process.env,TZ},encoding:'utf8'}));
  assert.equal(new Set(hashes).size,1);
});
test('packaging rejects unsafe paths and malformed build metadata',()=>{
  for(const name of ['../secret','/absolute','a/../b','a\\b','.env','a//b'])assert.throws(()=>makeArtifacts({[name]:Buffer.from('x')},info),/Unsafe/);
  assert.throws(()=>makeArtifacts(files,{...info,version:'../other'}),/Invalid/);
});
test('manifest validation rejects stale builds, foreign repos and extra package files',()=>{
  const {manifest}=makeArtifacts(files,info);assert.equal(validateManifest(manifest,info),manifest);
  for(const patch of [{buildId:'aaaaaaaaaaaa'},{repository:'other/repo'},{version:'0.1.0'},{assets:[...manifest.assets,manifest.assets[0]]}])assert.throws(()=>validateManifest({...manifest,...patch},info));
  assert.throws(()=>validateManifest({...manifest,assets:[{...manifest.assets[0],name:'../other'},manifest.assets[1]]},info),/Invalid/);
});
test('publication is tied to a clean tested main commit and immutable remote tag',()=>{
  const commit='a'.repeat(40),valid={commit,head:commit,branch:'main',dirty:'',receipt:{commit,tests:'passed'}};
  assert.doesNotThrow(()=>assertTestedCommit(valid));
  for(const patch of [{commit:'short'},{head:'b'.repeat(40)},{branch:'feature'},{dirty:' M app.js'},{receipt:{commit,tests:'failed'}},{receipt:{commit:'b'.repeat(40),tests:'passed'}}])assert.throws(()=>assertTestedCommit({...valid,...patch}));
  assert.doesNotThrow(()=>assertRemoteCommit(commit,commit,null));
  assert.doesNotThrow(()=>assertRemoteCommit(commit,commit,commit));
  assert.throws(()=>assertRemoteCommit(commit,'b'.repeat(40),null),/Remote main/);
  assert.throws(()=>assertRemoteCommit(commit,commit,'b'.repeat(40)),/tag points/);
});
test('existing publication assets may only be reused byte-for-byte; extras are rejected',()=>{
  const asset={name:'package.zip',bytes:Buffer.from('same')},existing={name:asset.name,size:4,digest:`sha256:${sha256(asset.bytes)}`};
  assert.doesNotThrow(()=>assertReusableAsset(existing,asset));
  assert.doesNotThrow(()=>assertAssetSet([existing],[asset]));
  for(const patch of [{size:5},{digest:'sha256:changed'},{name:'other.zip'}])assert.throws(()=>assertReusableAsset({...existing,...patch},asset),/refusing to overwrite/);
  assert.throws(()=>assertAssetSet([],[asset]),/missing/);
  assert.throws(()=>assertAssetSet([existing,{...existing,name:'private.mp4'}],[asset]),/Unexpected/);
});
test('unknown release actions do not fall through to publication',async()=>{
  await assert.rejects(run('upload'),/Use prepare/);
});

async function fixture(){
  const root=await mkdtemp(path.join(tmpdir(),'strela-package-test-'));
  const put=async(name,data)=>{await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),data);};
  await put('src/app.js','fixture');await put('scripts/build.mjs','fixture');await put('package.json',JSON.stringify({version:info.version}));await put('package-lock.json','{}');
  const staticNames=['editor.html','editor.css','theme.css','popup.html','popup.css','capture-check.html','capture-check.css','capture-check.js','icons/icon16.png'];
  for(const name of staticNames){await put(`ui/${name}`,name);await put(`dist/strela-screen/${name}`,name);}
  const manifest=JSON.stringify({version:info.version});await put('ui/manifest.json',manifest);await put('dist/strela-screen/manifest.json',manifest);
  for(const name of ['THIRD_PARTY_NOTICES.md','INSTALL_RU.md','QA.md','RELEASE_CHECKLIST.md','MOBILE.md','RELEASE_NOTES.md']){await put(name,name);await put(`dist/strela-screen/${name}`,name);}
  for(const name of ['mediabunny','fflate','gifenc']){await put(`node_modules/${name}/${name==='gifenc'?'LICENSE.md':'LICENSE'}`,name);await put(`dist/strela-screen/licenses/${name}.txt`,name);}
  for(const name of ['app','export-worker','archive-worker','analysis-worker','demo-worker','background','tracker','popup'])await put(`dist/strela-screen/${name}.js`,name);
  await put('dist/strela-screen/build-info.json',JSON.stringify(await buildInfo(root)));
  return {root,put};
}
test('package output is reproducible and stale copied documents are rejected',async()=>{
  const {root,put}=await fixture();
  try{
    const manifest=await packageRelease(root),first=await readFile(path.join(root,'outputs',manifest.assets[0].name));
    assert.deepEqual(await packageRelease(root),manifest);
    assert.deepEqual(await readFile(path.join(root,'outputs',manifest.assets[0].name)),first);
    assert((await readFile(path.join(root,'outputs/GUMROAD_UPLOAD.md'),'utf8')).includes(manifest.assets[0].sha256));
    await put('QA.md','new current verification');await assert.rejects(packageRelease(root),/Stale copied file: QA.md/);
    await put('dist/strela-screen/QA.md','new current verification');await packageRelease(root);
    await put('dist/strela-screen/private-recording.mp4','private');await assert.rejects(packageRelease(root),/Unexpected or missing/);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('source changes invalidate the build and symlinks cannot enter packages',async()=>{
  const {root,put}=await fixture();
  try{
    await put('src/app.js','updated');await assert.rejects(packageRelease(root),/build is stale/);
    await symlink(path.join(root,'QA.md'),path.join(root,'dist/strela-screen/link'));await assert.rejects(readTree(path.join(root,'dist/strela-screen')),/Non-regular/);
  }finally{await rm(root,{recursive:true,force:true});}
});
