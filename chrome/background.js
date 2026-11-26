const api = globalThis.browser || globalThis.chrome;

// Shows how many words Glitterific swapped on the current tab, on its icon.

api.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "glitterific-count" || !sender.tab) return;
  const tabId = sender.tab.id;
  const n = msg.count || 0;
  const text = n === 0 ? "" : n > 999 ? "999+" : String(n);
  api.action.setBadgeText({ tabId, text });
  api.action.setBadgeBackgroundColor({ tabId, color: "#C2378F" });
  if (api.action.setBadgeTextColor) {
    api.action.setBadgeTextColor({ tabId, color: "#FFFFFF" });
  }
});
