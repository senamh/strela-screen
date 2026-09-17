# Strela interface and release artwork

## Scope

The editor, extension popup, recording/export/progress/library/watch dialogs, focus corrections, protected-area picker, capture-test page, icons and release artwork share one graphite/red identity. The 0.6.1 pass removed accumulated editor CSS overrides, replaced the old green artwork, named dialogs and preserved all existing controller IDs.

## Visual rules

- `ui/theme.css` is the shared source for interface colors, type, corner radii and motion. Neutral surfaces separate settings from the preview; red identifies primary actions and selection accents.
- Primary text, muted text and keyboard focus must satisfy the contrast tests in `tests/theme.test.mjs`. Focus must remain visible independently of color selection.
- Main actions use at least 44 px targets. Compact backdrop swatches retain a check mark and `aria-pressed`, not color alone.
- Controls expose default, hover, keyboard focus, disabled and selected states. Dialogs have visible headings and close actions; scrolling is contained within narrow dialogs.
- Reduced-motion preferences disable decorative transitions and recording-dot animation. No click waves or generated click sounds are added.
- Pure black is the default video background. Interface colors do not recolor source video. Saved project backgrounds are preserved.

## Files and reuse

Use `ui/editor.css` for editor/dialog/correction components and `ui/popup.css` for the extension popup. Keep tokens in the shared stylesheet instead of adding competing override sections. Use `ui/icons/icon48.png` for the same arrow mark in editor and popup.

`docs/icon.svg` is the icon source. `docs/release-cover.svg` is the GitHub artwork source. `scripts/brand-assets.mjs` renders the icons, covers, Gumroad thumbnail and labelled store illustrations using an available build-time Sharp installation. It is not a runtime dependency.

Gumroad receives `docs/gumroad-cover.png` (1280×720) and `docs/gumroad-thumbnail.png` (600×600). GitHub uses the 1280×640 release cover. Store illustrations retain legacy screenshot filenames but are explicitly labelled as illustrations; they must not be represented as captured editor screenshots.

## Verification

Run the build and full tests before publication. Runtime checks must include desktop, narrow widths, dialog scrolling, the selected black backdrop, keyboard focus and import → analysis → export. See QA.md for observed results and remaining platform limits; CSS and automated tests alone do not establish universal accessibility or device compatibility.
