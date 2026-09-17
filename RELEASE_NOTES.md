# Strela Screen 0.6.3: safer automatic focus and export download

Automatically detected focus in wide recordings now retains at least about 78% of the source width unless a person explicitly changes that point's zoom. Peripheral redraws no longer pull a fully automatic wide shot away from its planned focus. This reduces accidental cropping but does not identify which page content matters. Manual corrections and phone framing are unchanged.

Every successful manual MP4, WebM or GIF render now requests a download after validating the file. The Download video button remains available if the browser does not start it. Repeated canvas readback warnings during video analysis and GIF rendering are addressed.

The supplied 31.42-second MP4 decoded fully in a software decoder. Visual inspection found cropped headings around 22 and 26–29 seconds. The original recording and its editable focus project were unavailable, so that exact project was not rerendered. A synthetic eight-second import and manual export completed in the local browser; that browser did not expose a download event even for a manual click. Download behavior in an installed Chrome extension still requires direct verification. Windows/Edge and physical-iPhone checks remain open.

Install `strela-screen-0.6.3.zip` and reload the existing extension after saving project backups. The previous [0.6.2 release](https://github.com/senamh/strela-screen/releases/tag/v0.6.2) remains available.

## Previous release: 0.6.2

The toolbar popup keeps its intended 340 px width so its heading and Open studio button remain readable.

## Previous release: 0.6.1

Free experimental browser beta. Install the unpacked extension in current Chrome or Edge. This is not an approved store listing or a signed desktop application.

## Changes

- Pure black (`#000000`) is the default for new recordings, restored interrupted recordings and every style preset. Video imports already use black phone framing. Explicitly saved project backgrounds are preserved, and all five colors remain available manually.
- The editor, extension popup, recording/export dialogs, project library and correction controls share graphite surfaces, a restrained red accent, consistent focus states and responsive spacing.
- A paused preview repaints once after returning to the tab, resizing the window or restoring its drawing context. It still avoids continuous idle rendering and remains suspended while processing.
- Opening video now prepares the first retained frame explicitly, avoiding a black initial preview until playback or a manual seek. Source timestamps and exports are unchanged.
- Extension icons, GitHub cover and distribution artwork use the same arrow mark and palette. Product illustrations are labelled as illustrations rather than app screenshots.
- Packaging produces sorted, deterministic ZIPs, SHA-256 checksums and release metadata. The same installation ZIP is used for GitHub, Gumroad and direct delivery.
- Publication is explicit and verifies the remote commit, asset integrity and public downloads. Existing mismatched assets are never silently overwritten. A preparation command builds and tests locally without publishing.

The visual-change analysis, camera planner, codecs and output dimensions are unchanged from 0.6.0. Automatic focus is editable and still needs review; this release does not add semantic tracking or OCR.

## Download and update

Download **strela-screen-0.6.1.zip**, not the GitHub source-code ZIP or the `-store.zip` archive.

1. Extract the archive and locate the `strela-screen` folder containing `manifest.json`.
2. Open `chrome://extensions` or `edge://extensions`, enable Developer mode and choose **Load unpacked**.
3. Open Strela, then **Open studio**. Import a recording or use **Try a demo**.
4. After successful video-import analysis, an MP4 is rendered and downloaded as `<project> - Strela.mp4`. New recordings are reviewed and exported manually.

For an update, first save `.strela` backups, replace files in the existing extension folder, reload the extension and reopen the studio. Do not uninstall: removing the extension can erase its local library. **Save project** creates a portable backup, not a finished video.

Compare the editor's version/build identifier with `build-info.json`. The ZIP includes Russian installation instructions and third-party notices. The `-store.zip` file is only a store-compatible layout, not evidence of store approval.

## Verification and limitations

Current automated and browser checks are recorded in [QA.md](https://github.com/senamh/strela-screen/blob/main/QA.md). The full 7:57 real-recording import/export was checked on 0.6.0; it is historical evidence, not a new long-video qualification for this release.

Local processing has been checked in Chrome on macOS. Windows/Edge, installed-extension capture and playback on a physical iPhone still require separate qualification. System audio depends on browser, OS and source. Large exports use memory. Source detail limits text clarity: upscaling cannot recover missing pixels.

The [previous 0.6.0 release](https://github.com/senamh/strela-screen/releases/tag/v0.6.0) remains available for rollback. Before reverting, save project backups. Report reproducible issues without posting private recordings publicly.
