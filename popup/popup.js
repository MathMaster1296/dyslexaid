/* ============================================================
   DyslexAid popup logic.
   The popup reads settings to draw itself, and every control just
   writes to storage. Content scripts in all open tabs pick the change
   up via chrome.storage.onChanged, so storage stays the only source
   of truth. The one exception is read aloud, which is sent as a
   message because it is a one-time action.
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const checkboxes = document.querySelectorAll("input[data-feature]");

const ZOOM_MIN = 100;
const ZOOM_MAX = 160;
const ZOOM_STEP = 10;

let host = null; // hostname of the current tab, if it's a normal web page

/* ---------- render UI from saved settings ---------- */
async function render() {
  const s = await chrome.storage.sync.get(null);

  for (const cb of checkboxes) {
    cb.checked = Boolean(s[cb.dataset.feature]);
  }
  document.documentElement.toggleAttribute("data-font", Boolean(s.font));
  $("#zoom-value").textContent = (s.textZoom || 100) + "%";

  if (host) {
    $("#site-row").hidden = false;
    $("#site-host").textContent = host;
    $("#site-toggle").checked = !(s.pausedSites || []).includes(host);
  }
}

/* ---------- wire up controls ---------- */
for (const cb of checkboxes) {
  cb.addEventListener("change", () => {
    chrome.storage.sync.set({ [cb.dataset.feature]: cb.checked });
  });
}

async function nudgeZoom(delta) {
  const { textZoom = 100 } = await chrome.storage.sync.get("textZoom");
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, textZoom + delta));
  chrome.storage.sync.set({ textZoom: next });
}
$("#zoom-down").addEventListener("click", () => nudgeZoom(-ZOOM_STEP));
$("#zoom-up").addEventListener("click", () => nudgeZoom(ZOOM_STEP));

$("#site-toggle").addEventListener("change", async (e) => {
  const { pausedSites = [] } = await chrome.storage.sync.get("pausedSites");
  const next = e.target.checked
    ? pausedSites.filter((h) => h !== host) // enabled -> unpause
    : [...new Set([...pausedSites, host])]; // disabled -> pause
  chrome.storage.sync.set({ pausedSites: next });
});

/* Reset wipes every setting, including the options page and the
   paused-site list, so it asks for a second click. The armed state
   times out after a few seconds. */
let resetTimer = null;
$("#reset").addEventListener("click", () => {
  if (resetTimer) {
    clearTimeout(resetTimer);
    resetTimer = null;
    $("#reset").textContent = "Reset all";
    chrome.storage.sync.clear();
    return;
  }
  $("#reset").textContent = "Click again to confirm";
  resetTimer = setTimeout(() => {
    resetTimer = null;
    $("#reset").textContent = "Reset all";
  }, 4000);
});

$("#options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

$("#shortcuts").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

/* Read aloud happens once and is over, so there is nothing to store;
   it goes to the page as a message. Closing the popup lets the user
   watch the page. */
$("#speak").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "speak" }).catch(() => {});
  }
  window.close();
});

/* ---------- init ---------- */
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab.url);
    if (url.protocol === "http:" || url.protocol === "https:") {
      host = url.hostname;
    }
  } catch {
    /* chrome:// pages and the like get no site row */
  }
  render();
  // Keep the popup live if settings change while it's open
  // (e.g. a keyboard shortcut or reset).
  chrome.storage.onChanged.addListener(render);
})();
