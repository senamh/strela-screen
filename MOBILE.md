# Strela 0.3 — desktop recordings for a phone

Choose **Style → iPhone · full context**, then export **MP4**, **1206 px**, **60 fps**. Output is 1206×2622, matching the iPhone 17 Pro display dimensions published by [Apple](https://www.apple.com/iphone-17-pro/specs/). This is not a claim of physical-device certification.

The upper panel always contains the entire source, without cropping. The lower panel shows the smoothly moving detail. Pause and click anywhere in the upper overview to focus on an area currently outside the detail. Important content remains in the overview, but the app does not semantically detect every important label. Review the focus points before exporting.

Black is true #000000. The phone preset uses square corners to avoid clipping source corners, fixed safe margins, no shadows, no captions over the picture and no click waves. Click coordinates still drive focus. Synthetic demo click sounds were removed; sounds already baked into an imported video are not selectively removed (mute Volume if appropriate).

Export samples the original decoded frames, not the reduced preview. High-quality scaling and a resolution/frame-rate-dependent video bitrate (12–100 Mbps) are used. Small text still requires a sharp source: record at 1440p/4K, increase desktop UI/text size and avoid excessive zoom. Upscaling cannot recover missing detail. Use MP4 rather than GIF for iPhone playback and text fidelity. Messaging services may recompress files; transfer the original file.

Mediabunny remains the open-source decoding/encoding/container implementation; fflate handles projects and gifenc handles GIF. Existing notices are preserved. Camera interpolation, overview navigation and safe-layout code are original Strela code; adding an animation library would not improve exported pixel quality. No third-party app code is being claimed as reused.

17 automated tests pass, including all four output ratios, four resolutions, landscape/portrait/ultrawide sources, safe margins, full-source overview and disabled waves. Browser export check on macOS Chrome: MP4 1206×2622, 8.00 seconds, 60 fps requested; output metadata checks passed and the overview/detail composition was visually inspected. This fixture is only 1280×720, so it does not certify 4K source text fidelity. Physical iPhone viewing, Windows and a sideloaded extension remain unverified.
