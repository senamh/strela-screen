let recorder;
let stream;
let chunks = [];

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'OFFSCREEN_START') start(message);
  if (message.type === 'OFFSCREEN_STOP') stop();
});

async function start({ streamId, microphone }) {
  if (recorder?.state === 'recording') return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId } },
      video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId } }
    });
    if (microphone) {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mixed = new MediaStream([...stream.getVideoTracks(), ...stream.getAudioTracks(), ...mic.getAudioTracks()]);
      stream = mixed;
    }
    chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.onstop = saveRecording;
    stream.getVideoTracks()[0].addEventListener('ended', stop);
    recorder.start(1000);
    chrome.runtime.sendMessage({ type: 'RECORDER_STARTED' });
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'RECORDER_STOPPED' });
    console.error('Strela recording error', error);
  }
}

function stop() {
  if (recorder?.state === 'recording') recorder.stop();
}

async function saveRecording() {
  stream?.getTracks().forEach((track) => track.stop());
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  await chrome.downloads.download({ url, filename: `Strela/strela-${now}.webm`, saveAs: true });
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  chunks = [];
  chrome.runtime.sendMessage({ type: 'RECORDER_STOPPED' });
}
