// No remote writes without the explicit `publish <full tested commit>` command.
import {spawnSync,execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {buildInfo} from './build-info.mjs';
import {packageRelease,REPOSITORY,sha256} from './package.mjs';

const api=`https://api.github.com/repos/${REPOSITORY}`;
const metadataNames=['release-manifest.json','SHA256SUMS'];
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
export function validateManifest(manifest,info){
  const names=[`strela-screen-${info.version}.zip`,`strela-screen-${info.version}-store.zip`];
  if(manifest.schemaVersion!==1||manifest.repository!==REPOSITORY||manifest.version!==info.version||manifest.tag!==`v${info.version}`||manifest.buildId!==info.id||manifest.assets?.length!==2)throw new Error('Release manifest is stale or invalid. Run release:prepare.');
  for(let i=0;i<names.length;i++)if(manifest.assets[i].name!==names[i]||!Number.isSafeInteger(manifest.assets[i].bytes)||manifest.assets[i].bytes<=0||!(/^[a-f0-9]{64}$/).test(manifest.assets[i].sha256))throw new Error('Invalid release asset metadata.');
  return manifest;
}
export function assertTestedCommit({commit,head,branch,dirty,receipt}){
  if(!/^[a-f0-9]{40}$/.test(commit||''))throw new Error('Provide the full tested commit SHA.');
  if(branch!=='main'||dirty||head!==commit||receipt?.commit!==commit||receipt?.tests!=='passed')throw new Error('Publication requires a clean main checkout at the exact commit validated by release:prepare.');
}
export function assertRemoteCommit(commit,main,tag){
  if(main!==commit)throw new Error('Remote main differs from the tested commit. Push the tested commit first.');
  if(tag&&tag!==commit)throw new Error('The release tag points to another commit. Refusing to move it.');
}
export function assertReusableAsset(existing,asset){
  if(existing.name!==asset.name||existing.size!==asset.bytes.length||existing.digest!==`sha256:${sha256(asset.bytes)}`)throw new Error(`Existing asset differs; refusing to overwrite ${asset.name}. Use a new version.`);
}
export function assertAssetSet(published,assets){
  if(published.length!==assets.length||published.some(item=>!assets.some(asset=>asset.name===item.name)))throw new Error('Unexpected or missing release files. Refusing to modify the release.');
  for(const asset of assets)assertReusableAsset(published.find(item=>item.name===asset.name),asset);
}
function cleanHead(root){
  const head=git(root,'rev-parse','HEAD'),branch=git(root,'branch','--show-current'),dirty=git(root,'status','--porcelain');
  if(branch!=='main'||dirty)throw new Error('Commit all intended changes on main before release:prepare. The tested commit must be reproducible.');
  const origin=git(root,'remote','get-url','origin');
  if(![`https://github.com/${REPOSITORY}.git`,`https://github.com/${REPOSITORY}`,`git@github.com:${REPOSITORY}.git`].includes(origin))throw new Error('Unexpected origin; publication is restricted to senamh/strela-screen.');
  return {head,branch,dirty};
}
async function localAssets(root){
  const info=await buildInfo(root),manifestBytes=await readFile(path.join(root,'outputs/release-manifest.json'));
  const manifest=validateManifest(JSON.parse(manifestBytes),info),assets=[];
  for(const asset of manifest.assets){
    const bytes=await readFile(path.join(root,'outputs',asset.name));
    if(bytes.length!==asset.bytes||sha256(bytes)!==asset.sha256)throw new Error(`Local package changed: ${asset.name}`);
    assets.push({name:asset.name,bytes,type:'application/zip'});
  }
  const checksums=await readFile(path.join(root,'outputs/SHA256SUMS'));
  if(checksums.toString()!==manifest.assets.map(a=>`${a.sha256}  ${a.name}\n`).join(''))throw new Error('SHA256SUMS differs from the manifest.');
  assets.push({name:metadataNames[0],bytes:manifestBytes,type:'application/json'},{name:metadataNames[1],bytes:checksums,type:'text/plain'});
  return {manifest,assets};
}
function credentials(){
  const gh=spawnSync('gh',['auth','token','--hostname','github.com'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  if(gh.status===0&&gh.stdout.trim())return gh.stdout.trim();
  const result=spawnSync('git',['credential','fill'],{input:`protocol=https\nhost=github.com\npath=${REPOSITORY}.git\n\n`,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0'},stdio:['pipe','pipe','pipe']});
  const token=result.status===0?result.stdout.split('\n').find(line=>line.startsWith('password='))?.slice(9):null;
  if(!token)throw new Error('No existing GitHub login. Authenticate with gh or the Git credential helper; never put a token in this command.');
  return token;
}
function github(token){return async function request(url,{method='GET',body,type='application/json',optional=false}={}){
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':type};if(token)headers.Authorization=`Bearer ${token}`;
  const response=await fetch(url,{method,headers,body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
  if(optional&&response.status===404)return null;
  // Do not print request headers, credentials or response bodies containing account data.
  if(!response.ok)throw new Error(`GitHub request failed (${response.status}, ${method} ${new URL(url).pathname}).`);
  return response.status===204?null:response.json();
};}
async function tagCommit(request,tag){
  const ref=await request(`${api}/git/ref/tags/${encodeURIComponent(tag)}`,{optional:true});if(!ref)return null;
  let object=ref.object;
  for(let depth=0;object.type==='tag'&&depth<5;depth++)object=(await request(`${api}/git/tags/${object.sha}`)).object;
  if(object.type!=='commit')throw new Error('Unsupported release tag object.');
  return object.sha;
}
async function verifyPublic(release,assets){
  if(release.draft||!release.prerelease)throw new Error('Expected a public prerelease.');
  assertAssetSet(release.assets,assets);
  const results=[];
  for(const asset of assets){
    const published=release.assets.find(item=>item.name===asset.name);
    if(!published)throw new Error(`Missing release asset: ${asset.name}`);
    assertReusableAsset(published,asset);
    const response=await fetch(published.browser_download_url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok)throw new Error(`Public download failed (${response.status}): ${asset.name}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(!bytes.equals(asset.bytes))throw new Error(`Public download differs: ${asset.name}`);
    results.push({name:asset.name,bytes:bytes.length,sha256:sha256(bytes),url:published.browser_download_url});
  }
  return {url:release.html_url,tag:release.tag_name,prerelease:true,assets:results};
}
export async function run(action='check',commit,root=process.cwd()){
  if(!['prepare','check','publish','verify'].includes(action))throw new Error('Use prepare, check, publish <full-tested-SHA>, or verify.');
  if(action==='prepare'){
    const before=cleanHead(root);
    for(const command of ['build','test'])execFileSync('npm',['run',command],{cwd:root,stdio:'inherit'});
    await packageRelease(root);
    const after=cleanHead(root);if(before.head!==after.head)throw new Error('HEAD changed during validation.');
    const {manifest,assets}=await localAssets(root);
    const receipt={schemaVersion:1,commit:after.head,version:manifest.version,buildId:manifest.buildId,tests:'passed',assets:assets.map(a=>({name:a.name,sha256:sha256(a.bytes)})),releaseNotesSha256:sha256(await readFile(path.join(root,'RELEASE_NOTES.md')))};
    await writeFile(path.join(root,'outputs/release-validation.json'),JSON.stringify(receipt,null,2)+'\n');
    return {prepared:true,commit:after.head,version:manifest.version,buildId:manifest.buildId,next:`git push origin main; then npm run release:publish -- ${after.head}`,gumroad:'outputs/GUMROAD_UPLOAD.md'};
  }
  const {manifest,assets}=await localAssets(root);
  if(action==='check')return {action:'read-only local check',version:manifest.version,buildId:manifest.buildId,assets:assets.map(a=>({name:a.name,sha256:sha256(a.bytes)}))};
  const receipt=JSON.parse(await readFile(path.join(root,'outputs/release-validation.json'),'utf8'));
  const state=cleanHead(root),tested=action==='publish'?commit:receipt.commit;
  assertTestedCommit({commit:tested,...state,receipt});
  if(JSON.stringify(receipt.assets)!==JSON.stringify(assets.map(a=>({name:a.name,sha256:sha256(a.bytes)})))||receipt.releaseNotesSha256!==sha256(await readFile(path.join(root,'RELEASE_NOTES.md'))))throw new Error('Artifacts or notes changed after tests. Run release:prepare again.');
  const request=github(action==='publish'?credentials():null);
  const main=await request(`${api}/branches/main`),tag=await tagCommit(request,manifest.tag);assertRemoteCommit(tested,main.commit.sha,tag);
  let release=await request(`${api}/releases/tags/${manifest.tag}`,{optional:true});
  if(action==='publish'){
    // Drafts may not be returned by the by-tag endpoint. Never create a second
    // draft merely because an interrupted publication has no public tag yet.
    if(!release)release=(await request(`${api}/releases?per_page=100`)).find(item=>item.tag_name===manifest.tag);
    if(!release)release=await request(`${api}/releases`,{method:'POST',body:{tag_name:manifest.tag,target_commitish:tested,name:`Strela Screen ${manifest.version} · Public beta`,body:await readFile(path.join(root,'RELEASE_NOTES.md'),'utf8'),draft:true,prerelease:true}});
    if(release.draft){
      if(release.target_commitish!==tested)throw new Error('Existing draft targets another commit. Refusing to publish it.');
      if(release.assets.some(item=>!assets.some(asset=>asset.name===item.name)))throw new Error('Unexpected file in the draft. Review it before publication.');
      for(const asset of assets){
        const existing=release.assets.find(item=>item.name===asset.name);
        if(existing){assertReusableAsset(existing,asset);continue;}
        const uploaded=await request(release.upload_url.split('{')[0]+'?name='+encodeURIComponent(asset.name),{method:'POST',body:asset.bytes,type:asset.type});assertReusableAsset(uploaded,asset);
      }
      // Recheck the target after all uploads, before making anything public.
      assertRemoteCommit(tested,(await request(`${api}/branches/main`)).commit.sha,await tagCommit(request,manifest.tag));
      assertAssetSet((await request(`${api}/releases/${release.id}`)).assets,assets);
      release=await request(`${api}/releases/${release.id}`,{method:'PATCH',body:{draft:false,prerelease:true}});
    }
    // A published version is immutable here: no replacement or addition of files.
  }
  if(!release)throw new Error('Release not found.');
  const actualTag=await tagCommit(request,manifest.tag);if(actualTag!==tested)throw new Error('Published tag does not match the tested commit.');
  release=await request(`${api}/releases/${release.id}`);
  return verifyPublic(release,assets);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{console.log(JSON.stringify(await run(process.argv[2],process.argv[3]),null,2));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
