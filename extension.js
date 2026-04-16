const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // ✅ Import exec
const https = require('https');
const http = require('http');
const webSettings = require('./src/webSettings');

// Function to get the base URL from settings
function getBaseUrl() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    const baseUrl = config.get('baseUrl') || 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/';
    // Ensure it ends with a slash
    return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
}

// Function to get the objects folder name from settings
function getObjectsFolder() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    return config.get('objectsFolder') || 'objects';
}

// Function to get default FPS from settings
function getDefaultFPS() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    return config.get('defaultFPS') || 60;
}

// Function to get default window width from settings
function getDefaultWindowWidth() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    return config.get('defaultWindowWidth') || 500;
}

// Function to get default window height from settings
function getDefaultWindowHeight() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    return config.get('defaultWindowHeight') || 500;
}

// Function to get default author name from settings
function getDefaultAuthorName() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    const authorName = config.get('defaultAuthorName') || '';
    return authorName ? authorName : '<Your Name Here>';
}

// Function to check if auto-open is enabled
function shouldAutoOpenFiles() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    return config.get('autoOpenDownloadedFiles') || false;
}

function normalizeDownloadItem(entry) { return webSettings.normalizeDownloadItem(entry); }
function getDownloadItems() { return webSettings.getDownloadItems(); }
function resolveDownloadItemUrl(item) { return webSettings.resolveDownloadItemUrl(item, getBaseUrl()); }
function buildMenuOptions() { return webSettings.buildMenuOptions(); }

function getCurrentSettings() {
    const config = vscode.workspace.getConfiguration('pygameObjects');
    return {
        baseUrl: getBaseUrl(),
        objectsFolder: getObjectsFolder(),
        defaultFPS: getDefaultFPS(),
        defaultWindowWidth: getDefaultWindowWidth(),
        defaultWindowHeight: getDefaultWindowHeight(),
        defaultAuthorName: config.get('defaultAuthorName') || '',
        autoOpenDownloadedFiles: shouldAutoOpenFiles()
    };
}

function renderSettingsPanel(panel, settings, items, defaultItems) {
    panel.webview.html = webSettings.getWebSettingsContent(items, defaultItems, settings);
}

async function resetConfigurationSetting(config, key) {
    const inspected = config.inspect(key);
    if (!inspected) {
        return;
    }

    const resetOperations = [];

    if (inspected.globalValue !== undefined) {
        resetOperations.push(config.update(key, undefined, vscode.ConfigurationTarget.Global));
    }
    if (inspected.workspaceValue !== undefined) {
        resetOperations.push(config.update(key, undefined, vscode.ConfigurationTarget.Workspace));
    }
    if (inspected.workspaceFolderValue !== undefined) {
        resetOperations.push(config.update(key, undefined, vscode.ConfigurationTarget.WorkspaceFolder));
    }
    if (inspected.globalLanguageValue !== undefined) {
        resetOperations.push(config.update(key, undefined, vscode.ConfigurationTarget.Global, true));
    }
    if (inspected.workspaceLanguageValue !== undefined) {
        resetOperations.push(config.update(key, undefined, vscode.ConfigurationTarget.Workspace, true));
    }
    if (inspected.workspaceFolderLanguageValue !== undefined) {
        resetOperations.push(config.update(key, undefined, vscode.ConfigurationTarget.WorkspaceFolder, true));
    }

    await Promise.all(resetOperations);
}

function activate(context) {

    // Register the "Show PyGame Menu" command
    let disposableShowPygameMenu = vscode.commands.registerCommand('extension.showPygameMenu', async () => {
        const options = [
            { label: 'Run Program', command: 'extension.disposablePyGameRun' },
            ...buildMenuOptions(),
            { label: '⚙️ Plugin Settings', command: 'extension.manageSettings' },
        ];
        const selected = await vscode.window.showQuickPick(options, { placeHolder: 'Choose an option' });

        if (selected) {
            vscode.commands.executeCommand(selected.command, ...(selected.args || []));
        }
        //     context.subscriptions.push(disposableShowMenu);
    });

    // Register the "Create PyGame Project" command
    let disposableCreatePyGame = vscode.commands.registerCommand('extension.createPyGameProject', async () => {
        // Get the folder path from the active workspace or open file
        const folderPath = await getFolderPath();

        if (!folderPath) {
            vscode.window.showErrorMessage('No folder is open. Please open a folder first.');
            return;
        }

        // Check if folder path contains spaces
        if (folderPath.includes(' ')) {
            vscode.window.showErrorMessage('Cannot create PyGame project in a folder with spaces in the name. Please use a folder without spaces.');
            return;
        }

        const date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        const authorName = getDefaultAuthorName();
        const fps = getDefaultFPS();
        const width = getDefaultWindowWidth();
        const height = getDefaultWindowHeight();

     //   vscode.window.showInformationMessage(`Project initialized in ${folderPath}!`);
    const imageFolder = path.join(folderPath, 'images');
    if (!fs.existsSync(imageFolder)) {
        fs.mkdirSync(imageFolder, { recursive: true });
    }

    const mainPyPath = path.join(folderPath, 'main.py');
    const mainPyGameContent = `#By: ${authorName}
#Date: ${date}
#Program Details: <Program Description Here>

import pygame,sys
pygame.init()

# Game Setup
fps = ${fps}
fpsClock = pygame.time.Clock()
WINDOW_WIDTH = ${width}
WINDOW_HEIGHT = ${height}

#Setup of Starting objects

window = pygame.display.set_mode((WINDOW_WIDTH,WINDOW_HEIGHT), pygame.HWSURFACE)
pygame.display.set_caption("Title")

def display():
    window.fill((255,255,255)) #White background
   
   
while True:
    display()
    for event in pygame.event.get():
      # if user  QUIT then the screen will close
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
  
       
    pygame.display.flip() #update the display
    fpsClock.tick(fps) #speed of redraw
`;
    fs.writeFileSync(mainPyPath, mainPyGameContent);
    vscode.window.showInformationMessage(`Creating PyGame Project in: ${folderPath}`);
    // You can add your logic to run cargo init here
});


let disposablePyGameRun = vscode.commands.registerCommand('extension.disposablePyGameRun', async () => {

    const folderPath = await getFolderPath();

    if (!folderPath) {
        vscode.window.showErrorMessage('No folder is open. Please open a folder first.');
        return;
    }
    let terminal = vscode.window.createTerminal("PyGame Terminal");
    terminal.show();

    let runCommand = (command) => {
        terminal.sendText(command);
    };

    runCommand(`cd ${folderPath} && python3 main.py`);
  
    vscode.window.showInformationMessage(`Running PyGame main.py.`);
});

let disposableAddConfiguredPyGameModule = vscode.commands.registerCommand('extension.addConfiguredPyGameModule', async (itemConfig) => {
    let selected = normalizeDownloadItem(itemConfig);

    if (!selected) {
        const items = getDownloadItems();
        if (items.length === 0) {
            vscode.window.showWarningMessage('No download items configured. Update pygameObjects.downloadItems in Settings.');
            return;
        }
        const picked = await vscode.window.showQuickPick(
            items.map(item => ({ label: item.menuLabel, detail: item.fileName, item })),
            { placeHolder: 'Choose a module to download' }
        );
        if (!picked) {
            return;
        }
        selected = picked.item;
    }

    const url = resolveDownloadItemUrl(selected);
    await downloadToFolder(getObjectsFolder(), selected.fileName, url);
    const folderPath = await getFolderPath();
    if (folderPath) {
        vscode.window.showInformationMessage(`${selected.successMessage} in: ${folderPath}`);
    }
});

    let disposableManageSettings = vscode.commands.registerCommand('extension.manageSettings', async () => {
        const panel = vscode.window.createWebviewPanel(
            'pygameSettings',
            'PyGame Extension Settings',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const config = vscode.workspace.getConfiguration('pygameObjects');
        const items = webSettings.getDownloadItems();
        const defaultItems = webSettings.getDefaultDownloadItems();
        const settings = getCurrentSettings();

        renderSettingsPanel(panel, settings, items, defaultItems);

        panel.webview.onDidReceiveMessage(async (message) => {
            try {
                if (message.command === 'save') {
                    await config.update('baseUrl', message.settings.baseUrl, vscode.ConfigurationTarget.Global);
                    await config.update('objectsFolder', message.settings.objectsFolder, vscode.ConfigurationTarget.Global);
                    await config.update('defaultFPS', message.settings.defaultFPS, vscode.ConfigurationTarget.Global);
                    await config.update('defaultWindowWidth', message.settings.defaultWindowWidth, vscode.ConfigurationTarget.Global);
                    await config.update('defaultWindowHeight', message.settings.defaultWindowHeight, vscode.ConfigurationTarget.Global);
                    await config.update('defaultAuthorName', message.settings.defaultAuthorName, vscode.ConfigurationTarget.Global);
                    await config.update('autoOpenDownloadedFiles', message.settings.autoOpenDownloadedFiles, vscode.ConfigurationTarget.Global);
                    await config.update('downloadItems', message.items, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage('PyGame settings updated successfully!');
                    panel.dispose();
                } else if (message.command === 'cancel') {
                    panel.dispose();
                } else if (message.command === 'reset') {
                    const settingKeys = [
                        'baseUrl',
                        'objectsFolder',
                        'defaultFPS',
                        'defaultWindowWidth',
                        'defaultWindowHeight',
                        'defaultAuthorName',
                        'autoOpenDownloadedFiles',
                        'downloadItems'
                    ];

                    await Promise.all(settingKeys.map(key => resetConfigurationSetting(config, key)));

                    renderSettingsPanel(
                        panel,
                        webSettings.getDefaultSettings(),
                        webSettings.getDefaultDownloadItems(),
                        webSettings.getDefaultDownloadItems()
                    );
                    vscode.window.showInformationMessage('PyGame settings reset to defaults.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error updating settings: ${error.message}`);
            }
        });
    });

// Add commands to the context subscriptions
context.subscriptions.push(
    disposableShowPygameMenu,
    disposableCreatePyGame,
    disposablePyGameRun,
    disposableAddConfiguredPyGameModule,
    disposableManageSettings
);
}

// Function to get the folder path (from workspace or active file)
async function getFolderPath() {
    // Check if there's an open folder/workspace
    const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;

    if (workspaceFolder) {
        return workspaceFolder.uri.fsPath; // Return the folder path of the open workspace
    }

    // If no workspace, check if there's an open file and get its directory path
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
        return vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)?.uri.fsPath;
    }

    return null; // Return null if no folder or file is open
}

function downloadFile(url, targetPath, autoOpen = false) {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
        if (response.statusCode !== 200) {
            vscode.window.showErrorMessage(`Failed to download ${path.basename(targetPath)}: ${response.statusCode}`);
            return;
        }

        const fileStream = fs.createWriteStream(targetPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
            fileStream.close();
            vscode.window.showInformationMessage(`${path.basename(targetPath)} downloaded successfully!`);
            
            // Auto-open the file if enabled
            if (autoOpen) {
                vscode.workspace.openTextDocument(targetPath).then((doc) => {
                    vscode.window.showTextDocument(doc);
                }).catch((err) => {
                    vscode.window.showWarningMessage(`Could not open file: ${err.message}`);
                });
            }
        });
    }).on('error', (err) => {
        vscode.window.showErrorMessage(`Download failed: ${err.message}`);
    });
}

async function downloadToFolder(folderName, fileName, url) {
    const folderPath = await getFolderPath();
    if (!folderPath) {
        vscode.window.showErrorMessage('No folder is open. Please open a folder first.');
        return;
    }

    // Ensure the folder is inside the project
    const srcPath = path.join(folderPath, folderName);
    
    if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath, { recursive: true });
    }

    const filePath = path.join(srcPath, fileName);
    const autoOpen = shouldAutoOpenFiles();
    downloadFile(url, filePath, autoOpen);
}



function deactivate() { }

module.exports = {
    activate,
    deactivate
};
