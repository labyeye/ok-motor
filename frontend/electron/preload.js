const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  getStoragePath: () => ipcRenderer.invoke("get-storage-path"),
  setStoragePath: (path) => ipcRenderer.invoke("set-storage-path", path),
  selectStoragePath: () => ipcRenderer.invoke("select-storage-path"),

  readJsonFile: (collection) =>
    ipcRenderer.invoke("read-json-file", collection),
  writeJsonFile: (collection, data) =>
    ipcRenderer.invoke("write-json-file", collection, data),

  savePDF: (filename, buffer) =>
    ipcRenderer.invoke("save-pdf", { filename, buffer }),
  openPDFDirectory: () => ipcRenderer.invoke("open-pdf-directory"),
  getPDFTemplate: (templateName) =>
    ipcRenderer.invoke("get-pdf-template", templateName),

  getSaveDirs: () => ipcRenderer.invoke("get-save-dirs"),
  selectSaveDir: (docType) => ipcRenderer.invoke("select-save-dir", docType),
  setSaveDir: (docType, path) =>
    ipcRenderer.invoke("set-save-dir", docType, path),
  savePDFToDir: ({ filename, buffer, docType }) =>
    ipcRenderer.invoke("save-pdf-to-dir", { filename, buffer, docType }),
  clearSaveDir: (docType) => ipcRenderer.invoke("clear-save-dir", docType),

  getAppSetting: (key) => ipcRenderer.invoke("get-app-setting", key),
  setAppSetting: (key, value) =>
    ipcRenderer.invoke("set-app-setting", key, value),

  exportAllData: () => ipcRenderer.invoke("export-all-data"),

  isElectron: true,
  readAsset: (assetUrl) => ipcRenderer.invoke("read-asset", assetUrl),
});
