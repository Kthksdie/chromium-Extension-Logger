// background.js

const DEFAULT_RECEIVER = 'http://192.168.1.24:8080/log';

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return 'unknown';
  }
}

function sendToReceiver(logEntry) {
  chrome.storage.local.get(['receiverUrl'], (result) => {
    const url = result.receiverUrl || DEFAULT_RECEIVER;
    // Basic validation
    if (!url.startsWith('http')) return;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    }).catch(err => {
      // Slient fail or console log. 
      // console.warn('Failed to send log:', err);
    });
  });
}

function addLog(logEntry) {
  // 1. Store locally
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.unshift(logEntry);

    if (logs.length > 1000) {
      logs.pop();
    }

    chrome.storage.local.set({ logs: logs });
  });

  // 2. Send to Receiver
  sendToReceiver(logEntry);
}

// 1. Tab Updated (Load, Title Change, Favicon)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.title) {
    if (!tab.url || tab.url.startsWith('chrome://')) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      domain: getDomain(tab.url),
      title: tab.title || 'No Title',
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      incognito: tab.incognito,
      type: changeInfo.status === 'complete' ? 'Load/Reload' : 'Title Change'
    };

    addLog(logEntry);
  }
});

// 2. Tab Activated (Focus/Switch)
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url || tab.url.startsWith('chrome://')) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      domain: getDomain(tab.url),
      title: tab.title || 'No Title',
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      incognito: tab.incognito,
      type: 'Tab Active' // Focused
    };

    addLog(logEntry);
  });
});

// 3. Tab Closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    domain: '-',
    title: `Tab Closed (ID: ${tabId})`,
    url: '',
    favIconUrl: '',
    incognito: false,
    type: 'Tab Closed'
  };

  addLog(logEntry);
});

// 4. Web Navigation (Transition Type)
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;

  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      domain: getDomain(details.url),
      title: tab.title || 'Loading...',
      url: details.url,
      favIconUrl: tab.favIconUrl,
      incognito: tab.incognito,
      type: `Nav: ${details.transitionType}`
    };

    addLog(logEntry);
  });
});
