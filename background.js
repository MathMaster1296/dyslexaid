/* ============================================================
   DyslexAid service worker.
   One job: turn keyboard shortcuts into settings flips.
   It only writes to chrome.storage; content scripts in every
   open tab react to the change on their own.
   ============================================================ */

const COMMAND_TO_FEATURE = {
  "toggle-ruler": "ruler",
  "toggle-bionic": "bionic",
};

chrome.commands.onCommand.addListener(async (command) => {
  const feature = COMMAND_TO_FEATURE[command];
  if (!feature) return;
  const saved = await chrome.storage.sync.get(feature);
  await chrome.storage.sync.set({ [feature]: !saved[feature] });
});
