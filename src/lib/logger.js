import browser from "webextension-polyfill";

export const records = [];
const MAX_LOGS = 100;

export async function log(...args) {
  records.push({timestamp: Date.now(), arguments: args});
  if (records.length > MAX_LOGS) {
    records.shift();
  }
  browser.runtime.sendMessage({action: "newLog", log: records[records.length - 1]});
}

