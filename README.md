# DyslexAid — Reading Assistant

A Chrome extension that makes any web page easier to read for people with
dyslexia, ADHD, low vision, or motion sensitivity. Click the toolbar icon and
flip on any mix of:

| Feature | What it does |
|---|---|
| 🔤 **Friendly font** | [OpenDyslexic](https://opendyslexic.org) — weighted letter-bottoms that resist flipping/mirroring — with wider letter & word spacing |
| 📏 **Comfy spacing** | Taller line height, paragraph breathing room, capped line length (~70ch) |
| ⚡ **Bionic reading** | Bolds the first ~40% of every word so the eye anchors and glides — works on infinite-scroll feeds too |
| 🖍️ **Reading ruler** | A soft highlight band follows your cursor so you never lose your line |
| 🌅 **Warm tint** | Cream background + gentle sepia to cut white-screen glare |
| 🧘 **Calm mode** | Freezes animations, transitions, and motion on the page |
| 🔍 **Text size** | Zoom the whole page 100–160% |
| 🌐 **Per-site pause** | Turn everything off for one site without losing your settings |

Keyboard shortcuts: **Alt+Shift+R** toggles the ruler, **Alt+Shift+B** toggles
bionic reading (customizable at `chrome://extensions/shortcuts`).

Settings are saved with `chrome.storage.sync`, so they persist across pages,
restarts, and your other Chrome installs.

## Install (developer mode)

1. Open `chrome://extensions` in Chrome
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Pin "DyslexAid" from the puzzle-piece menu and open any article

Try it on [demo/demo.html](demo/demo.html) (enable "Allow access to file URLs"
on the extension card, or just use any Wikipedia article).

## How it works

- **Storage as the single source of truth.** The popup and the
  keyboard-shortcut service worker only *write* to `chrome.storage.sync`;
  content scripts in every open tab listen via `chrome.storage.onChanged` and
  apply changes. No custom message routing, and all tabs stay in sync live.
- **CSS-first toggles.** Each feature is keyed to an attribute on `<html>`
  (e.g. `data-dyslexaid-font="on"`). The content script flips attributes;
  stylesheet rules do the actual restyling. Toggling is O(1).
- **Bionic reading** uses a `TreeWalker` to visit only text nodes — skipping
  code blocks, form fields, and editable regions — and wraps word-starts in
  `<b class="dyslexaid-bionic">`. A debounced `MutationObserver` processes
  content added after page load (infinite scroll, SPAs, comment sections).
  Wrappers stay in the DOM when toggled off (CSS renders them at normal
  weight), so re-enabling is instant.
- **Smart tint:** the warm tint detects dark-themed pages (background
  luminance check) and skips them rather than sepia-toning a black page.
- **Keyboard accessible:** every popup control is focusable and operable
  with Tab + Space, with visible focus rings.
- **Minimal permissions:** just `storage`, `activeTab`, and `scripting`.

## Privacy

DyslexAid collects nothing. No analytics, no network requests, no data ever
leaves your browser. Settings live in your own Chrome sync storage.

## Structure

```
dyslexaid/
├── manifest.json        # Manifest V3 config, keyboard commands
├── background.js        # Service worker: shortcuts → settings flips
├── popup/               # Toolbar popup UI
├── content/
│   ├── content.js       # Applies settings; bionic rewriter; ruler
│   └── content.css      # All feature styles, attribute-keyed
├── icons/
└── demo/demo.html       # A page to try every feature on
```

## Credits

Bundles the [OpenDyslexic](https://github.com/antijingoist/opendyslexic)
typeface by Abbie Gonzalez, used under the SIL Open Font License
([fonts/OFL.txt](fonts/OFL.txt)).

## License

[MIT](LICENSE) for the extension code; the bundled font keeps its own
SIL OFL license.
