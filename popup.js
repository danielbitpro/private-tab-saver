document.getElementById("save").addEventListener("click", async () => {
  await browser.runtime.sendMessage({ type: "saveNow" });
  window.close();
});

document.getElementById("options").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});
