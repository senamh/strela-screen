const state = { recording: false, source: 'screen' };
const recordButton = document.querySelector('#record-button');
const recordLabel = document.querySelector('#record-label');
const status = document.querySelector('#status');
const hint = document.querySelector('#hint');

document.querySelectorAll('.source-card').forEach((card) => {
  card.addEventListener('click', () => {
    state.source = card.dataset.source;
    document.querySelectorAll('.source-card').forEach((item) => item.classList.toggle('selected', item === card));
  });
});

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => updateUI(Boolean(response?.recording)));

recordButton.addEventListener('click', async () => {
  const microphone = document.querySelector('#microphone').checked;
  const clicks = document.querySelector('#clicks').checked;
  const message = state.recording
    ? { type: 'STOP_RECORDING' }
    : { type: 'START_RECORDING', source: state.source, microphone, clicks };
  recordButton.disabled = true;
  hint.textContent = state.recording ? 'Finishing your recording…' : 'Choose a screen, window, or tab in the secure picker.';
  chrome.runtime.sendMessage(message, (response) => {
    recordButton.disabled = false;
    if (chrome.runtime.lastError || !response?.ok) {
      hint.textContent = response?.error || chrome.runtime.lastError?.message || 'Could not start recording. Please try again.';
      return;
    }
    updateUI(!state.recording);
  });
});

function updateUI(recording) {
  state.recording = recording;
  recordButton.classList.toggle('recording', recording);
  recordLabel.textContent = recording ? 'Stop and save' : 'Start recording';
  status.textContent = recording ? 'Recording' : 'Ready';
  hint.textContent = recording ? 'Recording your selected source. You can close this window.' : 'Choose a source, then select it in Chrome\'s secure picker.';
}
