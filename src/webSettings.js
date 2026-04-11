/**
 * Settings Webview Management
 * Handles configuration, retrieval, and UI for extension settings and download items
 */

function getExtensionConfig() {
    const vscode = require('vscode');
    return vscode.workspace.getConfiguration('pygameObjects');
}

function normalizeDownloadItem(entry) {
    if (!entry || typeof entry !== 'object') {
        return null;
    }
    const fileName = typeof entry.fileName === 'string' ? entry.fileName.trim() : '';
    if (!fileName) {
        return null;
    }
    const customUrl = typeof entry.url === 'string' ? entry.url.trim() : '';
    if (customUrl && !/^https?:\/\//i.test(customUrl)) {
        return null;
    }
    const menuLabel = typeof entry.menuLabel === 'string' && entry.menuLabel.trim().length > 0
        ? entry.menuLabel.trim()
        : `Add ${fileName} From The Web`;
    const successMessage = typeof entry.successMessage === 'string' && entry.successMessage.trim().length > 0
        ? entry.successMessage.trim()
        : `Adding ${fileName}`;
    return { fileName, menuLabel, successMessage, url: customUrl || null };
}

function getDefaultDownloadItems() {
    const config = getExtensionConfig();
    const inspected = config.inspect('downloadItems');
    return inspected && inspected.defaultValue ? inspected.defaultValue : [];
}

function getDownloadItems() {
    const raw = getExtensionConfig().get('downloadItems', []);
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(normalizeDownloadItem).filter(Boolean);
}

function resolveDownloadItemUrl(item, baseUrl) {
    if (item && item.url) {
        return item.url;
    }
    return baseUrl + item.fileName;
}

function buildMenuOptions() {
    return getDownloadItems().map(item => ({
        label: item.menuLabel,
        command: 'extension.addConfiguredPyGameModule',
        args: [item]
    }));
}

function getWebSettingsContent(items, defaultItems, settings) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PyGame Extension Settings</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                padding: 20px 20px 100px 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }

            .container {
                max-width: 900px;
                margin: 0 auto;
            }

            h1 {
                margin-bottom: 20px;
                font-size: 24px;
            }

            h2 {
                margin-top: 30px;
                margin-bottom: 15px;
                font-size: 18px;
                border-bottom: 1px solid var(--vscode-input-border);
                padding-bottom: 10px;
            }

            .intro-text {
                margin-bottom: 20px;
                color: var(--vscode-descriptionForeground);
                font-size: 14px;
                line-height: 1.5;
            }

            .settings-section {
                background-color: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 30px;
            }

            .settings-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 15px;
            }

            .modules-list {
                margin-bottom: 30px;
            }

            .module-item {
                background-color: var(--vscode-input-background);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 12px;
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 15px;
                align-items: start;
            }

            .module-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            label {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
            }

            input[type="text"],
            input[type="number"] {
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 3px;
                padding: 8px 12px;
                font-size: 13px;
                font-family: inherit;
            }

            input[type="text"]:focus,
            input[type="number"]:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 0 0 1px var(--vscode-focusBorder);
            }

            input[type="checkbox"] {
                width: 16px;
                height: 16px;
                cursor: pointer;
                margin-top: 8px;
            }

            .checkbox-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .checkbox-group input[type="checkbox"] {
                margin-top: 0;
            }

            .setting-description {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-top: 3px;
                font-style: italic;
            }

            .module-buttons {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            button {
                padding: 8px 16px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: background-color 0.2s;
            }

            .btn-delete {
                background-color: #d13438;
                color: white;
            }

            .btn-delete:hover {
                background-color: #a4373a;
            }

            .add-module-section {
                background-color: var(--vscode-input-background);
                border: 2px dashed var(--vscode-input-border);
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 20px;
            }

            .add-module-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--vscode-editor-foreground);
            }

            .add-module-content {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 12px;
                margin-bottom: 12px;
            }

            .btn-primary {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .btn-primary:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .buttons-section {
                position: sticky;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding: 20px;
                margin: 0 -20px -100px -20px;
                border-top: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-editor-background);
                z-index: 100;
            }

            .btn-save {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .btn-save:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .btn-cancel {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .btn-cancel:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .btn-reset {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            .btn-reset:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--vscode-descriptionForeground);
            }

            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .status-message {
                margin-top: 10px;
                padding: 10px 12px;
                border-radius: 4px;
                font-size: 12px;
                border: 1px solid transparent;
                display: none;
            }

            .status-message.error {
                display: block;
                color: #f8d7da;
                background-color: #5f1f24;
                border-color: #8f2b33;
            }

            .status-message.info {
                display: block;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-input-background);
                border-color: var(--vscode-input-border);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚙️ PyGame Extension Settings</h1>

            <h2>🔧 Extension Settings</h2>
            <div class="settings-section">
                <div class="settings-grid">
                    <div class="form-group">
                        <label for="baseUrl">Base URL</label>
                        <input type="text" id="baseUrl" placeholder="https://example.com/" value="${settings.baseUrl || ''}">
                        <div class="setting-description">Base URL for downloading objects. Must end with a slash.</div>
                    </div>
                    <div class="form-group">
                        <label for="objectsFolder">Objects Folder</label>
                        <input type="text" id="objectsFolder" placeholder="objects" value="${settings.objectsFolder || 'objects'}">
                        <div class="setting-description">Folder name where downloaded objects will be saved.</div>
                    </div>
                    <div class="form-group">
                        <label for="defaultWindowWidth">Default Window Width</label>
                        <input type="number" id="defaultWindowWidth" min="320" value="${settings.defaultWindowWidth || 500}">
                        <div class="setting-description">PyGame window width in pixels for new projects.</div>
                    </div>
                    <div class="form-group">
                        <label for="defaultWindowHeight">Default Window Height</label>
                        <input type="number" id="defaultWindowHeight" min="240" value="${settings.defaultWindowHeight || 500}">
                        <div class="setting-description">PyGame window height in pixels for new projects.</div>
                    </div>
                    <div class="form-group">
                        <label for="defaultFPS">Default FPS</label>
                        <input type="number" id="defaultFPS" min="1" value="${settings.defaultFPS || 60}">
                        <div class="setting-description">Default frames per second for new PyGame projects.</div>
                    </div>
                    <div class="form-group">
                        <label for="defaultAuthorName">Author Name</label>
                        <input type="text" id="defaultAuthorName" placeholder="Your Name Here" value="${settings.defaultAuthorName || ''}">
                        <div class="setting-description">Author name for generated PyGame projects.</div>
                    </div>
                </div>
                <div class="settings-grid" style="grid-template-columns: 1fr;">
                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="autoOpenDownloadedFiles" ${settings.autoOpenDownloadedFiles ? 'checked' : ''}>
                            <label for="autoOpenDownloadedFiles">Auto Open Downloaded Files</label>
                        </div>
                        <div class="setting-description">Automatically open downloaded files in the editor.</div>
                    </div>
                </div>
            </div>

            <h2>📦 Download Items</h2>

            <div class="intro-text">
                <p>Add, edit, or remove download items that appear in the PyGame menu. Each entry can optionally provide a custom URL to override the base URL.</p>
            </div>

            <div class="add-module-section">
                <div class="add-module-title">➕ Add New Item</div>
                <div class="add-module-content">
                    <div class="form-group">
                        <label for="newFileName">File Name *</label>
                        <input type="text" id="newFileName" placeholder="e.g., my_object.py">
                    </div>
                    <div class="form-group">
                        <label for="newMenuLabel">Menu Label *</label>
                        <input type="text" id="newMenuLabel" placeholder="e.g., Add My Object">
                    </div>
                    <div class="form-group">
                        <label for="newSuccessMsg">Success Message *</label>
                        <input type="text" id="newSuccessMsg" placeholder="e.g., Adding My Object">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 12px;">
                    <label for="newUrl">Custom URL (Optional)</label>
                    <input type="text" id="newUrl" placeholder="https://example.com/my_object.py (overrides base URL)">
                </div>
                <div id="statusMessage" class="status-message"></div>
                <button class="btn-primary" onclick="addItem()">Add Item</button>
            </div>

            <div class="modules-list" id="itemsList"></div>

            <div class="buttons-section">
                <button class="btn-reset" onclick="resetToDefaults()">Reset to Defaults</button>
                <div style="flex: 1;"></div>
                <button class="btn-cancel" onclick="cancel()">Cancel</button>
                <button class="btn-save" onclick="save()">Save Changes</button>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let items = ${JSON.stringify(items)};
            const defaultItems = ${JSON.stringify(defaultItems)};

            function setStatusMessage(message, type = 'info') {
                const status = document.getElementById('statusMessage');
                if (!status) { return; }
                if (!message) {
                    status.textContent = '';
                    status.className = 'status-message';
                    return;
                }
                status.textContent = message;
                status.className = 'status-message ' + type;
            }

            function renderItems() {
                const container = document.getElementById('itemsList');
                if (items.length === 0) {
                    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No download items configured yet. Add one above to get started!</p></div>';
                    return;
                }
                container.innerHTML = items.map((item, index) => \`
                    <div class="module-item">
                        <div class="module-content">
                            <div class="form-group">
                                <label>File Name</label>
                                <input type="text" value="\${escHtml(item.fileName)}" onchange="updateItem(\${index}, 'fileName', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Menu Label</label>
                                <input type="text" value="\${escHtml(item.menuLabel || '')}" onchange="updateItem(\${index}, 'menuLabel', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Success Message</label>
                                <input type="text" value="\${escHtml(item.successMessage || '')}" onchange="updateItem(\${index}, 'successMessage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Custom URL (Optional)</label>
                                <input type="text" value="\${escHtml(item.url || '')}" onchange="updateItem(\${index}, 'url', this.value)">
                            </div>
                        </div>
                        <div class="module-buttons">
                            <button class="btn-delete" onclick="deleteItem(\${index})">Delete</button>
                        </div>
                    </div>
                \`).join('');
            }

            function escHtml(str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            function addItem() {
                const fileName = document.getElementById('newFileName').value.trim();
                const menuLabel = document.getElementById('newMenuLabel').value.trim();
                const successMessage = document.getElementById('newSuccessMsg').value.trim();
                const url = document.getElementById('newUrl').value.trim();

                if (!fileName || !menuLabel || !successMessage) {
                    setStatusMessage('Please fill in required fields: File Name, Menu Label, and Success Message', 'error');
                    return;
                }

                const newItem = { fileName, menuLabel, successMessage };
                if (url) { newItem.url = url; }

                items.push(newItem);
                document.getElementById('newFileName').value = '';
                document.getElementById('newMenuLabel').value = '';
                document.getElementById('newSuccessMsg').value = '';
                document.getElementById('newUrl').value = '';
                setStatusMessage('Item added. Click Save Changes to persist.', 'info');
                renderItems();
            }

            function updateItem(index, field, value) {
                if (field === 'url') {
                    if (value.trim() === '') {
                        delete items[index][field];
                    } else {
                        items[index][field] = value;
                    }
                } else {
                    items[index][field] = value.trim();
                }
            }

            function deleteItem(index) {
                items.splice(index, 1);
                setStatusMessage('Item removed. Click Save Changes to persist.', 'info');
                renderItems();
            }

            function save() {
                const settings = {
                    baseUrl: document.getElementById('baseUrl').value.trim(),
                    objectsFolder: document.getElementById('objectsFolder').value.trim() || 'objects',
                    defaultWindowWidth: parseInt(document.getElementById('defaultWindowWidth').value) || 500,
                    defaultWindowHeight: parseInt(document.getElementById('defaultWindowHeight').value) || 500,
                    defaultFPS: parseInt(document.getElementById('defaultFPS').value) || 60,
                    defaultAuthorName: document.getElementById('defaultAuthorName').value.trim(),
                    autoOpenDownloadedFiles: document.getElementById('autoOpenDownloadedFiles').checked
                };
                vscode.postMessage({ command: 'save', settings, items });
            }

            function cancel() {
                vscode.postMessage({ command: 'cancel' });
            }

            function resetToDefaults() {
                vscode.postMessage({ command: 'reset' });
            }

            // Initial render
            renderItems();
        </script>
    </body>
    </html>
    `;
}

module.exports = {
    normalizeDownloadItem,
    getDefaultDownloadItems,
    getDownloadItems,
    resolveDownloadItemUrl,
    buildMenuOptions,
    getWebSettingsContent
};
