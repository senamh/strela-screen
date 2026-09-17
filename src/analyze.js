import {workerJob} from './worker-job.js';
export function analyzeVideo(blob,onProgress,signal){return workerJob('analysis-worker.js',{blob},onProgress,signal);}
