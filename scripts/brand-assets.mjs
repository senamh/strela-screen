// Build-time artwork only. Use available sharp without adding a runtime dependency:
// node scripts/brand-assets.mjs /absolute/path/to/node-runtime
// The optional directory contains node_modules/sharp; an installed local sharp also works.
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(process.argv[2]?resolve(process.argv[2],'package.json'):import.meta.url);
const sharp=require('sharp');
const colors={bg:'#101216',surface:'#1a1f27',line:'#404957',text:'#f3f5f7',muted:'#aeb6c3',red:'#ff5056'};
const iconSource=await readFile(new URL('../docs/icon.svg',import.meta.url),'utf8');
const iconBody=iconSource.replace(/<svg[^>]*>/,'').replace('</svg>','');
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><rect width="${w}" height="${h}" fill="${colors.bg}"/><g font-family="Arial,Helvetica,sans-serif" fill="${colors.text}">${body}</g></svg>`;
const icon=(x,y,size)=>`<g transform="translate(${x} ${y}) scale(${size/128})">${iconBody}</g>`;
const text=(x,y,size,value,fill=colors.text,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
const header=(x=56,y=42)=>icon(x,y,54)+text(x+70,y+38,31,'strela screen',colors.text,700);
const badge=(x,y)=>`<rect x="${x}" y="${y}" width="124" height="30" rx="15" fill="#202630" stroke="${colors.line}"/>${text(x+18,y+20,12,'BETA 0.6.2',colors.muted,700)}`;

// Schematic source image. This is not an editor screenshot or a quality claim.
function dashboard(x,y,w){
  return `<g transform="translate(${x} ${y}) scale(${w/600})">
    <rect width="600" height="338" rx="8" fill="#eef1f6"/>
    <path d="M8 0H113V338H8Q0 338 0 330V8Q0 0 8 0" fill="#dce2eb"/>
    ${text(22,38,17,'Workspace','#303844',700)}
    ${['Overview','Projects','Activity','Settings'].map((v,i)=>text(22,89+i*42,13,v,'#596578')).join('')}
    ${text(143,42,22,'Project overview','#303844',700)}
    <rect x="448" y="23" width="126" height="31" rx="6" fill="#ff5056"/>${text(465,44,12,'New project +','#101216',700)}
    ${[['Active','12'],['Completed','84'],['Saved hours','128']].map(([label,value],i)=>`<rect x="${143+i*150}" y="75" width="132" height="81" rx="7" fill="#fff"/>${text(157+i*150,99,12,label,'#596578')}${text(157+i*150,137,28,value,'#303844',700)}`).join('')}
    <rect x="143" y="177" width="432" height="139" rx="7" fill="#fff"/>
    ${text(160,204,15,'Project activity','#303844',700)}
    <path d="M160 294H558M160 257H558M160 220H558" stroke="#e2e7ee"/>
    ${[36,62,48,84,66,54,76,42].map((h,i)=>`<rect x="${167+i*48}" y="${294-h}" width="28" height="${h}" rx="3" fill="${i===3?colors.red:'#8693a7'}"/>`).join('')}
    <rect x="140" y="174" width="438" height="145" rx="10" fill="none" stroke="${colors.red}" stroke-width="2"/>
  </g>`;
}
function phone(x,y,w){
  return `<g transform="translate(${x} ${y}) scale(${w/274})">
    <rect width="274" height="584" rx="36" fill="${colors.surface}" stroke="#46505e" stroke-width="2"/>
    <rect x="9" y="9" width="256" height="566" rx="28" fill="#000"/>
    <rect x="97" y="19" width="80" height="7" rx="3.5" fill="#343c48"/>
    ${dashboard(25,49,224)}
    <g transform="translate(25 196)">
      <rect width="224" height="326" rx="3" fill="#eef1f6"/>
      ${text(17,34,17,'Project activity','#303844',700)}
      ${text(17,58,11,'Editable close-up','#596578')}
      <path d="M17 290H207M17 230H207M17 170H207M17 110H207" stroke="#d3dbe7"/>
      ${[69,115,90,178,136].map((h,i)=>`<rect x="${21+i*39}" y="${290-h}" width="28" height="${h}" rx="4" fill="${i===3?colors.red:'#8693a7'}"/>`).join('')}
    </g>
    ${text(63,550,10,'OVERVIEW + DETAIL',colors.muted,700)}
  </g>`;
}
const arrow=(x,y,w)=>`<path d="M${x} ${y}H${x+w}m-13-13 13 13-13 13" fill="none" stroke="${colors.red}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

const promo=svg(440,280,
  icon(20,19,36)+text(69,45,21,'strela screen',colors.text,700)+
  text(22,112,26,'Screen recordings,',colors.text,700)+text(22,145,26,'ready for a phone.',colors.text,700)+
  text(24,189,14,'Local video processing',colors.muted)+text(24,211,13,'Editable focus',colors.muted)+
  text(24,256,12,'BETA 0.6.2',colors.muted,700)+phone(326,64,88)+
  text(329,269,9,'ILLUSTRATION',colors.muted));
const marquee=svg(1400,560,
  header()+badge(604,55)+
  text(56,231,62,'Screen recordings,',colors.text,700)+text(56,305,62,'ready for a phone.',colors.text,700)+
  text(60,363,23,'Import or record. Review focus. Export.',colors.muted)+
  `<path d="M60 410H852" stroke="#2d333e"/>`+
  text(60,453,19,'Processed on your device · MP4, WebM and GIF',colors.muted)+
  text(60,491,16,'Review automatic focus before sharing.',colors.muted)+
  phone(1090,24,236)+text(1093,547,11,'OVERVIEW + DETAIL · ILLUSTRATION',colors.muted));
const beforeAfter=svg(1280,800,
  header()+badge(1097,54)+
  text(56,156,42,'From desktop recording to phone layout',colors.text,700)+
  text(57,211,14,'SOURCE RECORDING · ILLUSTRATION',colors.muted,700)+
  dashboard(56,236,690)+
  text(916,190,14,'PHONE LAYOUT',colors.muted,700)+phone(916,211,250)+arrow(789,447,68)+
  text(56,701,23,'Visual-change analysis. Editable focus.',colors.text,700)+
  text(56,739,18,'Processed on your device. Review focus before sharing.',colors.muted)+
  text(919,778,12,'OVERVIEW + DETAIL · ILLUSTRATION',colors.muted));
const phoneDetail=svg(1280,800,
  header()+badge(1097,54)+
  text(56,218,49,'Keep the overview.',colors.text,700)+text(56,278,49,'Adjust the detail.',colors.text,700)+
  text(59,344,20,'Full-frame overview with an editable close-up.',colors.muted)+
  text(59,377,18,'Review automatic focus before you export.',colors.muted)+
  `<rect x="56" y="431" width="548" height="100" rx="16" fill="${colors.surface}" stroke="#343c48"/>`+
  `<circle cx="80" cy="460" r="4" fill="${colors.red}"/>`+
  text(97,467,18,'Local processing',colors.text,700)+text(79,501,16,'Your video stays on your device.',colors.muted)+
  `<rect x="56" y="548" width="548" height="100" rx="16" fill="${colors.surface}" stroke="#343c48"/>`+
  `<circle cx="80" cy="577" r="4" fill="${colors.red}"/>`+
  text(97,584,18,'Editable focus',colors.text,700)+text(79,618,16,'Adjust time, hold, zoom and protected area.',colors.muted)+
  text(59,735,15,'Illustration of the phone layout, not an editor screenshot.',colors.muted)+
  phone(891,128,286)+
  text(699,242,13,'FULL FRAME',colors.muted,700)+`<path d="M698 255H865" stroke="#596578"/><circle cx="865" cy="255" r="3" fill="${colors.red}"/>`+
  text(723,507,13,'DETAIL',colors.muted,700)+`<path d="M722 520H865" stroke="#596578"/><circle cx="865" cy="520" r="3" fill="${colors.red}"/>`);
const thumbnail=svg(600,600,
  icon(33,30,55)+text(103,69,30,'strela screen',colors.text,700)+
  text(37,180,43,'Screen recordings,',colors.text,700)+text(37,233,43,'ready for a phone.',colors.text,700)+
  `<path d="M40 277H349" stroke="#343c48"/>`+
  text(40,341,20,'Local video processing',colors.text,700)+
  text(40,379,18,'Editable focus',colors.muted)+text(40,411,18,'MP4, WebM and GIF',colors.muted)+
  badge(40,483)+text(40,559,13,'Review focus before sharing.',colors.muted)+
  phone(409,271,144)+text(433,592,10,'ILLUSTRATION',colors.muted));

const root=new URL('../',import.meta.url);
const outputPath=path=>fileURLToPath(new URL(path,root));
await mkdir(new URL('ui/icons/',root),{recursive:true});
for(const size of [16,32,48,128])await sharp(Buffer.from(iconSource),{density:384}).resize(size,size).png().toFile(outputPath(`ui/icons/icon${size}.png`));
const coverSource=await readFile(new URL('docs/release-cover.svg',root),'utf8');
await sharp(Buffer.from(coverSource)).png().toFile(outputPath('docs/release-cover.png'));
// Gumroad needs 1280×720; keep the GitHub artwork at natural scale, centered vertically.
const gumroadCover=coverSource.replace('height="640" viewBox="0 0 1280 640"','height="720" viewBox="0 -40 1280 720"').replace(/(<svg[^>]*>)/,`$1<rect x="0" y="-40" width="1280" height="720" fill="${colors.bg}"/>`);
await sharp(Buffer.from(gumroadCover)).png().toFile(outputPath('docs/gumroad-cover.png'));
await sharp(Buffer.from(thumbnail)).png().toFile(outputPath('docs/gumroad-thumbnail.png'));
for(const [name,source] of [['promo-440x280',promo],['marquee-1400x560',marquee],['screenshot-1-before-after',beforeAfter],['screenshot-2-phone',phoneDetail]])await sharp(Buffer.from(source)).png().toFile(outputPath(`store/${name}.png`));
console.log('Built beta 0.6.2 GitHub/Gumroad covers, thumbnail, shared arrow icons and labelled store illustrations.');
