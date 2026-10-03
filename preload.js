/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');
/* eslint-enable @typescript-eslint/no-require-imports */

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
  onQuitRequest: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:quit-request', listener);
    return () => ipcRenderer.removeListener('app:quit-request', listener);
  },
  confirmQuit: () => ipcRenderer.send('app:quit-confirm'),
});
