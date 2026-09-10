# Production release gates

Status: 0.2.0 browser beta. Do not market it as fully tested on both operating systems yet.

## 1. Extension qualification — next required gate

- Load the built extension in clean Chrome and Edge profiles on macOS and Windows 11.
- Record a normal page through the extension's source-tab path; verify click cues line up with video, including pause/resume.
- Reopen from another tab/window, close the source tab, navigate the source, record restricted pages, deny/cancel permissions. Each case must stop safely or explain the limitation; no phantom recording state.
- Record a whole display and a separate application window on each OS. Test microphone, source audio and both together. Listen to actual output; a reported audio track is insufficient evidence.
- Check user stopping browser sharing, rapid start/stop, device unplug, sleep/wake and repeated sessions.
- Verify no recording tracks remain active after stop/error/cancel.

## 2. Reliability and visual acceptance

- 1/10/30-minute recordings at 1080p; 4K only after memory and render-time measurements on representative machines.
- Inspect frame pacing and audible synchronization before/after several cuts at 30/60 fps.
- Compare exported frame images against preview at each focus transition and crop boundary. Native cursor is currently baked in; do not claim cursor smoothing.
- Check extreme source aspect ratios, window resize, multiple monitors and mixed display scaling.
- Verify `.strela` save/import in the actual extension, local library after browser restart, full storage, corrupt input and forced-termination recovery. An incomplete final recording chunk may not be recoverable.
- Audit keyboard/focus behavior, screen-reader labels and small-screen layouts.

## 3. Native companion — required for desktop-wide auto-focus

Build and qualify a separate signed companion for each OS; this is not part of 0.2.0.

- Shared versioned event format: monotonic timestamp, normalized coordinates, display identity/scaling, click type, recording session token. Never collect typed text.
- Authenticated native messaging restricted to Strela's installed extension identity, explicit session start/stop and permission revocation.
- macOS capture/cursor permissions and Windows capture/display scaling must each be exercised on real devices.
- Record cursor metadata separately from cursor-free frames where supported, then render the smoothed cursor with the same timeline/crop transform as the video.
- First milestone: a short recording of a non-browser app with accurately aligned automatic zoom and clicks on both OSes. Only then add packaging/signing/updating.

## 4. Product release

- Decide supported OS/browser versions from measured results, not the minimum API declaration.
- Package stable release, verify third-party notices/source availability for exact bundled versions, provide privacy policy and uninstall/data-removal guidance.
- Store listing/review, signing credentials and publication require the owner's account and approval. No store publication or certificate purchase has been performed.
- Optional subsequent features: webcam track, captions, reusable branding, native installers and automatic updates. None are present in this beta.
