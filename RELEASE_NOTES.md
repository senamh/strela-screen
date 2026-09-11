# Strela Screen 0.4.2: a new camera

Turn desktop recordings into phone-ready demos. Free, local-first, no account required by Strela.

## What's new

- **The frame no longer parks between two actions.** The old camera averaged nearby focus points, so with actions about 3 seconds apart it showed the empty space between them for about a second. Focus points are now visited one at a time.
- **Arrive before, stay after.** The frame reaches each action 0.4 s before it happens and stays at least the chosen focus duration afterwards, so the result of a click stays in view.
- **Direct pans between close actions.** When the next action starts within 1.5 s, the frame pans straight to it instead of zooming out and back in.
- **Zoom that fits what changed.** Visual analysis now measures the changed area: small controls get a closer shot, large panels a wider one. The iPhone style now zooms up to 1.8×.
- **Calmer phone and portrait layouts.** Between actions the detail view stays on the last area instead of jumping to a slice through the middle of the screen.
- **Smooth everywhere.** The camera path is planned once, smoothed with a spring and shared by preview and export. Cuts on the timeline are respected.

Projects analysed by earlier versions can be re-analysed with **Generate auto-focus** to get the changed-area sizes.

## Download and install

Download **strela-screen-0.4.2.zip** from the Assets section below, not the automatically generated source-code ZIP.

1. Extract the archive.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable Developer mode → **Load unpacked** → select the extracted **strela-screen** folder containing `manifest.json`.
4. Open Strela → **Open studio** → **Import** a video, or **Try a demo**.
5. Wait for analysis and rendering. The MP4 downloads as `<project> - Strela.mp4` when it is ready.

**Updating:** back up `.strela` projects, replace the files in the existing extension folder, press reload on Strela in `chrome://extensions` and reopen the studio. Do not uninstall it if you want to keep its local library. **Save project** downloads a `.strela` project backup, not a video.

The archive includes Russian installation instructions, third-party notices and a test/limitations report.

## Before you try it

This is an **experimental browser beta**, not a signed desktop installer or a Chrome Web Store release. Intended for current Chrome/Edge. macOS Chrome studio checks have passed; Windows/Edge and the sideloaded extension permission paths still need qualification. Safari/Firefox are unsupported.

Analysis detects visual changes. It is not OCR, semantic understanding or guaranteed cursor tracking, so review generated focus. Small text needs a sharp source; increasing output resolution cannot restore missing detail. Long recordings produce large files: an 8-minute phone export at 60 fps can be close to 1 GB.

**Verification:** 25 automated tests pass, including arrival before and hold after actions, no parking between close actions, zoom from changed-area size and camera behaviour across timeline cuts. On a real 8-minute screen recording, moments that showed empty space between actions in 0.4.1 now show the panel being worked on. Physical iPhone testing is not claimed.

Report a reproducible problem through GitHub Issues. Include browser/OS, error message and a non-sensitive sample when possible. Do not attach private screen recordings publicly.
