// Glitterific content script: swaps hostile words for glittery ones in the
// page you're reading. Everything happens inside your browser. Nothing you
// read is stored or sent anywhere.

(() => {
  // If we're already running on this page (for example, someone clicked
  // "Glitter this page" in Gmail), just rescan.
  if (self.__glitterific) {
    self.__glitterific.rescan();
    return;
  }

  const DATA = self.GLITTERIFIC_DATA;
  if (!DATA) return;

  // Firefox calls the extension API "browser", Chrome calls it "chrome".
  const api = globalThis.browser || globalThis.chrome;

  const HELP_URL = "https://righttobe.org/guides/responding-to-online-harassment/";

  // Message bodies in Gmail and Outlook. A threat anywhere in one of these
  // leaves the whole message untouched.
  const MESSAGE_SELECTORS = [
    "div.a3s",                           // Gmail message body
    "div[aria-label='Message body']",    // Outlook reading pane
    "div[id^='UniqueMessageBody']",      // Outlook message body
    "[data-glitterific-message]"         // test pages
  ].join(",");

  const SKIP_SELECTORS = [
    "script", "style", "noscript", "textarea", "input", "select", "option",
    "code", "pre", "svg", "[contenteditable='']", "[contenteditable='true']",
    "[contenteditable='plaintext-only']", "[role='textbox']",
    ".glitterific-word", ".glitterific-flag"
  ].join(",");

  const BLOCK_SELECTORS = "p,div,li,td,blockquote,article,section,h1,h2,h3,h4,h5,h6";

  // ---------- Build the matcher ----------

  const normalize = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const lookup = new Map();
  for (const [bad, good] of Object.entries(DATA.WORDS)) lookup.set(normalize(bad), good);

  const keys = [...lookup.keys()].sort((a, b) => b.length - a.length);
  const pattern = keys
    .map((k) => escapeRe(k).replace(/'/g, "['’]").replace(/ /g, "\\s+"))
    .join("|");
  const wordRe = new RegExp("(?<![\\p{L}\\p{N}_])(" + pattern + ")(?![\\p{L}\\p{N}_])", "giu");
  const threatRes = DATA.THREATS.map((t) => new RegExp(t, "i"));

  const matchCase = (original, replacement) => {
    const letters = original.replace(/[^\p{L}]/gu, "");
    if (letters.length > 1 && letters === letters.toUpperCase()) return replacement.toUpperCase();
    if (letters && letters[0] === letters[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  };

  const looksThreatening = (text) => {
    const t = text.replace(/[‘’]/g, "'");
    return threatRes.some((re) => re.test(t));
  };

  // ---------- State ----------

  const state = { enabled: true, showOriginals: false };
  let processed = new WeakSet();
  let count = 0;

  // ---------- Helpers ----------

  const shouldSkip = (el) => !el || el.isContentEditable || !!el.closest(SKIP_SELECTORS);

  const scopeFor = (el) => {
    const message = el.closest(MESSAGE_SELECTORS);
    if (message) return { el: message, isMessage: true };
    return { el: el.closest(BLOCK_SELECTORS) || el, isMessage: false };
  };

  const reportCount = (() => {
    let timer = null;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const sent = api.runtime.sendMessage({ type: "glitterific-count", count: state.enabled ? count : 0 });
          if (sent && sent.catch) sent.catch(() => {});
        } catch (e) {
          // The extension was reloaded or removed; nothing to report to.
        }
      }, 250);
    };
  })();

  const unwrap = (span, keepPlain) => {
    const text = document.createTextNode(span.dataset.original || span.textContent);
    if (keepPlain) processed.add(text);
    span.replaceWith(text);
    return text;
  };

  const flagMessage = (message) => {
    // Put back anything we already glittered in this message.
    const spans = message.querySelectorAll(".glitterific-word");
    count = Math.max(0, count - spans.length);
    spans.forEach((span) => unwrap(span, true));
    if (message.querySelector(":scope > .glitterific-flag")) return;

    const note = document.createElement("div");
    note.className = "glitterific-flag";
    note.setAttribute("role", "note");
    const star = document.createElement("span");
    star.className = "glitterific-flag-star";
    star.textContent = "✦";
    const text = document.createElement("span");
    text.textContent =
      "Glitterific left this message as it was sent, because it may contain a threat. " +
      "Consider saving a copy and reporting it. ";
    const link = document.createElement("a");
    link.href = HELP_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Right To Be's guide to responding to online harassment";
    note.append(star, text, link);
    message.prepend(note);
  };

  // ---------- The swap ----------

  const glitterTextNode = (node) => {
    if (processed.has(node)) return;
    processed.add(node);
    const text = node.nodeValue;
    if (!text || !text.trim()) return;
    const parent = node.parentElement;
    if (shouldSkip(parent)) return;

    wordRe.lastIndex = 0;
    if (!wordRe.test(text)) return;

    const scope = scopeFor(parent);
    if (looksThreatening(scope.el.textContent || "")) {
      if (scope.isMessage) flagMessage(scope.el);
      return;
    }

    const frag = document.createDocumentFragment();
    let last = 0;
    let swaps = 0;
    wordRe.lastIndex = 0;
    for (const m of text.matchAll(wordRe)) {
      const original = m[0];
      const replacement = lookup.get(normalize(original));
      if (!replacement) continue;
      if (m.index > last) {
        const before = document.createTextNode(text.slice(last, m.index));
        processed.add(before);
        frag.append(before);
      }
      const span = document.createElement("span");
      span.className = "glitterific-word";
      span.dataset.original = original;
      span.title = "Glitterific: click to see what they wrote";
      const inner = document.createElement("span");
      inner.className = "glitterific-new";
      inner.textContent = matchCase(original, replacement);
      span.append(inner);
      frag.append(span);
      last = m.index + original.length;
      swaps++;
    }
    if (!swaps) return;
    if (last < text.length) {
      const after = document.createTextNode(text.slice(last));
      processed.add(after);
      frag.append(after);
    }
    node.replaceWith(frag);
    count += swaps;
    reportCount();
  };

  const scan = (root) => {
    if (!state.enabled || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      glitterTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(glitterTextNode);
  };

  const unglitterAll = () => {
    const parents = new Set();
    document.querySelectorAll(".glitterific-word").forEach((span) => {
      const text = unwrap(span, false);
      if (text.parentNode) parents.add(text.parentNode);
    });
    // Stitch the split-up text back together so the page is as it was.
    parents.forEach((el) => el.normalize());
    count = 0;
    reportCount();
  };

  // ---------- Watch for new mail ----------

  const queue = new Set();
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    const items = [...queue];
    queue.clear();
    items.forEach((n) => n.isConnected && scan(n));
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    (self.requestIdleCallback || setTimeout)(flush, { timeout: 300 });
  };

  const observer = new MutationObserver((mutations) => {
    if (!state.enabled) return;
    for (const m of mutations) {
      if (m.type === "characterData") {
        processed.delete(m.target);
        queue.add(m.target);
      } else {
        m.addedNodes.forEach((n) => queue.add(n));
      }
    }
    schedule();
  });

  // ---------- Click a glittered word to see what they wrote ----------

  document.addEventListener(
    "click",
    (e) => {
      const word = e.target.closest && e.target.closest(".glitterific-word");
      if (!word || word.closest("a")) return;
      word.classList.toggle("glitterific-peek");
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  // ---------- Settings ----------

  const applyShowOriginals = () => {
    document.documentElement.classList.toggle("glitterific-show-originals", state.showOriginals);
  };

  const start = () => {
    applyShowOriginals();
    if (state.enabled) scan(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    reportCount();
  };

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.showOriginals) {
      state.showOriginals = !!changes.showOriginals.newValue;
      applyShowOriginals();
    }
    if (changes.enabled) {
      state.enabled = changes.enabled.newValue !== false;
      if (state.enabled) {
        processed = new WeakSet();
        scan(document.body);
      } else {
        unglitterAll();
      }
      reportCount();
    }
  });

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "glitterific-get-count") {
      sendResponse({ count: state.enabled ? count : 0, enabled: state.enabled });
    }
  });

  self.__glitterific = {
    rescan: () => {
      if (!state.enabled) return;
      scan(document.body);
      reportCount();
    }
  };

  api.storage.sync
    .get({ enabled: true, showOriginals: false })
    .then((saved) => {
      state.enabled = saved.enabled !== false;
      state.showOriginals = !!saved.showOriginals;
    })
    .catch(() => {})
    .finally(start);
})();
