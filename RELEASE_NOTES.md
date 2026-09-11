# Strela Screen 0.4.3: smaller files

Turn desktop recordings into phone-ready demos. Free, local-first, no account required by Strela.

## What's new

- **Choose the file size.** The export window has a new **File size** option:
  - **Balanced** (default, also used by the automatic render after Import): about half the size of Best, with the same text sharpness in our checks.
  - **Best**: the rate used up to 0.4.2.
  - **Small**: about half of Balanced again, for messengers.
- Measured on a busy 60-second segment of a 2560×1440 screen recording, exported for iPhone at 1206×2622 and 60 fps: **Best 170.7 MB, Balanced 79.2 MB, Small 44.1 MB**, each rendered in about 28 seconds. Crops of UI text at 1:1 showed no visible difference.

Everything from 0.4.2 is included: the new shot-by-shot camera that arrives before each action, stays after it and pans directly between close actions.

## Download and install

Download **strela-screen-0.4.3.zip** from the Assets section below, not the automatically generated source-code ZIP.

1. Extract the archive.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable Developer mode → **Load unpacked** → select the extracted **strela-screen** folder containing `manifest.json`.
4. Open Strela → **Open studio** → **Import** a video, or **Try a demo**.
5. Wait for analysis and rendering. The MP4 downloads as `<project> - Strela.mp4` when it is ready.

**Updating:** back up `.strela` projects, replace the files in the existing extension folder, press reload on Strela in `chrome://extensions` and reopen the studio. Do not uninstall it if you want to keep its local library. **Save project** downloads a `.strela` project backup, not a video.

The archive includes Russian installation instructions, third-party notices and a test/limitations report.

## Before you try it

This is an **experimental browser beta**, not a signed desktop installer or a Chrome Web Store release. Intended for current Chrome/Edge. macOS Chrome studio checks have passed; Windows/Edge and the sideloaded extension permission paths still need qualification. Safari/Firefox are unsupported.

Analysis detects visual changes. It is not OCR, semantic understanding or guaranteed cursor tracking, so review generated focus. Small text needs a sharp source; increasing output resolution cannot restore missing detail. File sizes depend on how much the screen changes; fast motion such as 3D viewports needs more data.

**Verification:** 26 automated tests pass, including validation of the size presets. Physical iPhone testing is not claimed.

Report a reproducible problem through GitHub Issues. Include browser/OS, error message and a non-sensitive sample when possible. Do not attach private screen recordings publicly.
