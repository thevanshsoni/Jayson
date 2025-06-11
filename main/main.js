const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    resizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, '../assets/jayson-logo.png'),
    autoHideMenuBar: true,
    backgroundColor: '#1e1e2f',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('Jayson/renderer/index.html');
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.on('open-viewer-window', (event, fileData) => {
  const viewerWindow = new BrowserWindow({
    width: 1700,
    height: 956,
    icon: path.join(__dirname, '../assets/jayson-logo.png'),
    fullscreen: false,
    backgroundColor: '#1e1e2f',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  viewerWindow.loadFile('Jayson/renderer/viewer.html');
    
  viewerWindow.webContents.on('did-finish-load', () => {
  viewerWindow.webContents.send('load-ndjson-content', fileData);
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  }, 0);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});