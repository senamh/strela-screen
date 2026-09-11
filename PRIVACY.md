# Strela Screen privacy policy

Effective 11 September 2026. Applies to the Strela Screen browser extension.

**Strela Screen does not collect, transmit, sell or share any personal data.** It has no account, server, analytics, advertising or telemetry.

## What stays on your device

- **Recordings and imported videos.** Screen, window or tab recordings and the videos you import are processed inside your browser. Visual analysis, focus, rendering and export all run locally. Nothing is uploaded.
- **Projects.** Your edits and the source video are kept in the extension's own browser storage (IndexedDB) until you delete them, clear site data or remove the extension. A `.strela` backup is saved only when you choose Save project.
- **Click positions.** When you record a browser tab from the extension, Strela notes where you click in that tab (time and position on screen) to place automatic focus. It does not read page text, keystrokes, form values, URLs or page contents, and these positions never leave your device.

## Permissions

- `tabCapture` and `activeTab`: record the tab you start Strela from, only after you choose to record.
- `scripting`: add the click-position listener to that tab while it is being recorded; it is removed when recording stops.
- `storage`: remember which tab is being recorded during a session.

Screen and window recording use the browser's own picker, which always asks you first.

## Contact

Questions or requests: open an issue at https://github.com/senamh/strela-screen/issues.
