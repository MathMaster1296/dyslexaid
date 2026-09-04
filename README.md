# DyslexAid: Reading Assistant

A Chrome extension that makes any web page easier to read for people with
dyslexia, ADHD, low vision, or motion sensitivity. Click the toolbar icon and
flip on any mix of:

| Feature | What it does |
|---|---|
| **Friendly font** | Swaps in [OpenDyslexic](https://opendyslexic.org), whose weighted letter-bottoms resist flipping, and widens letter and word spacing |
| **Comfy spacing** | Raises line height, adds paragraph breathing room, and caps line length around 70 characters |
| **Bionic reading** | Bolds the first ~40% of every word so the eye anchors and glides. Works on infinite-scroll feeds too |
| **Reading ruler** | Puts a soft highlight band under your cursor so you never lose your line |
| **Warm tint** | Turns the background cream and adds gentle sepia to cut white-screen glare |
| **Calm mode** | Freezes animations, transitions, and motion on the page |
| **Text size** | Zooms the whole page from 100% to 160% |
| **Per-site pause** | Turns everything off for one site without losing your settings |

Keyboard shortcuts: **Alt+Shift+R** toggles the ruler, **Alt+Shift+B**
toggles bionic reading, and **Alt+Shift+S** starts or stops read aloud. All
three can be changed at `chrome://extensions/shortcuts`.

The Settings link in the popup opens a page for the finer knobs: bionic
boldness, tint color (cream, blue, yellow, or green), ruler height,
read-aloud speed, and the list of paused sites.

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

Read aloud uses the browser's built-in speech synthesis, so the audio is
generated on your machine and no text goes anywhere. It is also the one
place the extension uses a message instead of a setting: reading aloud is a
command to act now, not a state to remember, so the popup or the shortcut
sends `{type: "speak"}` to the active tab and the content script speaks or
stops.

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
