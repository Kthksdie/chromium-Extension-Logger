document.addEventListener('DOMContentLoaded', () => {
    updateLogs();
    loadSettings();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    chrome.storage.local.set({ logs: [] }, () => {
        updateLogs();
    });
});

document.getElementById('save-settings').addEventListener('click', saveSettings);

function loadSettings() {
    chrome.storage.local.get(['receiverUrl'], (result) => {
        const input = document.getElementById('receiver-url');
        // Default URL if not set
        input.value = result.receiverUrl || 'http://192.168.1.24:8080/log';
    });
}

function saveSettings() {
    const url = document.getElementById('receiver-url').value.trim();
    const status = document.getElementById('status-msg');

    chrome.storage.local.set({ receiverUrl: url }, () => {
        status.textContent = 'Settings saved!';
        status.style.color = '#27ae60';
        setTimeout(() => { status.textContent = ''; }, 2000);
    });
}

function updateLogs() {
    chrome.storage.local.get(['logs'], (result) => {
        const logs = result.logs || [];
        const container = document.getElementById('log-container');
        container.innerHTML = '';

        if (logs.length === 0) {
            container.innerHTML = '<p class="empty-state">No logs yet.</p>';
            return;
        }

        logs.forEach(log => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';

            const date = new Date(log.timestamp).toLocaleTimeString();
            const faviconHtml = log.favIconUrl
                ? `<img src="${escapeHtml(log.favIconUrl)}" class="log-favicon" onerror="this.style.display='none'">`
                : '';

            const incognitoBadge = log.incognito
                ? `<span class="badge badge-incognito">Incognito</span>`
                : '';

            let typeClass = 'badge-type';
            if (log.type && log.type.startsWith('Nav:')) {
                typeClass = 'badge-transition';
            } else if (log.type === 'Tab Active') {
                typeClass = 'badge-transition';
            }

            const typeHtml = `<span class="badge ${typeClass}">${escapeHtml(log.type || 'Event')}</span>`;

            entryDiv.innerHTML = `
        <div class="log-row-header">
          <div style="display:flex; align-items:center; overflow: hidden;">
            ${faviconHtml}
            <span class="log-domain">${escapeHtml(log.domain)}</span>
          </div>
          <span class="log-time">${date}</span>
        </div>
        
        <div class="log-title" title="${escapeHtml(log.title)}">${escapeHtml(log.title)}</div>
        
        <div class="log-badges">
          ${typeHtml}
          ${incognitoBadge}
        </div>
      `;

            container.appendChild(entryDiv);
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
