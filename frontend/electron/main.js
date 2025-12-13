// electron/main.js
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const url = require('url');

// Check if running in development
const isDev = !app.isPackaged;

const Store = require('electron-store');

// Initialize persistent store
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load React app
  if (isDev) {
    const indexPath = path.join(__dirname, '..', 'build', 'index.html');
    const startUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    
    console.log('🚀 Loading URL:', startUrl);
    console.log('📁 Index path:', indexPath);
    console.log('� __dirname:', __dirname);
    console.log('📦 isPackaged:', app.isPackaged);
    
    mainWindow.loadURL(startUrl);
  } else {
    // Production: Load from packaged build folder
    // Use url.format to properly create file:// URL
    const indexPath = path.join(__dirname, '..', 'build', 'index.html');
    const startUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    
    console.log('🚀 Loading URL:', startUrl);
    console.log('📁 Index path:', indexPath);
    console.log('� __dirname:', __dirname);
    console.log('📦 isPackaged:', app.isPackaged);
    
    mainWindow.loadURL(startUrl);
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Storage path management
ipcMain.handle('get-storage-path', async () => {
  const storagePath = store.get('storagePath', app.getPath('userData'));
  return storagePath;
});

ipcMain.handle('set-storage-path', async (event, newPath) => {
  try {
    // Verify the path exists or create it
    await fs.mkdir(newPath, { recursive: true });
    store.set('storagePath', newPath);
    return { success: true, path: newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-storage-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Storage Directory'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    store.set('storagePath', selectedPath);
    return { success: true, path: selectedPath };
  }

  return { success: false, canceled: true };
});

// JSON file operations
ipcMain.handle('read-json-file', async (event, collection) => {
  try {
    const storagePath = store.get('storagePath', app.getPath('userData'));
    const dataDir = path.join(storagePath, 'offline-data');
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, `${collection}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      // File doesn't exist, return empty array
      if (error.code === 'ENOENT') {
        return { success: true, data: [] };
      }
      throw error;
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-json-file', async (event, collection, data) => {
  try {
    const storagePath = store.get('storagePath', app.getPath('userData'));
    const dataDir = path.join(storagePath, 'offline-data');
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, `${collection}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// PDF operations
ipcMain.handle('save-pdf', async (event, { filename, buffer }) => {
  try {
    const storagePath = store.get('storagePath', app.getPath('userData'));
    const pdfDir = path.join(storagePath, 'pdfs');
    await fs.mkdir(pdfDir, { recursive: true });

    const filePath = path.join(pdfDir, filename);
    await fs.writeFile(filePath, Buffer.from(buffer));
    
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Per-document save directories and silent save
ipcMain.handle('get-save-dirs', async () => {
  try {
    const saveDirs = store.get('saveDirs', {});
    return { success: true, data: saveDirs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-save-dir', async (event, docType) => {
  try {
    const allowed = ['buy', 'sell', 'advance', 'service'];
    if (!allowed.includes(docType)) return { success: false, error: 'Invalid docType' };

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: `Select folder to save ${docType} PDFs`
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      store.set(`saveDirs.${docType}`, selectedPath);
      return { success: true, path: selectedPath };
    }

    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-save-dir', async (event, docType, newPath) => {
  try {
    const allowed = ['buy', 'sell', 'advance', 'service'];
    if (!allowed.includes(docType)) return { success: false, error: 'Invalid docType' };
    await fs.mkdir(newPath, { recursive: true });
    store.set(`saveDirs.${docType}`, newPath);
    return { success: true, path: newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-pdf-to-dir', async (event, { filename, buffer, docType }) => {
  try {
    const allowed = ['buy', 'sell', 'advance', 'service'];
    if (!allowed.includes(docType)) return { success: false, error: 'Invalid docType' };

    const saveDirs = store.get('saveDirs', {});
    const targetDir = saveDirs[docType] || path.join(store.get('storagePath', app.getPath('userData')), 'pdfs');
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, Buffer.from(buffer));
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Clear a saved directory for a docType
ipcMain.handle('clear-save-dir', async (event, docType) => {
  try {
    const allowed = ['buy', 'sell', 'advance', 'service'];
    if (!allowed.includes(docType)) return { success: false, error: 'Invalid docType' };
    store.delete(`saveDirs.${docType}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-pdf-directory', async () => {
  try {
    const storagePath = store.get('storagePath', app.getPath('userData'));
    const pdfDir = path.join(storagePath, 'pdfs');
    await fs.mkdir(pdfDir, { recursive: true });
    
    const { shell } = require('electron');
    await shell.openPath(pdfDir);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// App settings
ipcMain.handle('get-app-setting', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-app-setting', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

// Export data for backup
ipcMain.handle('export-all-data', async () => {
  try {
    const storagePath = store.get('storagePath', app.getPath('userData'));
    const dataDir = path.join(storagePath, 'offline-data');
    
    const files = await fs.readdir(dataDir);
    const allData = {};
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const collectionName = file.replace('.json', '');
        allData[collectionName] = JSON.parse(content);
      }
    }
    
    return { success: true, data: allData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// PDF Template operations
ipcMain.handle('get-pdf-template', async (event, templateName) => {
  try {
    let templatePath;
    
    if (isDev) {
      // In development, templates are in public folder
      templatePath = path.join(__dirname, '..', 'public', 'templates', templateName);
    } else {
      // In production, templates are in build/templates folder
      templatePath = path.join(__dirname, '..', 'build', 'templates', templateName);
    }
    
    console.log('📄 Loading PDF template:', templatePath);
    
    const buffer = await fs.readFile(templatePath);
    return { success: true, data: Array.from(buffer) };
  } catch (error) {
    console.error('❌ Error loading PDF template:', error);
    return { success: false, error: error.message };
  }
});

// Read an arbitrary asset (image) from the app bundle or build output.
ipcMain.handle('read-asset', async (event, assetUrl) => {
  try {
    let assetPath = null;

    // If a file:// URL was provided, convert to a local path
    if (typeof assetUrl === 'string' && assetUrl.startsWith('file://')) {
      try {
        assetPath = url.fileURLToPath(assetUrl);
      } catch (e) {
        // fallback: strip file://
        assetPath = assetUrl.replace(/^file:\/\//, '');
      }
    } else if (typeof assetUrl === 'string' && assetUrl.startsWith('/')) {
      // leading slash - treat as path under build directory
      assetPath = path.join(__dirname, '..', 'build', assetUrl);
    } else if (typeof assetUrl === 'string') {
      // relative path like static/media/xxx.png or similar
      assetPath = path.join(__dirname, '..', 'build', assetUrl);
    }

    if (!assetPath) throw new Error('Unable to resolve asset path for: ' + assetUrl);

    const buffer = await fs.readFile(assetPath);
    return { success: true, data: Array.from(buffer) };
  } catch (error) {
    console.error('❌ read-asset failed for', assetUrl, error?.message || error);
    return { success: false, error: error.message };
  }
});
