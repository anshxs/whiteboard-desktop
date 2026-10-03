/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');
/* eslint-enable @typescript-eslint/no-require-imports */

let quitRequestCallback = null;
let quitRequestPending = false;

ipcRenderer.on('app:quit-request', () => {
  if (quitRequestCallback) quitRequestCallback();
  else quitRequestPending = true;
});

contextBridge.exposeInMainWorld('desktop', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  chooseNotesFolder: () => ipcRenderer.invoke('notes:choose-folder'),
  listProjects: (folder) => ipcRenderer.invoke('projects:list', folder),
  createProject: (options) => ipcRenderer.invoke('projects:create', options),
  openProject: (filePath) => ipcRenderer.invoke('projects:open', filePath),
  saveProject: (project) => ipcRenderer.invoke('projects:save', project),
  chooseProjectFile: () => ipcRenderer.invoke('projects:choose-file'),
  deleteProject: (options) => ipcRenderer.invoke('projects:delete', options),
  signalRendererReady: () => ipcRenderer.send('app:renderer-ready'),
  onQuitRequest: (callback) => {
    quitRequestCallback = callback;
    if (quitRequestPending) {
      quitRequestPending = false;
      queueMicrotask(callback);
    }
    return () => {
      if (quitRequestCallback === callback) quitRequestCallback = null;
    };
  },
  confirmQuit: () => ipcRenderer.send('app:quit-confirm'),
});
