const DEFAULTS = {
  interval: 10
};

async function load() {
  const stored = await browser.storage.local.get(DEFAULTS);
  document.getElementById("interval").value = stored.interval;
}

async function save() {
  const interval = parseInt(document.getElementById("interval").value, 10);
  await browser.storage.local.set({ interval });

  await browser.runtime.sendMessage({ type: "updateSettings" });

  const status = document.getElementById("status");
  status.textContent = "Settings saved.";
  setTimeout(() => { status.textContent = ""; }, 2500);
}

document.getElementById("save").addEventListener("click", save);
document.addEventListener("DOMContentLoaded", load);
