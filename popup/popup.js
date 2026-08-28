/* ============================================================
   DyslexAid — popup logic.
   1. On open: read saved settings, set each checkbox to match.
   2. On toggle: save the new value, and tell the current tab's
      content script to apply it immediately.
   ============================================================ */

const checkboxes = document.querySelectorAll("input[data-feature]");

// 1. Reflect saved state in the UI.
const features = [...checkboxes].map((cb) => cb.dataset.feature);
chrome.storage.sync.get(features, (saved) => {
  for (const cb of checkboxes) {
    cb.checked = Boolean(saved[cb.dataset.feature]);
  }
});

// 2. On change: persist + apply live.
for (const cb of checkboxes) {
  cb.addEventListener("change", async () => {
    const feature = cb.dataset.feature;
    const on = cb.checked;

    // Persist (storage.sync also syncs across the user's Chromes).
    chrome.storage.sync.set({ [feature]: on });

    // Tell the active tab to apply it right now.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs
        .sendMessage(tab.id, { type: "toggle", feature, on })
        .catch(() => {
          /* Page without our content script (e.g. chrome:// pages) — fine,
             the setting is saved and will apply on normal pages. */
        });
    }
  });
}
