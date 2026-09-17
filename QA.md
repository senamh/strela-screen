# QA evidence

## 0.6.1 design and publication checks (2026-09-17)

Final runtime build: `69648fab9a6c`; 118 automated tests pass. `git diff --check` is clean. The reproducible packaging/publication command reruns the suite after the final commit.

The editor, popup, static dialogs and protected-area picker were checked in the local Chrome-based studio. Viewport widths 1280, 900, 390 and 320 px had no horizontal document overflow or controls extending beyond the viewport. The saved-status text remained visible. Recording, export, project-library, protected-area and exported-video dialogs were opened; the narrow library and area picker remained within 296 px at a 320 px viewport. These are browser viewport checks, not tests on physical phones or Windows.

The synthetic eight-second demo completed import, visual analysis (4 focus points) and automatic phone MP4 export with a black backdrop. Parsed output: 1206×2622, 8.00 s, audio track present, approximately 1.9 MiB. The browser decoded the export at readyState 4, duration 8.064 s, without a media error. The audio fixture is silent; presence of its audio track is not an audible synchronization test. No browser warning/error was observed during the editor checks.

The pass reproduced a black paused preview at source time zero immediately after import, even though export was correct. Back to start restored the image without playing. The exact synthetic WebM had its first keyframe at zero, ruling out a positive media-start offset. Opening media now explicitly seeks to the first kept clip and waits for the decoded frame. A fresh complete demo run in the final build showed the correct first frame without Play or Back. Visibility, resize and context-restoration events request one repaint without reinstating continuous idle rendering.

The new release pipeline tests deterministic ZIP bytes across timezones, both archive layouts, stale runtime/document detection, unexpected files, symlinks, checksum validation, exact tested commit/tag and refusal to overwrite mismatched assets. The default command is read-only; preparation does not publish. Publication must still verify the actual remote downloads and the saved Gumroad attachment after reload.

Brand assets were inspected at their delivery dimensions: GitHub cover 1280×640, Gumroad cover 1280×720, thumbnail 600×600 and extension icons 16/32/48/128 px. Store illustrations are labelled and are not screenshots of the editor. Shared color-token contrast and static accessibility checks are automated; a full screen-reader audit has not been performed.

The full real-recording test below belongs to 0.6.0 and was not repeated in this design pass. Installed-extension capture, Windows/Edge, long-video resource limits, physical-iPhone playback and audible synchronization remain separate qualification gates.

## 0.6.0 real-recording release check (2026-09-17)

Build `9d8671e5ad00`, 95 automated tests passing, `git diff --check` clean. The previously unavailable recording was restored by the owner and processed locally. The private source and rendered video are not release assets and are not committed.

Source: 2560×1440 MP4, 180,544,199 bytes, approximately 477.05 s, no audio track. Automatic import completed analysis v5, found 97 visual focus points and 19 still intervals, then rendered the full recording with black phone overview/detail framing, pause speed-up off, Balanced size and 50 fps. Output: 1206×2622 MP4, 477.04 s, reported size 476.2 MiB, no audio as expected. The built-in browser player reached readyState 4 with matching dimensions and duration, without a media error. Sampled frames around 0, 24.55, 32 and 251.86 seconds decoded; the full-frame overview remained visible. At 24.55 s the detail crop covered the viewport's left-side information rather than the character; this illustrates that visual-change focus is not semantic tracking and may need manual correction. Other sampled detail frames showed the character. No browser warnings/errors were recorded.

This closes the missing-real-recording processing gate for the experimental release, not every visual-quality or platform gate. No physical iPhone playback, installed-extension capture, Windows/Edge qualification or full audio synchronization test was performed in this pass. No performance benchmark or accuracy percentage is claimed. Gumroad account access was confirmed; GitHub's existing public main remained at v0.5.0 before publication. Final publication verification belongs in the release handoff.

## 0.6.0 update identification and cancellation (2026-09-17)

The previous verification completed the synthetic import → visual focus → MP4 path and opened the exported-video dialog. Output: 1206×2622, parsed duration 8.00 s; the browser decoded it at readyState 4 with duration 8.064 s and no media error. No browser warnings/errors were recorded. This is a synthetic fixture, not the missing user recording.

Read-only comparison found an earlier 0.6.0 copy in Downloads/strela-screen: it lacked demo-worker.js and differed from the verified package. Its presence does not establish which folder Chrome has installed. No files in that folder were replaced.

The editor and popup now display a version plus a 12-character identifier derived from runtime sources, UI, build scripts and the dependency lockfile. Identical inputs produce the same identifier; changed inputs require a new build before packaging. `build-info.json` records it in both ZIP layouts. Documentation-only changes do not change this runtime identifier. The packaging command was checked against stale inputs and correctly refused to create an archive.

Build `9d8671e5ad00`: all 95 automated tests pass. New cancellation checks exercise abort before decoder construction, during metadata reads, timestamp lookup and sequential WebM fallback, along with disposal/listener cleanup. Controller tests cover same-ID reopen, delayed stale results, deferring thumbnail work while busy, no automatic retry loop after failure, and explicit Cancel leaving no scheduled thumbnail job. These use controlled decoder doubles; they are not long-video resource measurements.

Browser verification of this build: the identifier was visible in the editor; the synthetic demo completed automatic analysis (4 points) and MP4 export at 1206×2622 / 8.00 s with an audio track. The output dialog opened and its video decoded at readyState 4, 8.064 s, without a media error. Timeline thumbnails were present after processing. Explicit export cancellation returned to the editor with the cancellation status; a subsequent manual export completed with the same output dimensions/duration. No warnings/errors were recorded. Both ZIPs contain 30 files and match the built directory byte for byte. Real-recording, installed-extension and platform gates remain open.

## 0.6.0 processing follow-up (2026-09-17)

Build and 78 automated tests pass, including worker cancellation/completion/error cleanup, unchanged paused-preview gating and pausing playback before a busy operation. `git diff --check` passes. Demo generation is now a dedicated packaged worker; analysis shares its job-lifecycle helper. These checks do not establish a measured performance improvement or the cause of the earlier browser timeout.

Observed browser checks in this follow-up:

- The pre-fix synthetic demo completed import, analysis (4 visual points) and automatic MP4 export at 1206×2622; video duration parsed as 8.00 s, audio track present. The browser decoded that MP4 at readyState 4, 1206×2622, with media-element duration 8.064 s and no media error. The audio fixture is intentionally silent.
- After moving demo generation into a worker, the complete synthetic import again produced 4 points and an MP4 at 1206×2622 / 8.00 s with an audio track. Generate auto-focus then reported 4 points and restored them in the editable timeline.
- Cancel demo returned to the editor with the cancellation message. Reopening the synthetic project from the local library preserved its source, phone canvas and focus points.
- Cancel export returned to the editor; a subsequent export started normally. Its final completion was not observed because the test tab became unavailable. No browser warnings/errors had been observed before the last attempted check.

Remaining release gate: the earlier real screen recording is no longer available at its supplied location; a replacement was requested. The current pass must not be described as a new real-recording or installed-extension/Windows/iPhone qualification. GitHub main and its public beta remain at 0.5.0; no release was pushed during this pass. Gumroad requires account sign-in before its product can be updated. Publication is paused pending the real-video check and access. Debug and deploy-checklist methods were used to separate reproduced behaviour, code-level defects and release gates.

## 0.6.0 interface refinement (2026-09-17)

Build and 65 automated tests pass. The shared graphite/red palette is checked for text contrast, primary-action prominence, field boundaries and keyboard focus. Measured token contrasts: primary text 5.83:1, primary action against panel 5.31:1, input border against raised surface 3.67:1, secondary text against panel 8.36:1. Tests also check unique controller IDs, import/record placement before preview, three settings groups and palette inclusion in the packaged editor/popup.

Browser layout checked at 1280×720 and 390×844. At 390 px, document scrollWidth and clientWidth both equal 390; import, recording and export remain in the header area. Recording settings open and close from the relocated Record action, with the dialog fitting the narrow viewport. Video-processing code is unchanged by this design pass. This is not a physical-phone or cross-platform recording certification.

The demo-generation check advanced into local attention analysis, but subsequent browser control calls timed out twice. No console warning/error was observed before that timeout. A completed import/export was not verified in this pass; the earlier 2026-09-12 export evidence below remains historical. The narrow-check tab's viewport override was reset; the processing tab could not be reached to reset its temporary 390×844 override.

## 0.6.0 local verification (2026-09-12)

Automated coverage: 61 tests, including 20 deterministic synthetic pixel-sequence scenarios. Run `npm test`; build with `npm run build`. Fixtures live in `tests/fixtures/attention-scenarios.mjs`, assertions in `tests/attention-regression.test.mjs` and `tests/corrections.test.mjs`.

| Area | Test level | Coverage / acceptance |
| --- | --- | --- |
| Attention | Unit regression | 20 scenarios: static reading, caret, left/right/bottom controls, dialogs, large panels, cuts, sparse scrolling, competing changes, dominant action, reversible badge, action beside badge, typing, progress, rapid distant actions, distributed animation, delayed action, dim control. Every scenario asserts candidate count; localized targets also assert coordinates. |
| Camera and formats | Model + renderer integration | Protected rectangle containment throughout sampled transitions, 3 source aspect ratios, 4 output aspects; no stretching or corner clipping at 720/1080/1206/2160. Existing continuity and follow tests retained. |
| Editing and storage | Unit + archive integration | Per-point zoom/hold, cache invalidation, no merging of explicit overrides, preserved reading time through trims, undo, invalid imports, regeneration, `.strela` byte-exact source and edit round trip, stable IDs for legacy points. |
| Browser | Manual integration | Synthetic WebM import automatically analysed and exported as MP4 1206×2622, 8.00 s, audio present. Manual focus time/hold/zoom, undo/redo, point relocation in preview, protected interval and area selection by percentages and dragging exercised. Reload restored saved corrections. Regeneration retained 4 points without duplicating manually edited cues. Second MP4 with corrections and protected area decoded in the built-in browser (readyState 4, 1206×2622). Interface checked at 1440×900 and 390×844; at 390 px document scrollWidth equalled clientWidth. No browser warning/error logs observed. |

On the synthetic badge-only case, unfiltered per-frame detection produced 8 false candidates; v5 produced 0. With a new small action beside the badge, the prior detector produced 7 background candidates and missed the action; v5 produced 1 candidate at the action. Cumulative typing and progress retained all 6 expected candidates. These results concern constructed fixtures, not a real-world accuracy percentage.

Limitations / remaining acceptance work: no corpus of 15–20 real application recordings has been collected in this pass; the 20 fixtures are synthetic pixel sequences, not real recordings. Reading/narration and arbitrary background video are not semantically recognized. Full Windows/Edge/Chrome recording workflows and physical iPhone playback require separate testing. A large protected area can make small text less readable by limiting zoom; no upscaler can reconstruct absent source detail. No new release was published in this pass.

The testing-strategy skill informed the split between deterministic regression tests, archive/renderer integration and browser checks; passing units is not treated as visual or device certification.

## 0.5.0 frame rate, pauses, follow, store package

- **Frame rate.** The source rate is the median packet spacing of the first 240 packets, read without decoding. Sources near 25 or 50 fps render at 50 fps, everything else at 60; the export window marks the matching option. The owner's recording measured 50.22 fps and defaulted to 50.
- **Speed up pauses (off by default).** Analysis v4 stores stretches where under 0.012% of the 320 px frame changes. With the setting on, the effective timeline plays pauses of 3 s or more faster (half a second at normal speed at each edge, up to 16×) without changing the user's clips; sped-up audio is silent in preview and export. At a 0.06% threshold, typing and cursor movement were counted as pauses on a synthetic recording; at 0.012% only the static stretch (15–25.5 s) and a 1 s cursor rest remained. On the owner's recording: 19 pauses, 83 s; the longest were render waits in Blender. A 250–300 s trim with three sped-up pauses exported to 25.76 s and passed validation; a synthetic recording with audio exported to 17.43 s with silence only in the sped-up second.
- **Follow.** Analysis v4 also stores every visual-change hit. While the frame holds a shot or rests, a hit outside the central 75% shifts it part of the way, eased over 0.6–1.2 s depending on distance. Hits more than 25% of the frame from a zoomed shot are followed only if another hit landed near them within 1.5 s. Across the owner's recording, the share of hits inside the phone detail view 0.3 s later was 90.1% with shots only, 91.2% with this follow and 92.3% with unrestricted follow; the unrestricted variant pulled the frame from the acted-on panel to a viewport redraw at 31 s, so the confirmation rule was kept.
- **Faster trimmed exports.** For MP4/MOV, gaps over 5 s (a trimmed start, removed clips) restart decoding at the next frame instead of decoding through them: a 250–300 s trim exported in 24.8 s instead of about 45 s, with a byte-identical size. Cue-less WebM is still read in order.
- **Chrome Web Store.** Icons (16–128 px) and a 126-character description were added to the manifest; `npm run package` writes a release ZIP and a store ZIP with the manifest at the root. Listing text, permission justifications, privacy policy, promo tile, marquee and two 1280×800 screenshots from the demo project are in `store/` and `PRIVACY.md`.

`npm test`: 32 passing. Date: 2026-09-11.

## 0.4.3 export file size

Exports targeted 0.18 bits per pixel per frame (about 34 Mbit/s for 1206×2622 at 60 fps). A File size choice now sets the target: Best keeps that rate, Balanced (default) uses 0.07 and Small 0.035, with floors of 12, 6 and 3 Mbit/s. Encoding stays variable-bitrate H.264.

Measured on a busy 60-second segment (20–80 s) of the owner's 2560×1440 recording, exported as 1206×2622 at 60 fps: Best 170.7 MB, Balanced 79.2 MB, Small 44.1 MB, each in about 28 seconds. Crops at 1:1 from the detail view at 10.5 s and 33 s showed no visible difference in UI text between the three. The full 7:57 export with Best was 1.11 GB, so Balanced should be roughly half that. `npm test`: 26 passing, including validation of the size presets.

Date: 2026-09-11.

## 0.4.2 camera planner

The old camera averaged every focus point whose window covered the current time. With points about 3 s apart, the frame parked halfway between two actions for about a second (centre 0.50 × 0.47 between points at 0.2 × 0.25 and 0.8 × 0.7), arrived 2 s early and left 0.5 s after the action. Narrow layouts returned to a slice through the source centre between points.

Now focus points become shots on the edited timeline: arrive 0.4 s before the action, hold at least `hold` seconds after it, pan directly to a shot that starts within 1.5 s instead of zooming out, and rest on the last shot in phone, portrait and square layouts. Visual changes carry their changed-area size, so the zoom ranges from 40% of the strength setting (large panels) to the full setting (small controls); the phone style now uses 1.8 as its maximum. Planned crops are chased by a critically damped spring (ω = 14) and cached at 60 Hz. A path for 80 points over 8 minutes builds in about 14 ms; each frame then costs about 0.05 ms.

Checks: 25 tests pass, including new ones for arriving before and holding after actions, no parking between close actions (under 1.1 s in transit), zoom from changed-area size, and camera behaviour across timeline cuts. On the owner's 7:57 recording, frames at 22.3, 25.3, 28.3 and 31 s showed empty Blender grid in 0.4.1 and the acted-on panel or character with the new planner. The demo project exported to 1206×2622 with the new camera and no console errors.

Date: 2026-09-11.

## 0.4.1 export and auto-focus fixes

Found while reproducing user reports that export and Generate auto-focus did not work:

- Visual analysis found 0 focus points in WebM written by MediaRecorder (Strela's own recorder). mediabunny 1.56.1 timestamp lookups return no frame between keyframes in cue-less WebM (3 of 16 sample times decoded). Analysis now decodes sequentially with `sampleFrames`; the same file yields 2 focus points. Timeline thumbnails fall back to the same path.
- Screen and window recordings were never analysed, and Generate auto-focus stayed disabled without click cues or stored points. Recordings without cues are now analysed after Stop; the button is always available, runs the analysis on demand and reports how many points it found.
- The automatic import render did not save anything, and Download used the source file's name, so the render looked like a copy of the recording. The import render now starts the download itself; exports are named `<project> - Strela.<ext>`.
- Phone export at 2160 px (2160×4696) failed because H.264 cannot encode that size. MP4 now falls back to HEVC when the browser supports it; output validation reads container metadata instead of decoding.

Browser check (Chrome, macOS, studio at localhost): MP4 H.264/AAC 1920×1080, HEVC MOV 1180×2556 with variable frame rate and 44.1 kHz audio, and MediaRecorder VP9/Opus WebM all imported, analysed and exported. Manual exports passed for phone/wide/portrait/square in MP4, WebM and GIF, including 3840×2160 at 60 fps, 2160×4696 HEVC, and a timeline with split, removed clip and trim. A 180-second import exported to 1206×2622 in 167 seconds. A real 7:57 screen recording (2560×1440 H.264 MP4, ~50 fps, no audio), processed at the owner's request, produced 80 focus points in about 2.5 minutes and a valid 1206×2622 / 60 fps H.264 MP4 of 477.05 seconds (990 MB) in about 11 minutes. `npm test`: 22 passing.

Date: 2026-09-11. Synthetic fixtures were used for the matrix; the one real recording is not included in the repository.

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
