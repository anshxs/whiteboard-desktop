/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');
/* eslint-enable @typescript-eslint/no-require-imports */

contextBridge.exposeInMainWorld('desktop', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  chooseNotesFolder: () => ipcRenderer.invoke('notes:choose-folder'),
});
