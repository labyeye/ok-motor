// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../public/index.html')}`;

  console.log('🚀 Loading URL:', startUrl);
  console.log('📁 __dirname:', __dirname);
  console.log('🔧 isDev:', isDev);

  mainWindow.loadURL(startUrl);

  // Always open DevTools to see console errors
  mainWindow.webContents.openDevTools();

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
