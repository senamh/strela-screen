import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {validateProject} from './model.js';
export function encodeArchive(project,bytes){return zipSync({'project.json':strToU8(JSON.stringify(project)),'source.video':bytes},{level:0});}
export function decodeArchive(bytes){
  const files=unzipSync(bytes,{filter:file=>file.name==='project.json'?file.originalSize<1024**2:file.name==='source.video'&&file.originalSize<1024**3});
  if(!files['project.json']||!files['source.video'])throw new Error('The archive is missing its project or video.');
  return {project:validateProject(JSON.parse(strFromU8(files['project.json']))),bytes:files['source.video']};
}
