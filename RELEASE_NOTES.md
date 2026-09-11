# Strela Screen 0.5.0: follow, pauses, frame rate

Turn desktop recordings into phone-ready demos. Free, local-first, no account required by Strela.

## What's new

- **Speed up pauses (optional).** Turn on **Speed up pauses** to play stretches of 3 seconds or more where nothing on screen changes up to 16× faster. Cursor movement and typing do not count as pauses. Your clips are not changed, and the sped-up parts are silent. Off by default. On an 8-minute Blender recording it found 19 pauses (83 seconds), mostly render waits.
- **Frame rate that matches the source.** Recordings near 25 or 50 fps now render at 50 fps instead of 60, which repeated every fifth frame; the export window marks the matching option.
- **Continuous follow.** While the frame holds an action, work that drifts towards the edge moves it part of the way, smoothly. A change far from the current action is followed only when a second change confirms it, so one-off redraws elsewhere on screen do not pull the frame away.
- **Faster exports of trimmed MP4s.** Skipped parts are no longer decoded: a 50-second clip starting at 4:10 exported in 25 s instead of about 45 s.
- **Icons** for the toolbar and extensions page, and a [privacy policy](https://github.com/senamh/strela-screen/blob/main/PRIVACY.md).

Projects from earlier versions can use pauses after **Generate auto-focus** re-runs the analysis.

## Download and install

Download **strela-screen-0.5.0.zip** from the Assets section below, not the automatically generated source-code ZIP.

1. Extract the archive.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable Developer mode → **Load unpacked** → select the extracted **strela-screen** folder containing `manifest.json`.
4. Open Strela → **Open studio** → **Import** a video, or **Try a demo**.
5. Wait for analysis and rendering. The MP4 downloads as `<project> - Strela.mp4` when it is ready.

**Updating:** back up `.strela` projects, replace the files in the existing extension folder, press reload on Strela in `chrome://extensions` and reopen the studio. Do not uninstall it if you want to keep its local library. **Save project** downloads a `.strela` project backup, not a video.

The archive includes Russian installation instructions, third-party notices and a test/limitations report.

## Before you try it

This is an **experimental browser beta**, not a signed desktop installer or a Chrome Web Store release. Intended for current Chrome/Edge. macOS Chrome studio checks have passed; Windows/Edge and the sideloaded extension permission paths still need qualification. Safari/Firefox are unsupported.

Analysis detects visual changes. It is not OCR, semantic understanding or guaranteed cursor tracking, so review generated focus. Small text needs a sharp source; increasing output resolution cannot restore missing detail. File sizes depend on how much the screen changes.

**Verification:** 32 automated tests pass, including pause detection and speed-up timing, follow behaviour and frame-rate choice. Exports with sped-up pauses were checked for duration and for silence in the sped-up parts. Physical iPhone testing is not claimed.

Report a reproducible problem through GitHub Issues. Include browser/OS, error message and a non-sensitive sample when possible. Do not attach private screen recordings publicly.
