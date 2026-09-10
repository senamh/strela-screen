// Resample variable-rate screen capture into a constant-rate output. Keep the
// most recent decoded frame between updates, just as normal video playback does.
// The sink needs a pool of at least two canvases: current and look-ahead.
export async function* sampleFrames(sink,timestamps){
  const frames=sink.canvases()[Symbol.asyncIterator]();
  try{
    let current=await frames.next();
    if(current.done)throw new Error('The video has no decodable frames.');
    let next=await frames.next(),previous=-Infinity;
    for(const t of timestamps){
      if(t<previous)throw new Error('Output timestamps must be ordered.');
      previous=t;
      while(!next.done&&next.value.timestamp<=t+1e-7){current=next;next=await frames.next();}
      yield current.value;
    }
  }finally{await frames.return?.();}
}
