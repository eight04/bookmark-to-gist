import browser from "webextension-polyfill";

const status = document.querySelector(".status");

document.querySelector("[name=save]").addEventListener("click", async function() {
  const token = document.querySelector("[name=token]").value;
  const gistId = document.querySelector("[name=gistId]").value;
  const syncMode = document.querySelector("[name=syncMode]:checked").value;
  status.textContent = "Saving...";
  await browser.storage.local.set({
    token: token,
    gistId: gistId,
    syncMode: syncMode
  });
  status.textContent = "Options saved.";
});

document.querySelector("[name=syncNow]").addEventListener("click", async function() {
  status.textContent = "Syncing...";
  try {
    await browser.runtime.sendMessage({action: "sync"});
    status.textContent = "Synced.";
  } catch (e) {
    status.textContent = e.message;
  }
});

browser.storage.local.get(["token", "gistId", "syncMode"]).then(function(result) {
  document.querySelector("[name=token]").value = result.token || "";
  document.querySelector("[name=gistId]").value = result.gistId || "";
  document.querySelector("[name=syncMode][value='" + (result.syncMode || "merge") + "']").checked = true;
});

browser.runtime.sendMessage({action: "getSyncError"}).then(function(syncError) {
  if (syncError) {
    status.textContent = syncError;
  }
});

function formatLog(log) {
  const date = new Date(log.timestamp);
  const time = date.toISOString();
  const args = log.arguments.map(arg => {
    if (typeof arg !== "object" || arg === null) {
      return String(arg);
    }
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }).join(" ");
  return `[${time}] ${args}`;
}

browser.runtime.sendMessage({action: "getLogs"}).then(function(logs) {
  const pre = document.querySelector(".logs");
  pre.textContent = logs.map(formatLog).join("\n");
});

browser.runtime.onMessage.addListener(function(message) {
  if (message.action === "newLog") {
    const pre = document.querySelector(".logs");
    pre.textContent += "\n" + formatLog(message.log);
  }
});
