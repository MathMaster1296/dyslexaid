# DyslexAid — Reading Assistant

A Chrome extension that makes any web page easier to read for people with
dyslexia, ADHD, or low vision. Click the toolbar icon and flip on any mix of:

| Feature | What it does |
|---|---|
| 🔤 **Friendly font** | Swaps the page to rounded, distinct letterforms with wider letter & word spacing |
| 📏 **Comfy spacing** | Taller line height, more paragraph breathing room, capped line length (~70ch) |
| ⚡ **Bionic reading** | Bolds the first ~40% of every word so the eye anchors and glides |
| 🖍️ **Reading ruler** | A soft highlight band follows your cursor so you never lose your line |
| 🌅 **Warm tint** | Cream background + gentle sepia to cut white-screen glare |

Settings are saved with `chrome.storage.sync`, so they persist across pages,
restarts, and (if signed in) your other Chrome installs.

## Install (developer mode)

1. Open `chrome://extensions` in Chrome
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Pin "DyslexAid" from the puzzle-piece menu, open any article, and toggle away

## How it works

- **CSS-first toggles.** Each feature is keyed to an attribute on `<html>`
  (e.g. `data-readable-font="on"`). The content script flips attributes;
  stylesheet rules do the actual restyling. Toggling is O(1).
- **Bionic reading** uses a `TreeWalker` to visit only text nodes, skipping
  code blocks, form fields, and editable regions, and wraps word-starts in
  `<b class="readable-bionic">`. Wrappers stay in the DOM when toggled off
  (rendered at normal weight by CSS), so re-enabling is instant.
- **Popup ↔ page messaging** via `chrome.runtime.sendMessage`, with settings
  persisted to `chrome.storage.sync` and re-applied on every page load.
- **Minimal permissions:** just `storage`, `activeTab`, and `scripting`.

## Structure

```
dyslexaid/
├── manifest.json        # Manifest V3 config
├── popup/               # Toolbar popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/             # Injected into every page
│   ├── content.js       # Applies settings, bionic rewriter, ruler
│   └── content.css      # All feature styles, attribute-keyed
└── icons/
```
