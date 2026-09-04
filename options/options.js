/* ============================================================
   DyslexAid options page.
   Same rule as the popup: read settings to draw the page, write
   settings when a control changes, and let storage.onChanged
   keep everything else in sync.
   ============================================================ */

const $ = (sel) => document.querySelector(sel);

async function render() {
  const s = await chrome.storage.sync.get(null);

  const strength = String(s.bionicStrength || 0.4);
  for (const r of document.querySelectorAll('input[name="strength"]')) {
    r.checked = r.value === strength;
  }
  const tint = s.tintColor || "cream";
  for (const r of document.querySelectorAll('input[name="tint"]')) {
    r.checked = r.value === tint;
  }

  const rulerHeight = s.rulerHeight || 42;
  $("#ruler-height").value = rulerHeight;
  $("#ruler-height-value").textContent = rulerHeight + " px";

  const rate = s.ttsRate || 1;
  $("#tts-rate").value = rate;
  $("#tts-rate-value").textContent = rate.toFixed(1) + "×";

  const paused = s.pausedSites || [];
  const list = $("#paused-list");
  list.textContent = "";
  for (const host of paused) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = host;
    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      const { pausedSites = [] } = await chrome.storage.sync.get("pausedSites");
      chrome.storage.sync.set({ pausedSites: pausedSites.filter((h) => h !== host) });
    });
    li.append(name, remove);
    list.appendChild(li);
  }
  $("#paused-empty").hidden = paused.length > 0;
}

for (const r of document.querySelectorAll('input[name="strength"]')) {
  r.addEventListener("change", () => {
    chrome.storage.sync.set({ bionicStrength: parseFloat(r.value) });
  });
}
for (const r of document.querySelectorAll('input[name="tint"]')) {
  r.addEventListener("change", () => {
    chrome.storage.sync.set({ tintColor: r.value });
  });
}

/* Sliders update their label live on input but only write to
   storage on release, to stay under sync-storage write limits. */
$("#ruler-height").addEventListener("input", (e) => {
  $("#ruler-height-value").textContent = e.target.value + " px";
});
$("#ruler-height").addEventListener("change", (e) => {
  chrome.storage.sync.set({ rulerHeight: parseInt(e.target.value, 10) });
});
$("#tts-rate").addEventListener("input", (e) => {
  $("#tts-rate-value").textContent = parseFloat(e.target.value).toFixed(1) + "×";
});
$("#tts-rate").addEventListener("change", (e) => {
  chrome.storage.sync.set({ ttsRate: parseFloat(e.target.value) });
});

render();
chrome.storage.onChanged.addListener(render);
