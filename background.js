// background.js — Private Tabs Auto-Saver v1.3
// Saves private tabs as Markdown. Keeps latest + previous.
// Saves on timer + when a private window closes.
// Badge shows private tab count. Includes browser name in filename.

const DEFAULTS = {
  interval: 10
};

let browserName = "Browser";

async function initBrowserName() {
  try {
    const info = await browser.runtime.getBrowserInfo();
    browserName = info.name || "Browser";
  } catch (e) {
    // Fallback
    const ua = navigator.userAgent;
    if (ua.includes("Waterfox")) browserName = "Waterfox";
    else if (ua.includes("Firefox")) browserName = "Firefox";
  }
}

async function getSettings() {
  return await browser.storage.local.get(DEFAULTS);
}

function buildMarkdown(privateWindows) {
  const now = new Date();
  let md = `# Private Tabs Backup\n\n`;
  md += `**Saved:** ${now.toLocaleString()}\n`;
  md += `**Browser:** ${browserName}\n\n`;
  md += `---\n\n`;

  let totalTabs = 0;

  privateWindows.forEach((win, index) => {
    md += `## Private Window ${index + 1}\n\n`;
    if (win.tabs && win.tabs.length > 0) {
      win.tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith("about:") && !tab.url.startsWith("moz-extension:")) {
          const title = (tab.title || tab.url).replace(/[\[\]]/g, "");
          md += `- [${title}](${tab.url})\n`;
          totalTabs++;
        }
      });
    } else {
      md += `*(no tabs)*\n`;
    }
    md += `\n`;
  });

  md += `---\n\n`;
  md += `**Total private tabs:** ${totalTabs}\n`;
  return { md, totalTabs };
}

async function updateBadge() {
  try {
    const windows = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
    const privateWindows = windows.filter(w => w.incognito);
    let count = 0;
    privateWindows.forEach(w => {
      if (w.tabs) {
        count += w.tabs.filter(t => t.url && !t.url.startsWith("about:") && !t.url.startsWith("moz-extension:")).length;
      }
    });
    browser.action.setBadgeText({ text: count > 0 ? String(count) : "" });
    browser.action.setBadgeBackgroundColor({ color: "#4a90d9" });
  } catch (e) {
    console.error("Badge update failed", e);
  }
}

async function savePrivateTabs(silent = true) {
  try {
    const windows = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
    const privateWindows = windows.filter(w => w.incognito);

    if (privateWindows.length === 0) {
      if (!silent) {
        await browser.notifications.create({
          type: "basic",
          title: "Private Tabs Auto-Saver",
          message: "No private windows open."
        });
      }
      await updateBadge();
      return;
    }

    const { md, totalTabs } = buildMarkdown(privateWindows);

    // Rotate: write previous content (if any) to -previous.md, then new to -latest.md
    const stored = await browser.storage.local.get("lastMarkdown");
    const latestName = `private-tabs-${browserName}-latest.md`;
    const previousName = `private-tabs-${browserName}-previous.md`;

    if (stored.lastMarkdown) {
      const prevBlob = new Blob([stored.lastMarkdown], { type: "text/markdown;charset=utf-8" });
      const prevUrl = URL.createObjectURL(prevBlob);
      await browser.downloads.download({
        url: prevUrl,
        filename: previousName,
        conflictAction: "overwrite",
        saveAs: false
      });
      setTimeout(() => URL.revokeObjectURL(prevUrl), 3000);
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    await browser.downloads.download({
      url: url,
      filename: latestName,
      conflictAction: "overwrite",
      saveAs: false
    });
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    // Store current as next previous
    await browser.storage.local.set({ lastMarkdown: md });

    if (!silent) {
      await browser.notifications.create({
        type: "basic",
        title: "Private Tabs Auto-Saver",
        message: `Saved ${totalTabs} private tabs (${browserName})`
      });
    }

    await updateBadge();

  } catch (err) {
    console.error("Private Tabs Auto-Saver error:", err);
    if (!silent) {
      await browser.notifications.create({
        type: "basic",
        title: "Private Tabs Auto-Saver - Error",
        message: err.message || "Failed to save tabs."
      });
    }
  }
}

async function setupAlarm() {
  const { interval } = await getSettings();
  await browser.alarms.clear("savePrivateTabs");
  browser.alarms.create("savePrivateTabs", { periodInMinutes: interval });
}

// Manual button via popup + settings
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === "saveNow") {
    savePrivateTabs(false);
  }
  if (msg.type === "updateSettings") {
    setupAlarm();
  }
});

// Alarm
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "savePrivateTabs") {
    savePrivateTabs(true);
  }
});

// Save when a private window is closed
browser.windows.onRemoved.addListener(async (windowId) => {
  // Small delay so the window is fully gone, then save remaining private tabs
  setTimeout(() => savePrivateTabs(true), 300);
});

// Badge updates
browser.tabs.onCreated.addListener(updateBadge);
browser.tabs.onRemoved.addListener(updateBadge);
browser.tabs.onUpdated.addListener(updateBadge);
browser.windows.onCreated.addListener(updateBadge);
browser.windows.onRemoved.addListener(updateBadge);

// Startup
browser.runtime.onInstalled.addListener(async () => {
  await initBrowserName();
  const current = await browser.storage.local.get(null);
  if (!current.interval) {
    await browser.storage.local.set(DEFAULTS);
  }
  await setupAlarm();
  setTimeout(() => {
    updateBadge();
    savePrivateTabs(true);
  }, 1500);
});

browser.runtime.onStartup.addListener(async () => {
  await initBrowserName();
  await setupAlarm();
  setTimeout(updateBadge, 1000);
});

// Initial badge + name
initBrowserName().then(updateBadge);
