# Strela Screen 0.4 — Public beta

Turn desktop recordings into phone-ready demos. Free, local-first, no account required by Strela.

## Download and install

Download **strela-screen-0.4.0.zip** from the Assets section below — not the automatically generated source-code ZIP.

1. Extract the archive.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable Developer mode → **Load unpacked** → select the extracted **strela-screen** folder containing `manifest.json`.
4. Open Strela → **Open studio** → **Import** a video, or **Try a demo**.
5. Wait for analysis and rendering, then choose **Download video**.

The archive includes Russian installation instructions, third-party notices and a test/limitations report. Existing users: back up `.strela` projects, replace the files in the existing extension folder, reload the extension and reopen the studio. Do not uninstall it if you want to retain its local library.

## What's inside

- Automatic local visual-change analysis on video import; editable smooth focus points.
- Black phone layout: full-frame overview plus a detailed view. If no reliable focus is found, keep the complete source instead of inventing a crop.
- MP4 export at 1206×2622 with 60 fps selected automatically for imported videos.
- Screen/window/tab recording; timeline split/trim/remove; project backup and local autosave.
- MP4, WebM and short GIF export. No added click waves or synthetic click sounds.

## Before you try it

This is an **experimental browser beta**, not a signed desktop installer or a Chrome Web Store release. Intended for current Chrome/Edge. macOS Chrome local-studio checks have passed; Windows/Edge and the sideloaded extension permission paths still need qualification. Safari/Firefox are unsupported.

Analysis detects visual changes — it is not OCR, semantic understanding or guaranteed cursor tracking. Review generated focus. Small text needs a sharp source; increasing output resolution cannot restore missing detail. Long recordings and 4K can use substantial memory. Source/microphone audio depends on permissions and platform. There is no native companion for system-wide cursor reconstruction.

**Verification:** 22 automated tests pass. The shared import pipeline analysed an 8-second WebM fixture without click metadata, produced 3 focus points and automatically rendered an MP4 whose parsed dimensions/duration were 1206×2622 / 8.00 seconds. Physical iPhone testing is not claimed.

Report a reproducible problem through GitHub Issues. Include browser/OS, error message and a non-sensitive sample when possible. Do not attach private screen recordings publicly.
