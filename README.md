# DyslexAid: Reading Assistant

A Chrome extension that makes any web page easier to read for people with
dyslexia, ADHD, low vision, or motion sensitivity. Click the toolbar icon and
flip on any mix of:

| Feature | What it does |
|---|---|
| 🔤 **Friendly font** | Swaps in [OpenDyslexic](https://opendyslexic.org), whose weighted letter-bottoms resist flipping, and widens letter and word spacing |
| 📏 **Comfy spacing** | Raises line height, adds paragraph breathing room, and caps line length around 70 characters |
| ⚡ **Bionic reading** | Bolds the first ~40% of every word so the eye anchors and glides. Works on infinite-scroll feeds too |
| 🖍️ **Reading ruler** | Puts a soft highlight band under your cursor so you never lose your line |
| 🌅 **Warm tint** | Turns the background cream and adds gentle sepia to cut white-screen glare |
| 🧘 **Calm mode** | Freezes animations, transitions, and motion on the page |
| 🔍 **Text size** | Zooms the whole page from 100% to 160% |
| 🌐 **Per-site pause** | Turns everything off for one site without losing your settings |

Keyboard shortcuts: **Alt+Shift+R** toggles the ruler and **Alt+Shift+B**
toggles bionic reading. Both can be changed at `chrome://extensions/shortcuts`.

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

Settings live in one place: `chrome.storage.sync`. The popup and the
keyboard-shortcut service worker only write to it, and the content script in
every open tab listens for changes with `chrome.storage.onChanged` and applies
them. There is no custom message routing, and every tab stays in sync,
including tabs that were already open.

Each visual feature is a CSS attribute toggle. The content script flips an
attribute on `<html>` (for example `data-dyslexaid-font="on"`) and the
stylesheet rules keyed to that attribute do the actual restyling, so turning a
feature on or off costs a single DOM write.

Bionic reading is the one feature that rewrites the page. A `TreeWalker`
visits only text nodes, skips code blocks, form fields, and editable regions,
and wraps the start of each word in `<b class="dyslexaid-bionic">`. A
debounced `MutationObserver` catches content added after page load, which is
what makes the feature work on infinite-scroll feeds and comment sections.
When you toggle it off, the wrappers stay in the DOM and CSS renders them at
normal weight, so turning it back on is instant.

A few smaller details: the warm tint measures the page's background luminance
and leaves dark-themed pages alone, since sepia over near-black just looks muddy; every
popup control can be reached with Tab and toggled with Space, with visible
focus rings; and the extension asks for only three permissions (`storage`,
`activeTab`, and `scripting`).

## Privacy

DyslexAid collects nothing. It has no analytics and makes no network
requests; your settings are stored in Chrome's own sync storage and never
leave your browser.

## Structure

```
dyslexaid/
├── manifest.json        # Manifest V3 config, keyboard commands
├── background.js        # Service worker: shortcuts write settings flips
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

[MIT](LICENSE) for the extension code. The bundled font keeps its own SIL OFL
license.
