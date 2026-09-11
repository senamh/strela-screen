// Two archives from the built extension: the release ZIP (a strela-screen folder to
// "Load unpacked") and the Chrome Web Store ZIP, which needs manifest.json at its root.
import {zipSync} from 'fflate';
import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const dir='dist/strela-screen',{version}=JSON.parse(await readFile(dir+'/manifest.json','utf8')),files={};
async function walk(folder){for(const name of await readdir(folder)){if(name==='.DS_Store')continue;const file=path.join(folder,name);if((await stat(file)).isDirectory())await walk(file);else files[path.relative(dir,file).split(path.sep).join('/')]=await readFile(file);}}
await walk(dir);
const release=Object.fromEntries(Object.entries(files).map(([name,data])=>['strela-screen/'+name,data]));
await writeFile(`outputs/strela-screen-${version}.zip`,zipSync(release,{level:9}));
await writeFile(`outputs/strela-screen-${version}-store.zip`,zipSync(files,{level:9}));
console.log(`Packed outputs/strela-screen-${version}.zip and outputs/strela-screen-${version}-store.zip (${Object.keys(files).length} files)`);
