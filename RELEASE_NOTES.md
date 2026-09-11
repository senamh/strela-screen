# Strela Screen 0.4.1: export and auto-focus fixes

Turn desktop recordings into phone-ready demos. Free, local-first, no account required by Strela.

## What's fixed

- **Auto-focus now works on Strela's own recordings.** WebM files written by the built-in recorder (and other MediaRecorder-based tools) returned no frames between keyframes during analysis, so they got 0 focus points and exported without any zoom. Analysis now decodes frames in order and finds focus in these files.
- **Generate auto-focus is always available.** It used to stay disabled for screen and window recordings. It now runs the analysis on demand and tells you how many focus points it found. Screen and window recordings are also analysed automatically after you stop.
- **The import render downloads itself.** After Import, the finished MP4 is saved to your downloads folder as `<project> - Strela.mp4`, so it no longer shares a name with the source recording. Manual exports still wait for **Download video**.
- **Phone export at 2160 px works.** H.264 cannot encode 2160×4696, so that size is now written as HEVC (H.265) in MP4 when your browser supports it.
- Clearer status messages when no focus is found, and the progress dialog now says **Cancel analysis** during analysis.

Note: **Save project** downloads a `.strela` project backup, not a video.

## Download and install

Download **strela-screen-0.4.1.zip** from the Assets section below, not the automatically generated source-code ZIP.

1. Extract the archive.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable Developer mode → **Load unpacked** → select the extracted **strela-screen** folder containing `manifest.json`.
4. Open Strela → **Open studio** → **Import** a video, or **Try a demo**.
5. Wait for analysis and rendering. The MP4 downloads when it is ready.

**Updating from 0.4.0:** back up `.strela` projects, replace the files in the existing extension folder, press reload on Strela in `chrome://extensions` and reopen the studio. Do not uninstall it if you want to keep its local library. Projects analysed by 0.4.0 can be re-analysed with **Generate auto-focus**.

The archive includes Russian installation instructions, third-party notices and a test/limitations report.

## Before you try it

This is an **experimental browser beta**, not a signed desktop installer or a Chrome Web Store release. Intended for current Chrome/Edge. macOS Chrome studio checks have passed; Windows/Edge and the sideloaded extension permission paths still need qualification. Safari/Firefox are unsupported.

Analysis detects visual changes. It is not OCR, semantic understanding or guaranteed cursor tracking, so review generated focus. Small text needs a sharp source; increasing output resolution cannot restore missing detail. Long recordings produce large files: an 8-minute phone export at 60 fps can be close to 1 GB. Source/microphone audio depends on permissions and platform.

**Verification:** 22 automated tests pass. In Chrome on macOS, MP4 (H.264/AAC), HEVC MOV with variable frame rate and MediaRecorder WebM were imported, analysed and exported; manual exports passed in every layout for MP4, WebM and GIF, including a trimmed timeline. A real 8-minute 2560×1440 screen recording produced 80 focus points and a valid 1206×2622 / 60 fps MP4. Physical iPhone testing is not claimed.

Report a reproducible problem through GitHub Issues. Include browser/OS, error message and a non-sensitive sample when possible. Do not attach private screen recordings publicly.
