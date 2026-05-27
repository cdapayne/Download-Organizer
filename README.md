# Download Organizer — Chrome Extension

> **Organize downloads as you make them.**  
> When a download starts you're asked to pick (or create) a category.  
> The file is automatically saved to `Downloads/<category>/<filename>` — no manual sorting needed.

---

## Features

- 📁 **Category prompt on every download** — a small dialog appears the moment Chrome starts a download.
- ✏️ **Create categories on the fly** — type a new name directly in the dialog; it's saved for next time.
- 🗂️ **Toolbar popup** — quick view / add / remove categories without opening Settings.
- ⚙️ **Options page** — full management table, toggle "always ask", and set a pre-selected default category.
- 🔄 **Synced storage** — categories sync across your Chrome profiles via `chrome.storage.sync`.

---

## How it works

Chrome's `downloads.onDeterminingFilename` API lets extensions intercept a download *before* the filename is finalised.  
This extension:

1. Catches that event and **opens a popup dialog** (`dialog.html`).
2. You **select an existing category** or **type a new one**.
3. Clicking **Save to Category** tells Chrome to write the file to `Downloads/<category>/<filename>`, creating the sub-folder automatically if needed.
4. Clicking **Skip** lets the file go to your default Downloads location unchanged.

---

## Installation (Developer / Unpacked)

Chrome Web Store submission is separate. To load the extension locally:

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `Download-Organizer` folder.
5. The 📁 icon will appear in your toolbar.

---

## File structure

```
Download-Organizer/
├── manifest.json      # Manifest V3 extension config
├── background.js      # Service worker — intercepts downloads
├── dialog.html        # Category-selection popup (shown on download)
├── dialog.js
├── popup.html         # Toolbar popup — manage categories
├── popup.js
├── options.html       # Full settings / options page
├── options.js
├── styles.css         # Shared stylesheet
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions used

| Permission | Why it's needed |
|------------|-----------------|
| `downloads` | Intercept downloads and suggest a save path |
| `storage` | Persist your category list across sessions |
| `windows` | Open the category-selection dialog window |

---

## Development

No build step required — it's plain HTML/CSS/JS.

1. Edit any source file.
2. Go to `chrome://extensions` → click **↺ Reload** on the extension card.
3. Test by starting any download in Chrome.

