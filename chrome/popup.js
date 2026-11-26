const api = globalThis.browser || globalThis.chrome;
const $ = (id) => document.getElementById(id);

const describe = (n) => {
  if (n === null) return "Not glittering this page yet";
  if (n === 0) return "✦ Nothing to glitter on this page";
  return `✦ ${n} ${n === 1 ? "word" : "words"} glittered on this page`;
};

async function activeTab() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshCount() {
  const tab = await activeTab();
  if (!tab) return;
  try {
    const res = await api.tabs.sendMessage(tab.id, { type: "glitterific-get-count" });
    $("count").textContent = res && res.enabled === false ? "Glitter is off" : describe(res ? res.count : 0);
  } catch (e) {
    $("count").textContent = describe(null);
  }
}

async function glitterThisPage() {
  const tab = await activeTab();
  if (!tab) return;
  const btn = $("glitterPage");
  btn.disabled = true;
  try {
    await api.storage.sync.set({ enabled: true });
    $("enabled").checked = true;
    await api.scripting.insertCSS({ target: { tabId: tab.id }, files: ["glitter.css"] });
    await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["wordlist.js", "content.js"] });
    setTimeout(refreshCount, 400);
  } catch (e) {
    $("count").textContent = "Your browser doesn't let extensions glitter this page";
  } finally {
    btn.disabled = false;
  }
}

api.storage.sync.get({ enabled: true, showOriginals: false }).then((saved) => {
  $("enabled").checked = saved.enabled !== false;
  $("showOriginals").checked = !!saved.showOriginals;
});

$("enabled").addEventListener("change", (e) => {
  api.storage.sync.set({ enabled: e.target.checked });
  setTimeout(refreshCount, 300);
});

$("showOriginals").addEventListener("change", (e) => {
  api.storage.sync.set({ showOriginals: e.target.checked });
});

$("glitterPage").addEventListener("click", glitterThisPage);

refreshCount();
