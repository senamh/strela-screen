# QA evidence — 0.2.0

## 0.4.0 automatic-import check

22 automated tests pass. Browser check: the original 8-second sample is constructed as a real WebM File and passed to exactly the same importMedia function used by the file picker, without click cues. Visual analysis generated 3 focus points (1, 4, 7 seconds), applied the phone/black settings and automatically rendered MP4 1206×2622, 8.00 seconds. Duration/dimensions/audio-track validation passed. No manual focus, preset selection or Export click was used. This checks the shared processing pipeline, not the native file-picker dialog or extension installation.

Additional tests reject static frames, tiny blinking pixels, global changes and equally distributed changes. Uncertain input renders the complete source. Localized changes can still be semantically irrelevant; no claim of OCR or general cursor recognition is made. Windows/physical-iPhone testing remains outstanding.

Date: 2026-09-10. Environment: macOS, Chrome, studio served at 127.0.0.1:4173. Only Strela's original fixtures were recorded; no user desktop content was captured for testing.

## Automated

`npm run build && npm test`: 15 passing tests at this checkpoint.

- Portable archive roundtrip preserves original source bytes and project edits; invalid archive rejected.
- Camera continuity, overlapping distant focus, crop bounds and portrait neutral transitions.
- Timeline split/cuts, source/output mapping, immutable undo/redo, validation of corrupt ranges/settings.
- Click timestamp mapping excludes paused intervals.
- Extension message routing rejects clicks from unrelated tabs; popup updates source when reusing studio.
- Variable-frame-rate resampling holds the latest frame through static gaps and closes decoding on cancellation.
- Manifest/bundle/license presence and extension-like CSP in the local preview.

## Browser checks observed

| Scenario | Observed result |
|---|---|
| Original demo generation | 8-second 1280×720 source with audio and 3 click cues |
| MP4 demo export | 1920×1080, 8.00 s, audio track present |
| Remove the middle 2 seconds | Two retained clips, timeline 6 seconds |
| MP4 after the cut | 1920×1080, 6.00 s, audio track present |
| Reload and local library | Project reopened with retained clips and settings |
| GIF of edited demo, final build | 360×640, displayed in image preview; downloaded file independently parsed: 90 frames, frame delays total exactly 6.00 s |
| Actual browser-picker recording | Selected only the Strela capture fixture tab; pause, resume, stop; recorded media reopened at 11.37 s |
| Real variable-rate recording export | Initially exposed a missing-frame bug; fixed with sequential hold-last-frame resampling; retry succeeded at 720×1280, 11.38 s, WebM, 60 fps requested, audio track present |
| Portable project, static archive worker | Saved under restrictive self-only worker CSP; downloaded archive reopened in Node: clips [0,2] and [4,8], original source 581297 bytes |
| Export cancellation | Returned to editable project, clips and settings retained |
| MP4 retry after cancellation, restrictive CSP | 1280×720, 6.00 s, audio track present; no browser console errors observed |
| Dependency audit | `npm audit --omit=dev`: 0 known vulnerabilities reported at this check |

Duration, dimensions and audio presence for MP4/WebM are obtained by reopening the resulting file through the media parser. The GIF UI uses intended encoder settings; the downloaded QA fixture was additionally checked by parsing its dimensions, image blocks and frame-delay fields. Audio-track presence does not prove audible sound or perceptual synchronization. The capture fixture has no sound.

## Not yet verified

Actual sideloaded extension APIs/permissions, Windows, Edge, microphone input, desktop/system audio, real non-browser windows/displays, prolonged recordings, 4K performance, low storage and forced-termination recovery. Native companion and reconstructed cursor are absent, not merely untested.

See `RELEASE_CHECKLIST.md`. A passing local test run is not a cross-platform release certification.
