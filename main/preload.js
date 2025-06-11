const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openViewerWindow: (filePath) => ipcRenderer.send('open-viewer-window', filePath),
  receiveNdjsonData: (callback) => ipcRenderer.on('load-ndjson-file', callback)
});