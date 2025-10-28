# Testing Offline Sync - Debug Guide

## 🔍 Issue
Sell letter JSON offline mein save ho raha hai, but sync button dabane ke baad database mein add nahi ho raha hai.

## 🧪 Testing Steps with Logs

### Step 1: Start Fresh
```bash
# Terminal 1 - Backend
cd /Users/labh/Desktop/Projects/ok-motor/backend
npm start

# Terminal 2 - Frontend
cd /Users/labh/Desktop/Projects/ok-motor/frontend
npm start

# Terminal 3 - Electron (wait for React to load first)
cd /Users/labh/Desktop/Projects/ok-motor/frontend
npm run electron
```

### Step 2: Open Developer Tools
1. Electron app mein **Cmd+Option+I** (Mac) ya **F12** (Windows) press karein
2. Console tab kholein
3. Console ko clear karein

### Step 3: Go Offline
1. WiFi/Internet off karein
2. Settings page kholein
3. Verify: "Offline" status dikhega (red dot)

### Step 4: Create Sell Letter
1. **Sell → Create Sell Letter** pe jayein
2. Form fill karein with test data:
   - Seller Name: `Test Seller`
   - Registration Number: `TEST123`
   - Vehicle Name: `Test Bike`
   - Other required fields
3. **Save** button pe click karein
4. Success message dekhein

### Step 5: Check Console Logs
Console mein ye logs dikhnge chahiye:
```
📂 Reading sellLetters to find unsynced documents...
📊 Total documents in sellLetters: 1
📄 All documents in sellLetters: [...]
✅ Document created successfully
```

### Step 6: Check File System (Optional)
```bash
# Mac/Linux
cat ~/.ok-motor/data/sellLetters.json

# Should show your sell letter with:
# - "synced": false
# - "localOnly": true
```

### Step 7: Go Back Online
1. WiFi/Internet on karein
2. Settings page kholein
3. Wait 2-3 seconds
4. Verify: "Online" status dikhega (green dot)

### Step 8: Manual Sync
1. Settings page pe **"Sync Now"** button pe click karein
2. Console logs carefully dekhein

### Step 9: Expected Console Logs During Sync

#### ✅ Successful Sync Logs:
```
🚀 Initializing offline services in Electron...
✅ Offline services initialized successfully!

🔄 Starting sync for collection: sellLetters
📂 Reading sellLetters to find unsynced documents...
📊 Total documents in sellLetters: 1
📝 Unsynced documents details: [{...}]
📤 Syncing 1 documents from sellLetters to server...
📥 Server response for sellLetters: { success: true, syncedIds: [...] }
✅ Marking 1 documents as synced in sellLetters
```

#### ❌ Failed Sync Logs:
```
❌ Failed to get unsynced documents for sellLetters: [error]
OR
❌ Sync failed for sellLetters: [error]
OR
❌ Error syncing collection sellLetters: [error]
```

### Step 10: Verify in Database
1. Browser mein web app kholein (http://localhost:3000)
2. Login karein
3. **Sell Letter History** pe jayein
4. Test sell letter dikhna chahiye

## 🐛 Common Issues & Solutions

### Issue 1: "Total documents in sellLetters: 0"
**Meaning:** Sell letter save hi nahi hua offline
**Solution:** 
1. Check if Electron API available hai: `console.log(window.electronAPI)`
2. Check permissions for file write
3. Check storage path: Settings → Storage Location

### Issue 2: "Unsynced documents: 0" but file has data
**Meaning:** Documents mein `synced: true` already set hai
**Solution:**
```bash
# Manually check file
cat ~/.ok-motor/data/sellLetters.json

# If synced is true, manually set to false or delete file and retry
```

### Issue 3: Network Error during sync
**Logs:**
```
❌ Error syncing collection sellLetters: Network Error
```
**Solution:**
1. Check backend running hai: https://ok-motor-51l3.vercel.app/api/health
2. Check frontend axios baseURL
3. Check CORS settings

### Issue 4: Backend Sync Route Error
**Logs:**
```
📥 Server response: { success: false, message: "..." }
```
**Solution:**
1. Check backend console for errors
2. Check if sell letter model accepts all fields
3. Check validation errors

## 🔍 Manual Debug Commands

### Check Offline Storage
Open Electron DevTools Console:
```javascript
// Check if electronAPI exists
console.log(window.electronAPI);

// Get storage path
await window.electronAPI.getStoragePath();

// Read sell letters file
await window.electronAPI.readJsonFile('sellLetters');
```

### Check Network Status
```javascript
// Import network service (in console it won't work, but in code it will)
import networkService from './services/networkService';
console.log(networkService.getStatus());
```

### Force Sync
```javascript
// In Settings page or any component
import syncService from './services/syncService';
await syncService.forceSyncNow();
```

## 📝 What to Send Me

If sync still failing, please share:

1. **Full Console Logs** during sync (copy-paste from Electron DevTools)
2. **Backend Logs** from terminal where backend is running
3. **File Content**:
```bash
cat ~/.ok-motor/data/sellLetters.json
```
4. **Network Tab** - Check XHR request to `/api/sync/sellLetters`

## 🎯 Quick Test Script

Create a test file: `test-sync.js` in frontend root:
```javascript
// Test offline sync
const testSync = async () => {
  console.log('=== Starting Sync Test ===');
  
  // Check Electron
  if (!window.electronAPI) {
    console.error('❌ Not running in Electron!');
    return;
  }
  
  // Check storage
  const path = await window.electronAPI.getStoragePath();
  console.log('Storage path:', path);
  
  // Read sell letters
  const data = await window.electronAPI.readJsonFile('sellLetters');
  console.log('Sell letters:', data);
  
  // Check unsynced
  const unsynced = data.filter(doc => doc.synced === false);
  console.log('Unsynced:', unsynced.length);
  
  if (unsynced.length === 0) {
    console.log('✅ No documents to sync');
    return;
  }
  
  // Try sync
  console.log('Attempting sync...');
  // Import and use syncService here
  
  console.log('=== Test Complete ===');
};

// Run test
testSync();
```

## 📞 Next Steps

Agar logs mein koi specific error dikhe toh mujhe wo send karein. Main exact issue fix kar dunga!
