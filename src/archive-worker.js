import {encodeArchive,decodeArchive} from './archive-codec.js';
// A packaged worker complies with Manifest V3 CSP; fflate's convenience async
// functions create dynamic blob workers, which extension pages cannot use.
self.onmessage=({data})=>{
  try{
    const result=data.mode==='encode'?{bytes:encodeArchive(data.project,data.bytes)}:decodeArchive(data.bytes);
    self.postMessage({ok:true,...result},[result.bytes.buffer]);
  }catch(e){self.postMessage({ok:false,error:e.message});}
};
