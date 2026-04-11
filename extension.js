const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // ✅ Import exec
const https = require('https');

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

function activate(context) {

    // Register the "Show PyGame Menu" command
    let disposableShowPygameMenu = vscode.commands.registerCommand('extension.showPygameMenu', async () => {
        const options = [
            { label: 'Run Program', command: 'extension.disposablePyGameRun' },
            { label: 'Add Grid Object From The Web', command: 'extension.addPyGameGridSupport' },
            { label: 'Add Image Object From The Web', command: 'extension.addPyGameImageSupport' },
            { label: 'Add Button Object From The Web', command: 'extension.addPyGameButtonSupport' },
            { label: 'Add Text Input Object From The Web', command: 'extension.addPyGameTextInputSupport' },
            { label: 'Add DB Objects From the Web', command: 'extension.addPyGameDBSupport' },
            { label: 'Add CheckBox and Radio Buttons From the Web', command: 'extension.disposablePyGameCheck' },
            { label: 'Add List Widget and Combobox From the Web', command: 'extension.disposablePyGameListwidget' },
            { label: 'Add Text file from Web', command: 'extension.disposablePyGameText' },
        ];
        const selected = await vscode.window.showQuickPick(options, { placeHolder: 'Choose an option' });

        if (selected) {
            vscode.commands.executeCommand(selected.command);
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


let disposablePyButtons = vscode.commands.registerCommand('extension.addPyGameButtonSupport', async () => {
    const url = getBaseUrl() + 'buttons.py';
    await downloadToFolder(getObjectsFolder(), 'buttons.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding Button Object in: ${folderPath}`);
});

let disposablePyGameListwidget = vscode.commands.registerCommand('extension.disposablePyGameListwidget', async () => {
    const url = getBaseUrl() + 'list_widget.py';
    await downloadToFolder(getObjectsFolder(), 'list_widget.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`List Widget and Commbobox Object in: ${folderPath}`);
});

let disposablePyGrid = vscode.commands.registerCommand('extension.addPyGameGridSupport', async () => {
    const url = getBaseUrl() + 'grid.py';
    await downloadToFolder(getObjectsFolder(), 'grid.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding Grid Object in: ${folderPath}`);
});

let disposablePyImg = vscode.commands.registerCommand('extension.addPyGameImageSupport', async () => {
    const url = getBaseUrl() + 'image.py';
    await downloadToFolder(getObjectsFolder(), 'image.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding Image Object in: ${folderPath}`);
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

let disposablePyTextInput = vscode.commands.registerCommand('extension.addPyGameTextInputSupport', async () => {
    const url = getBaseUrl() + 'text.py';
    await downloadToFolder(getObjectsFolder(), 'text.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding Text Input Object in: ${folderPath}`);
});

let disposableaddPyGameDB = vscode.commands.registerCommand('extension.addPyGameDBSupport', async () => {
    const url = getBaseUrl() + 'database.py';
    await downloadToFolder(getObjectsFolder(), 'database.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding Database Object in: ${folderPath}`);
});

let disposablePyGameCheck = vscode.commands.registerCommand('extension.disposablePyGameCheck', async () => {
    const url = getBaseUrl() + 'checkbox.py';
    await downloadToFolder(getObjectsFolder(), 'checkbox.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding CheckBox Object in: ${folderPath}`);
});

let disposablePyGameText = vscode.commands.registerCommand('extension.disposablePyGameText', async () => {
    const url = getBaseUrl() + 'text_files.py';
    await downloadToFolder(getObjectsFolder(), 'text_files.py', url);
    // Get folder path for message
    const folderPath = await getFolderPath();
    vscode.window.showInformationMessage(`Adding Text File Object in: ${folderPath}`);
});

// Add commands to the context subscriptions
context.subscriptions.push(
    disposableShowPygameMenu,
    disposableCreatePyGame,
    disposablePyButtons,
    disposablePyGrid,
    disposablePyImg,
    disposablePyTextInput,
    disposableaddPyGameDB,
    disposablePyGameRun,
    disposablePyGameCheck,
    disposablePyGameListwidget,
    disposablePyGameText
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
    https.get(url, (response) => {
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
