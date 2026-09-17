# Chrome Web Store listing

Draft for the 0.6.2 experimental browser beta. This is not a published or approved store listing; GitHub and Gumroad publication are separate steps.

Upload `outputs/strela-screen-<version>-store.zip` (manifest at the archive root). Assets are in this folder.

## Store listing

- **Name:** Strela Screen
- **Summary (from the manifest, 126 of 132 characters):** Turn screen recordings into phone-ready demos with automatic focus, a smooth camera and local MP4 export. Nothing is uploaded.
- **Category:** Tools
- **Language:** English
- **Icon:** `ui/icons/icon128.png`
- **Small promo tile (440×280):** `promo-440x280.png`
- **Marquee (1400×560):** `marquee-1400x560.png`
- **Product illustrations (1280×800):** `screenshot-1-before-after.png`, `screenshot-2-phone.png`. These legacy filenames contain labelled illustrations, not captured application screenshots. Add actual current screenshots before submitting a store listing.
- **Homepage:** https://github.com/senamh/strela-screen
- **Support:** https://github.com/senamh/strela-screen/issues

### Description (English)

Strela Screen creates an editable vertical video from a desktop screen recording, with automatic visual-change analysis and local export.

Import a recording, or record your screen, a window or a browser tab. Strela finds localized visual changes and places editable focus points. The phone layout includes a full-screen overview and a smoothly moving close-up on a true black background. If no reliable focus is found, it preserves the complete source. Everything runs in your browser. Your video is never uploaded.

HOW IT WORKS
1. Open the studio from the toolbar and click Import, or Record.
2. Strela analyses the video on your device and places focus points.
3. After successful import analysis, an MP4 is rendered and downloaded as "<project> - Strela.mp4". For a new recording, review the focus and choose Export video. If analysis fails, retry it or export the complete frame.

WHAT YOU GET
• Smooth transitions before and after detected focus points, with direct pans between nearby points
• Zoom that fits the changed area: close on small controls, wider on large panels
• Phone layout at 1206×2622, plus landscape, portrait and square
• Optional speed-up for pauses where nothing on screen changes
• Timeline to split, trim and remove parts
• MP4, WebM or short GIF, with Best, Balanced or Small file size
• Local projects with autosave and .strela backups
• Editable focus time, hold and zoom; a protected source area and original-pace intervals
• Graphite panels, red accents and grouped video settings

GOOD TO KNOW
• Visual analysis does not read text or guarantee cursor recognition; browser-tab recordings can also use recorded click cues. Review the focus before publishing. Select a focus point to edit it or use Move in preview; click the paused preview to add a point.
• Small text needs a sharp source recording.
• Local studio checks have been performed in Chrome on macOS. Installed-extension workflows, Edge, Windows and physical-phone playback still need qualification. See the dated QA report for exact coverage.

Free experimental beta with a public source repository: https://github.com/senamh/strela-screen . Public source access is not an open-source license grant for Strela's original code. Bundled third-party libraries retain their own licenses.

### Description (Russian, optional second language)

Strela Screen создаёт редактируемый вертикальный ролик из записи экрана компьютера с автоматическим анализом изменений изображения и локальным экспортом.

Импортируйте готовую запись или запишите экран, окно или вкладку браузера. По локальным изменениям изображения расставляются редактируемые точки фокуса. В формате телефона сверху показан весь экран, снизу увеличенная область на чёрном фоне. Если надёжные точки фокуса не найдены, исходный кадр сохраняется полностью. Обработка выполняется в браузере, видео никуда не загружается.

КАК ЭТО РАБОТАЕТ
1. Откройте студию из панели браузера и нажмите Import или Record.
2. Видео анализируется на вашем компьютере, точки фокуса расставляются автоматически.
3. После успешного анализа импортированного видео создаётся MP4 под именем «имя проекта - Strela.mp4» и начинается скачивание. После новой записи проверьте фокус и нажмите Export video. При ошибке анализа повторите его или экспортируйте полный кадр.

ВОЗМОЖНОСТИ
• Плавные переходы до и после найденных точек фокуса, прямое перемещение между близкими точками
• Масштаб зависит от размера изменившейся области
• Вертикальный формат 1206×2622, а также горизонтальный, портретный и квадратный
• Ускорение пауз, в которых изображение не меняется, включается по желанию
• Таймлайн для разрезки, обрезки и удаления фрагментов
• MP4, WebM или короткий GIF с выбором размера файла
• Локальные проекты с автосохранением и резервными копиями .strela
• Настройка времени, удержания и масштаба каждой точки, защита выбранной области и интервалов чтения
• Графитовые панели, красные акценты и группировка настроек

ОГРАНИЧЕНИЯ
• Анализ изображения не распознаёт текст и не гарантирует обнаружение курсора. В записях вкладки также могут использоваться сохранённые координаты кликов. Перед публикацией проверьте результат. Выберите точку для редактирования или переноса через Move in preview; щелчок по остановленному видео добавляет новую точку.
• Для мелкого текста нужна чёткая исходная запись.
• Локальная студия проверялась в Chrome на macOS. Работа установленного расширения, Edge, Windows и воспроизведение на физическом смартфоне требуют отдельной проверки. Даты и объём проверок приведены в QA.md.

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

1. The account owner must complete developer registration and any required payment in the official store console. Check current terms before submitting.
2. Add item → upload the store ZIP.
3. Fill the Store listing and Privacy practices tabs from this file, add the images.
4. Distribution: Public, all regions. Submit for review.
