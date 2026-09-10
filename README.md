# Strela Screen

The first Strela Screen prototype is a Chrome/Edge Manifest V3 extension that records a whole display, individual app window, or browser tab. It deliberately uses Chrome's secure source picker: the extension never chooses a screen on the user's behalf.

## Run locally

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable Developer mode.
3. Choose **Load unpacked** and select this folder.
4. Open Strela, choose Screen, Window, or Tab, then start recording.

Recorded WebM files are downloaded locally. The next milestone is the Strela Auto Director: event sidecars, smooth camera paths, polished cursor rendering, and MP4/GIF export.

## Current boundary

The browser can capture desktop screens and application windows. Perfect system-audio capture varies by operating system and source chosen in the browser's picker; it is not guaranteed in this prototype.

## Studio prototype

Open **Open Strela Studio** from the popup. Import a video or record from the studio, pause and click the preview to place manual focus points, adjust zoom strength, then export styled WebM. Export runs in real time and cancels when the tab is hidden.

Automatic event detection, synthetic cursor replacement, MP4 export, and end-to-end Chrome/Edge validation are still pending. The original popup/offscreen capture path is experimental; use the studio recording button for the current development workflow.

Run camera tests with `node motion.test.cjs`. No third-party project code has been imported yet; open-source candidates discussed during planning remain candidates, not dependencies.
