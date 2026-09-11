// Resample variable-rate screen capture into a constant-rate output. Keep the
// most recent decoded frame between updates, just as normal video playback does.
// The sink needs a pool of at least two canvases: current and look-ahead.
// With `jump` set, a gap longer than that many seconds (a trimmed start, a removed
// clip) restarts decoding at the next timestamp instead of decoding through it.
// Leave it at 0 for cue-less WebM, whose timestamp lookups miss frames.
export async function* sampleFrames(sink,timestamps,{jump=0}={}){
  let frames=null,current,next,previous=-Infinity;
  const open=async start=>{await frames?.return?.();frames=sink.canvases(start)[Symbol.asyncIterator]();current=await frames.next();next=current.done?current:await frames.next();};
  try{
    for(const t of timestamps){
      if(t<previous)throw new Error('Output timestamps must be ordered.');
      previous=t;
      if(!frames)await open(jump?t:undefined);
      else if(jump&&!next.done&&t-next.value.timestamp>jump)await open(t);
      if(current.done)throw new Error('The video has no decodable frames.');
      while(!next.done&&next.value.timestamp<=t+1e-7){current=next;next=await frames.next();}
      yield current.value;
    }
  }finally{await frames?.return?.();}
}
