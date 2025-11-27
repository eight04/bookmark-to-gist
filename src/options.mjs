import browser from "webextension-polyfill";

const status = document.querySelector(".status");
const opts = ["token", "gistId", "syncMode"];

const BUTTON_ACTIONS = {
  save: async () => {
    const output = {};
    for (const opt of opts) {
      const element = document.querySelector("[name=" + opt + "]");
      if (element.type === "radio") {
        try {
          output[opt] = document.querySelector("[name=" + opt + "]:checked").value;
        } catch (e) {
          console.warn(`No radio button selected for ${opt}`);
        }
      } else {
        output[opt] = element.value;
      }
    }
    status.textContent = "Saving...";
    await browser.storage.local.set(output);
    status.textContent = "Options saved.";
  },
  syncNow: async () => {
    status.textContent = "Syncing...";
    try {
      await browser.runtime.sendMessage({action: "sync"});
      status.textContent = "Synced.";
    } catch (e) {
      status.textContent = e.message;
    }
  },
  openGist: async () => {
    const gistId = await browser.storage.local.get("gistId").then(result => result.gistId);
    if (gistId) {
      const url = `https://gist.github.com/${gistId}`;
      await browser.tabs.create({url});
    } else {
      status.textContent = "Gist ID is not set.";
    }
  }
}

for (const [name, action] of Object.entries(BUTTON_ACTIONS)) {
  document.querySelector("[name=" + name + "]").addEventListener("click", action);
}

browser.storage.local.get(["token", "gistId", "syncMode"]).then(function(result) {
  for (const opt of opts) {
    if (result[opt] === undefined) {
      result[opt] = "";
    }
    const element = document.querySelector("[name=" + opt + "]");
    if (element.type === "radio") {
      try {
        document.querySelector("[name=" + opt + "][value='" + result[opt] + "']").checked = true;
      } catch (e) {
        console.warn(`No radio button for ${opt}=${result[opt]}`);
      }
    } else {
      element.value = result[opt];
    }
  }
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
  if (logs.length) {
    pre.textContent = logs.map(formatLog).join("\n") + "\n";
  }
});

browser.runtime.onMessage.addListener(function(message) {
  if (message.action === "newLog") {
    const pre = document.querySelector(".logs");
    pre.textContent += formatLog(message.log) + "\n";
  }
});

browser.storage.local.getKeys()
  .then(async keys => {
    const wipKeys = keys.filter(key => key.startsWith('wip-'));
    if (wipKeys.length > 0) {
      const result = await browser.storage.local.get(wipKeys);
      const wips = Object.values(result).map(w => JSON.stringify(w)).join('\n');
      const container = document.querySelector('.wip');
      container.textContent = wips;
      document.querySelector('.wip-container').hidden = false;
    }
  });
