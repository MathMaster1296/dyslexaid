/* ============================================================
   DyslexAid service worker.
   Turns keyboard shortcuts into either a settings flip (feature
   toggles, which every tab picks up from storage) or a message
   to the active tab (read aloud, which is an action rather than
   a state).
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
