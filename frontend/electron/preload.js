// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Storage path management
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  setStoragePath: (path) => ipcRenderer.invoke('set-storage-path', path),
  selectStoragePath: () => ipcRenderer.invoke('select-storage-path'),

  // JSON file operations
  readJsonFile: (collection) => ipcRenderer.invoke('read-json-file', collection),
  writeJsonFile: (collection, data) => ipcRenderer.invoke('write-json-file', collection, data),

  // PDF operations
  savePDF: (filename, buffer) => ipcRenderer.invoke('save-pdf', { filename, buffer }),
  openPDFDirectory: () => ipcRenderer.invoke('open-pdf-directory'),
  getPDFTemplate: (templateName) => ipcRenderer.invoke('get-pdf-template', templateName),

  // Per-document save dirs
  getSaveDirs: () => ipcRenderer.invoke('get-save-dirs'),
  selectSaveDir: (docType) => ipcRenderer.invoke('select-save-dir', docType),
  setSaveDir: (docType, path) => ipcRenderer.invoke('set-save-dir', docType, path),
  // Silent save to configured directory (no dialog)
  savePDFToDir: ({ filename, buffer, docType }) => ipcRenderer.invoke('save-pdf-to-dir', { filename, buffer, docType }),
  // Clear a saved directory
  clearSaveDir: (docType) => ipcRenderer.invoke('clear-save-dir', docType),

  // App settings
  getAppSetting: (key) => ipcRenderer.invoke('get-app-setting', key),
  setAppSetting: (key, value) => ipcRenderer.invoke('set-app-setting', key, value),

  // Export/Import
  exportAllData: () => ipcRenderer.invoke('export-all-data'),

  // Check if running in Electron
  isElectron: true
  ,
  // Read an asset (image) from the app bundle/main process (returns Uint8Array as Array)
  readAsset: (assetUrl) => ipcRenderer.invoke('read-asset', assetUrl),
});
