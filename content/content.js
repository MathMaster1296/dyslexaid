/* ============================================================
   DyslexAid — content script.
   Runs inside every page. Three jobs:
     1. On load, read saved settings and apply them.
     2. Listen for toggle messages from the popup.
     3. Implement the two features CSS can't do alone:
        bionic reading (rewrites text) and the ruler (follows mouse).
   ============================================================ */

const FEATURES = ["font", "spacing", "bionic", "ruler", "tint"];
const root = document.documentElement;

/* ---------- applying a setting ----------
   For most features this is literally one attribute flip;
   the CSS file keyed to these attributes does the rest. */
function applySetting(feature, on) {
  if (on) {
    root.setAttribute(`data-dyslexaid-${feature}`, "on");
  } else {
    root.removeAttribute(`data-dyslexaid-${feature}`);
  }

  // Features with a JS component:
  if (feature === "bionic" && on) ensureBionic();
  if (feature === "ruler") on ? startRuler() : stopRuler();
}

/* ---------- load saved settings on page load ---------- */
chrome.storage.sync.get(FEATURES, (saved) => {
  for (const f of FEATURES) {
    if (saved[f]) applySetting(f, true);
  }
});

/* ---------- listen for the popup's toggle messages ---------- */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "toggle" && FEATURES.includes(msg.feature)) {
    applySetting(msg.feature, msg.on);
    sendResponse({ ok: true });
  }
});

/* ============================================================
   Bionic reading.
   Walk every text node in the page's readable areas and wrap
   the first ~40% of each word in <b class="dyslexaid-bionic">.
   We do it once and leave the wrappers in place — toggling off
   just un-bolds them via CSS, so re-enabling is instant.
   ============================================================ */
let bionicDone = false;

// Elements whose text we must never rewrite.
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT",
  "CODE", "PRE", "KBD", "SAMP", "B", "SVG", "CANVAS", "BUTTON",
]);

function ensureBionic() {
  if (bionicDone) return;
  bionicDone = true;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        // Reject if any ancestor is a skip tag or is editable.
        for (let el = node.parentElement; el; el = el.parentElement) {
          if (SKIP_TAGS.has(el.tagName) || el.isContentEditable) {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  // Collect first: mutating while walking confuses the TreeWalker.
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const node of textNodes) {
    const frag = document.createDocumentFragment();
    // Split into words and the whitespace between them, keeping both.
    for (const part of node.nodeValue.split(/(\s+)/)) {
      if (!part.trim() || part.length < 2) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      // Bold the first ~40% of the word (at least 1 letter).
      const cut = Math.max(1, Math.ceil(part.length * 0.4));
      const b = document.createElement("b");
      b.className = "dyslexaid-bionic";
      b.textContent = part.slice(0, cut);
      frag.appendChild(b);
      frag.appendChild(document.createTextNode(part.slice(cut)));
    }
    node.parentNode.replaceChild(frag, node);
  }
}

/* ============================================================
   Reading ruler.
   One fixed-position band, moved to track the cursor's Y.
   ============================================================ */
let rulerEl = null;

function moveRuler(e) {
  if (rulerEl) rulerEl.style.top = e.clientY - rulerEl.offsetHeight / 2 + "px";
}

function startRuler() {
  if (!rulerEl) {
    rulerEl = document.createElement("div");
    rulerEl.id = "dyslexaid-ruler";
    document.body.appendChild(rulerEl);
  }
  document.addEventListener("mousemove", moveRuler, { passive: true });
}

function stopRuler() {
  document.removeEventListener("mousemove", moveRuler);
}
