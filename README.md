# Chromium Extension Logger

A Web Extension that tracks tab activity (loads, title changes, focus switches, closures) and logs them locally and/or to a local network receiver.

## Features

- **Event Logging**: Tracks:
    - Page Loads & Reloads
    - Title Changes
    - Tab Activation (Focus switching)
    - Tab Closures
    - Navigation Types (Typed, Link, Reload, etc.)
- **Rich Data**: Captures Timestamp, Domain, URL, Title, Favicon, Incognito status, and Event Type.
- **UI**: Clean popup interface with "Clear Logs" functionality and badges for event types.
- **Dual Storage**:
    - **Local**: Visualized in the extension popup (`chrome.storage.local`).
    - **Remote**: Sends JSON logs via HTTP POST to a configurable local network address.

## Installation

1.  Clone or download this repository.
2.  Open Chrome (or Edge/Brave) and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (top right toggle).
4.  Click **Load unpacked**.
5.  Select the project directory.

## Usage

### Viewing Logs
Click the extension icon in your toolbar to view the specific log history stored in the browser.

### Remote Logging Setup
The extension can beam logs to a server on your local network.

1.  **Configure Extension**:
    - Open the extension popup.
    - Expand **Settings**.
    - Enter your receiver URL (e.g., `http://192.168.1.24:8080/log`).
    - Click **Save**.

2.  **Run Receiver (Example)**:
    - A simple Python script is included to test this functionality.
    - Run: `python test_server.py`
    - It listens on port `8080` and prints received JSON objects to the console.

## Data Format

Logs sent to the receiver are in JSON format:

```json
{
  "timestamp": "2026-01-16T22:28:05.953Z",
  "domain": "google.com",
  "title": "Google",
  "url": "https://google.com/",
  "favIconUrl": "https://google.com/favicon.ico",
  "incognito": false,
  "type": "Nav: typed"
}
```

## Permissions used

- `storage`: Saving logs locally and user settings.
- `tabs`: detecting tab properties and updates.
- `webNavigation`: Determining how the navigation occurred (link vs typed vs reload).
- `host_permissions` (`http://*/*`): Required to send POST requests to arbitrary local IP addresses specified in settings.
