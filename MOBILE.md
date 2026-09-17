# Strela Screen 0.6.0: desktop recordings for a phone

Choose **Style → iPhone · full context**, then export **MP4**, **1206 px**, using the frame rate marked **matches source**: 50 fps for sources near 25/50 fps, or 60 fps otherwise. Output is 1206×2622, the phone preset's target dimensions. Imported videos use this preset automatically. This is not a claim of physical-device certification.

The upper panel always contains the entire source, without cropping. The lower panel shows the smoothly moving detail. Pause and click anywhere in the upper overview to focus on an area currently outside the detail. Important content remains in the overview, but the app does not semantically detect every important label. Review the focus points before exporting.

When no reliable focus is found, the complete source is shown without a detail crop. Use **Choose visible area** to keep a selected source rectangle inside the detailed view throughout transitions; a large protected rectangle limits magnification. **Keep original pace** excludes selected reading or narration intervals from optional pause speed-up. These controls do not identify important content automatically.

Black is true #000000. The phone preset uses square corners to avoid clipping source corners, fixed safe margins, no shadows, no captions over the picture and no click waves. Click coordinates still drive focus. Synthetic demo click sounds were removed; sounds already baked into an imported video are not selectively removed (mute Volume if appropriate).

Export samples the original decoded frames, not the reduced preview. High-quality scaling and a resolution/frame-rate-dependent bitrate target are used. **Best**, **Balanced** and **Small** use minimum targets of 12, 6 and 3 Mbps respectively, with a 100 Mbps cap; these are encoder targets, not guaranteed file sizes. Small text still requires a sharp source: record at 1440p/4K, increase desktop UI/text size and avoid excessive zoom. Upscaling cannot recover missing detail. Use MP4 rather than GIF for iPhone playback and text fidelity. Messaging services may recompress files; transfer the original file.

Mediabunny remains the open-source decoding/encoding/container implementation; fflate handles projects and gifenc handles GIF. Existing notices are preserved. Camera interpolation, overview navigation and safe-layout code are original Strela code; adding an animation library would not improve exported pixel quality. No third-party app code is being claimed as reused.

Run `npm test` for the current automated suite, including output formats, protected-area containment and camera transitions. [QA.md](QA.md) records browser checks by date and distinguishes synthetic fixtures from historical real recordings. The 1280×720 demo does not certify 4K source text fidelity. Physical iPhone viewing, Windows and a sideloaded extension remain unverified.
