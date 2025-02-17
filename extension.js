const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // ✅ Import exec
const https = require('https');

function activate(context) {
    // Create Status Bar item
    const pygameStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 250);
   // rustStatusBarItem.text = "PyGame: Menu"; // Label on the Status Bar
   // rustStatusBarItem.command = "extension.showPygameMenu"; // Command triggered when clicked
  //  rustStatusBarItem.show(); // Display the button in the Status Bar
   

    // Add it to context so it's disposed properly
    //  context.subscriptions.push(rustStatusBarItem);

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
        const date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

     //   vscode.window.showInformationMessage(`Project initialized in ${folderPath}!`);
    const imageFolder = path.join(folderPath, 'images');
    if (!fs.existsSync(imageFolder)) {
        fs.mkdirSync(imageFolder, { recursive: true });
    }

    const mainPyPath = path.join(folderPath, 'main.py');
    const mainPyGameContent = `#By: <Your Name Here>
#Date: ${date}
#Program Details: <Program Description Here>

import pygame,sys
pygame.init()

# Game Setup
fps = 60
fpsClock = pygame.time.Clock()
WINDOW_WIDTH = 500
WINDOW_HEIGHT = 500

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
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/buttons.py';

    await downloadToFolder('objects', 'buttons.py', url);
    vscode.window.showInformationMessage(`Adding Button Object in: ${folderPath}`);
});

let disposablePyGrid = vscode.commands.registerCommand('extension.addPyGameGridSupport', async () => {
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/grid.py';

    await downloadToFolder('objects', 'grid.py', url);
    vscode.window.showInformationMessage(`Adding Grid Object in: ${folderPath}`);
});

let disposablePyImg = vscode.commands.registerCommand('extension.addPyGameImageSupport', async () => {
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/image.py';

    await downloadToFolder('objects', 'image.py', url);
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
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/text.py';

    await downloadToFolder('objects', 'text.py', url);
    vscode.window.showInformationMessage(`Adding Text Input Object in: ${folderPath}`);
});
let disposableaddPyGameDB = vscode.commands.registerCommand('extension.addPyGameDBSupport', async () => {
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/database.py';

    await downloadToFolder('objects', 'database.py', url);
    vscode.window.showInformationMessage(`Adding Database Object in: ${folderPath}`);
});
let disposablePyGameCheck = vscode.commands.registerCommand('extension.disposablePyGameCheck', async () => {
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/checkbox.py';

    await downloadToFolder('objects', 'checkbox.py', url);
    vscode.window.showInformationMessage(`Adding CheckBox Object in: ${folderPath}`);
});
let disposablePyGameText = vscode.commands.registerCommand('extension.disposablePyGameText', async () => {
    const url = 'https://raw.githubusercontent.com/Mathew-D/pygame-objects/main/text_files.py';

    await downloadToFolder('objects', 'text_files.py', url);
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

function downloadFile(url, targetPath) {
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

    // Ensure the folder is inside `src`
    const srcPath = path.join(folderPath, folderName);
    
    if (!fs.existsSync(srcPath)) {
        fs.mkdirSync(srcPath, { recursive: true });
    }

    const filePath = path.join(srcPath, fileName);
    downloadFile(url, filePath);
}



function deactivate() { }

module.exports = {
    activate,
    deactivate
};
