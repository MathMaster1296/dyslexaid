/* ============================================================
   DyslexAid content script.
   Runs inside every page.

   Architecture: chrome.storage.sync is the single source of
   truth. The popup and the keyboard-shortcut service worker
   only WRITE settings; this script listens for storage changes
   and applies them. No custom messaging needed, and every open
   tab stays in sync automatically.
   ============================================================ */

const FEATURES = ["font", "spacing", "bionic", "ruler", "tint", "calm"];
const root = document.documentElement;
const HOST = location.hostname;

/* ---------- applying settings ----------
   Most features are one attribute flip; content.css does the
   rest. Bionic and the ruler have JS components. */
function applySetting(feature, on) {
  if (on) {
    root.setAttribute(`data-dyslexaid-${feature}`, "on");
  } else {
    root.removeAttribute(`data-dyslexaid-${feature}`);
  }
  if (feature === "bionic") on ? startBionic() : stopBionic();
  if (feature === "ruler") on ? startRuler() : stopRuler();
}

/* Warm tint looks broken on dark-themed sites (sepia over near-black),
   so detect a dark page background and skip tint there. */
function pageIsDark() {
  for (const el of [document.body, document.documentElement]) {
    if (!el) continue;
    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) continue;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) continue; // transparent
    const luminance = 0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3];
    return luminance < 110;
  }
  return false; // no opaque background found, assume light
}

function applyAll(s) {
  // Per-site pause: if this hostname is paused, everything off.
  const paused = (s.pausedSites || []).includes(HOST);
  for (const f of FEATURES) {
    let on = !paused && Boolean(s[f]);
    if (f === "tint" && on && pageIsDark()) on = false;
    applySetting(f, on);
  }

  // Text zoom (Chrome supports the zoom property natively).
  const zoom = paused ? 100 : s.textZoom || 100;
  if (document.body) {
    document.body.style.zoom = zoom === 100 ? "" : String(zoom / 100);
  }
}

function refresh() {
  chrome.storage.sync.get(null, applyAll);
}

refresh(); // apply saved settings on page load
chrome.storage.onChanged.addListener(refresh); // react to popup/shortcuts

/* ============================================================
   Bionic reading.
   Wrap the first ~40% of each word in <b class="dyslexaid-bionic">.
   A TreeWalker visits only text nodes, skipping anything unsafe
   to rewrite. A MutationObserver catches content added after
   page load (infinite scroll, comments, SPAs).
   Wrappers stay in the DOM when toggled off (CSS un-bolds them),
   so re-enabling is instant.
   ============================================================ */
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT",
  "CODE", "PRE", "KBD", "SAMP", "B", "SVG", "CANVAS", "BUTTON",
]);

let observer = null;
let pendingNodes = new Set();
let processTimer = null;
let selfMutating = false; // our own DOM edits must not re-trigger us

function bionicize(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let el = node.parentElement; el; el = el.parentElement) {
        if (SKIP_TAGS.has(el.tagName) || el.isContentEditable) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Collect first: mutating while walking confuses the TreeWalker.
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  selfMutating = true;
  for (const node of textNodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\s+)/)) {
      if (!part.trim() || part.length < 2) {
        frag.appendChild(document.createTextNode(part));
        continue;
      }
      const cut = Math.max(1, Math.ceil(part.length * 0.4));
      const b = document.createElement("b");
      b.className = "dyslexaid-bionic";
      b.textContent = part.slice(0, cut);
      frag.appendChild(b);
      frag.appendChild(document.createTextNode(part.slice(cut)));
    }
    node.parentNode.replaceChild(frag, node);
  }
  selfMutating = false;
}

function startBionic() {
  bionicize(document.body);
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (selfMutating) return;
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === Node.ELEMENT_NODE && n.id !== "dyslexaid-ruler") {
          pendingNodes.add(n);
        }
      }
    }
    // Debounce: process new content in batches, not per-mutation.
    clearTimeout(processTimer);
    processTimer = setTimeout(() => {
      const batch = [...pendingNodes];
      pendingNodes.clear();
      for (const node of batch) {
        if (node.isConnected) bionicize(node);
      }
    }, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopBionic() {
  // CSS already un-bolds existing wrappers; just stop watching.
  observer?.disconnect();
  observer = null;
  pendingNodes.clear();
}

/* ============================================================
   Reading ruler: a fixed band that follows the cursor.
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
