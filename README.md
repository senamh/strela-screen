# Strela Screen

**Latest: 0.3.0 mobile beta.** See [MOBILE.md](MOBILE.md): iPhone preset, full-source overview plus smooth detail view, native-size 1206×2622 MP4, true black background, no click waves or synthetic click sounds. Earlier 0.2 verification below is historical; physical iPhone testing is not claimed.

Private development repository for a local-first screen recorder and styled video editor. **0.2.0 is a browser beta, not a finished native Screen Studio replacement.**

## Implemented

- Record a screen, application window or browser tab using the browser's permission flow. Pause/resume, microphone and source audio mixing, save the original recording.
- For an explicitly selected extension source tab: collect click coordinates and generate editable automatic focus points. Screen/window recordings support manual focus, not global click tracking.
- Shared preview/export renderer: smooth zoom and pan, blended overlapping focus points, click highlights, rounded corners, shadows, four backgrounds, landscape/portrait/square framing.
- Timeline: split, remove, trim, undo/redo. Source video is unchanged.
- Local project library with autosave; portable `.strela` backup including video and edits. Interrupted recordings keep recovery chunks when storage is available.
- Offline worker rendering: MP4 (H.264/AAC), WebM (VP9/Opus), 720p/1080p/2160p and 30/60 fps, subject to codecs and memory. Export can continue while another tab is active. Cancellation terminates the worker.
- GIF: 15 fps, 360-pixel shortest edge, maximum 60 seconds, no audio. Color quantization is inherently lower fidelity than MP4/WebM.
- Original 8-second sample with audio and click cues: **Try demo**.

No account, server, uploads, analytics or cloud rendering is required. Videos remain in the browser profile unless downloaded. Removing the extension or clearing browser data can remove the local library: keep `.strela` backups.

## Install the extension

Use the supplied release ZIP, or build from source:

```sh
npm ci
npm run build
npm test
```

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode → **Load unpacked** → select **dist/strela-screen**. With the ZIP, extract it and select its **strela-screen** folder. Do not select the source repository root.
3. On the page to record, open Strela's popup → **Open studio**.
4. Choose **Record → Browser tab** for that source tab and automatic click cues. For a display or app, choose **Screen** or **Window**, then select the actual source in the browser picker.
5. Stop recording, edit the timeline/focus, choose **Export video**, then watch or download.

The mode is a picker preference, not a bypass of source selection. Chrome 116+ is the declared API minimum; use current Chrome/Edge. Safari and Firefox are not supported by this extension build.

## Try without installing

```sh
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. Import a video or use **Try demo**. Browser-picker recording works; automatic source-tab click tracking requires the extension. A safe recording fixture is at `/capture-check.html`. Localhost and the extension have separate project storage.

## Open-source code actually reused

| Library | Actual role | Pinned version |
|---|---|---|
| Mediabunny | Decode, encode, audio samples, MP4/WebM containers | 1.56.1 |
| fflate | Portable project ZIP packing/unpacking | 0.8.3 |
| gifenc | GIF encoding and palettes | 1.0.3 |
| esbuild | Extension bundling, development only | 0.28.2 |

See `THIRD_PARTY_NOTICES.md` and distributed `licenses/` for notices and source locations. Dependencies are pinned in `package-lock.json`. No code/assets from Screen Studio, OpenScreen, Flowtake, Recordly or Reframed were imported. Recording lifecycle, timeline, camera, UI and original demo artwork are Strela code.

## Structure

```text
src/       recorder, model, renderer, exporter, storage, extension messaging
ui/        studio, popup, Manifest V3, safe recording fixture
scripts/   build and localhost preview
tests/     model, archives, timing, routing and package checks
dist/      generated extension (not committed)
outputs/   handoff builds (not committed)
```

## Boundaries

- **Not yet independently tested on Windows/Edge or as a loaded extension.** macOS Chrome localhost checks and automated tests are in `QA.md`; they do not certify the extension-only permission path.
- An extension cannot obtain global mouse coordinates from arbitrary desktop applications. System-wide auto-focus and reconstructed/smoothed cursor need a native companion; it is **not included**. The source's recorded cursor remains in the video.
- Click tracking is limited to the selected accessible page, excludes cross-origin iframes and browser-internal pages, and may stop after navigation. No typed text, keystrokes or page content is collected.
- Microphone/desktop audio depends on browser, OS, source and permissions. A source may provide a silent audio track; track detection alone does not establish audibility.
- Large exports and archives use memory. 4K/long-recording performance and recovery after forced browser termination are not release-qualified. Start with short 1080p recordings.
- Webcam, subtitles, native installers, signing, store publication and automatic updates are not implemented.

See `RELEASE_CHECKLIST.md` for the remaining production-release requirements.
