# Chrome Web Store listing

Upload `outputs/strela-screen-<version>-store.zip` (manifest at the archive root). Assets are in this folder.

## Store listing

- **Name:** Strela Screen
- **Summary (from the manifest, 126 of 132 characters):** Turn screen recordings into phone-ready demos with automatic focus, a smooth camera and local MP4 export. Nothing is uploaded.
- **Category:** Tools
- **Language:** English
- **Icon:** `ui/icons/icon128.png`
- **Small promo tile (440×280):** `promo-440x280.png`
- **Marquee (1400×560):** `marquee-1400x560.png`
- **Screenshots (1280×800):** `screenshot-1-before-after.png`, `screenshot-2-phone.png`
- **Homepage:** https://github.com/senamh/strela-screen
- **Support:** https://github.com/senamh/strela-screen/issues

### Description (English)

Strela Screen turns a desktop screen recording into a vertical video for Reels, TikTok and Shorts, with no manual editing.

Import a recording, or record your screen, a window or a browser tab. Strela finds where the screen changes, zooms smoothly into each action and exports an MP4: the full screen on top and a close-up below, on a true black background. Everything runs in your browser. Your video is never uploaded.

HOW IT WORKS
1. Open the studio from the toolbar and click Import, or Record.
2. Strela analyses the video on your device and places focus points.
3. The finished MP4 downloads as "<project> - Strela.mp4".

WHAT YOU GET
• Automatic focus that arrives just before each action, stays on it and pans straight to the next one
• Zoom that fits the changed area: close on small controls, wider on large panels
• Phone layout at 1206×2622, plus landscape, portrait and square
• Optional speed-up for pauses where nothing on screen changes
• Timeline to split, trim and remove parts
• MP4, WebM or short GIF, with Best, Balanced or Small file size
• Local projects with autosave and .strela backups

GOOD TO KNOW
• Focus comes from visual changes in the frame, not from reading text or tracking the cursor, so review it before you publish. You can move or add focus points by clicking the video.
• Small text needs a sharp source recording.
• Tested in Chrome on macOS. Edge and Windows are expected to work.

Free and open source: https://github.com/senamh/strela-screen

### Description (Russian, optional second language)

Strela Screen превращает запись экрана компьютера в вертикальный ролик для Reels, TikTok и Shorts без ручного монтажа.

Импортируйте готовую запись или запишите экран, окно или вкладку браузера. В видео определяются места, где меняется изображение, к каждому действию выполняется плавное приближение, и результат сохраняется в MP4: сверху весь экран, снизу увеличенная область на чёрном фоне. Обработка выполняется в браузере, видео никуда не загружается.

КАК ЭТО РАБОТАЕТ
1. Откройте студию из панели браузера и нажмите Import или Record.
2. Видео анализируется на вашем компьютере, точки фокуса расставляются автоматически.
3. Готовый MP4 скачивается под именем «имя проекта - Strela.mp4».

ВОЗМОЖНОСТИ
• Приближение завершается перед действием, сохраняется после него и напрямую переходит к следующему действию
• Масштаб зависит от размера изменившейся области
• Вертикальный формат 1206×2622, а также горизонтальный, портретный и квадратный
• Ускорение пауз, в которых изображение не меняется, включается по желанию
• Таймлайн для разрезки, обрезки и удаления фрагментов
• MP4, WebM или короткий GIF с выбором размера файла
• Локальные проекты с автосохранением и резервными копиями .strela

ОГРАНИЧЕНИЯ
• Фокус определяется по изменениям изображения, без распознавания текста и курсора, поэтому перед публикацией результат стоит проверить. Точки фокуса можно переставить щелчком по видео.
• Для мелкого текста нужна чёткая исходная запись.
• Проверено в Chrome на macOS.

## Privacy practices tab

- **Single purpose:** Record or import a screen video and export it as a styled demo video with automatic focus, processed locally in the browser.
- **activeTab:** Lets the user record the tab they opened Strela from, after they choose to record it.
- **tabCapture:** Captures the video and audio of that tab when the user starts a "Browser tab" recording in the studio.
- **scripting:** While a tab is being recorded, adds a listener to that tab that records click times and positions for automatic focus. No page content, text, keystrokes or URLs are read; the listener stops when recording ends.
- **storage:** Keeps the current recording session (which tab is recorded and where the studio is) in session storage.
- **Remote code:** No. All code is included in the package.
- **Data usage:** Collects none of the listed data types. Nothing is sold, transferred or used for purposes unrelated to the single purpose.
- **Privacy policy URL:** https://github.com/senamh/strela-screen/blob/main/PRIVACY.md

## Submitting

1. Register a developer account at https://chrome.google.com/webstore/devconsole (one-time 5 USD fee, paid by the account owner).
2. Add item → upload the store ZIP.
3. Fill the Store listing and Privacy practices tabs from this file, add the images.
4. Distribution: Public, all regions. Submit for review.
