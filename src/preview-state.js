// Paused previews are repainted only after an edit or a newly decoded seek frame.
export function needsPreviewFrame({readyState,paused,busy,dirty,time,paintedTime}){
  return readyState>=2&&!busy&&(dirty||!paused||time!==paintedTime);
}
