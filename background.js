/* ============================================================
   DyslexAid service worker.
   Turns keyboard shortcuts into settings flips, which every tab
   picks up from storage. Read aloud is the exception: it happens
   once, so it is sent to the active tab as a message.
   ============================================================ */

const COMMAND_TO_FEATURE = {
  "toggle-ruler": "ruler",
  "toggle-bionic": "bionic",
};

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "read-aloud") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "speak" }).catch(() => {});
    }
    return;
  }
  const feature = COMMAND_TO_FEATURE[command];
  if (!feature) return;
  const saved = await chrome.storage.sync.get(feature);
  await chrome.storage.sync.set({ [feature]: !saved[feature] });
});
