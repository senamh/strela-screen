let isRecording = false;
const OFFSCREEN_DOCUMENT_PATH = 'recorder.html';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') { sendResponse({ recording: isRecording }); return; }
  if (message.type === 'START_RECORDING') { startRecording(message, sender.tab).then(sendResponse); return true; }
  if (message.type === 'STOP_RECORDING') { chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP' }); sendResponse({ ok: true }); return; }
  if (message.type === 'RECORDER_STARTED') { isRecording = true; return; }
  if (message.type === 'RECORDER_STOPPED') { isRecording = false; return; }
});

async function startRecording(options, tab) {
  if (isRecording) return { ok: false, error: 'A recording is already in progress.' };
  const sourceTypes = [options.source, 'audio'];
  const streamId = await new Promise((resolve) => {
    chrome.desktopCapture.chooseDesktopMedia(sourceTypes, tab, (id) => resolve(id));
  });
  if (!streamId) return { ok: false, error: 'Recording was cancelled.' };
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_START', streamId, microphone: options.microphone, clicks: options.clicks });
  return { ok: true };
}

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)] });
  if (!contexts.length) await chrome.offscreen.createDocument({ url: OFFSCREEN_DOCUMENT_PATH, reasons: ['USER_MEDIA'], justification: 'Record the user-selected screen, window, or browser tab.' });
}
