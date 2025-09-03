# Cache Issues and Solutions

## Problem: `cmd+r` vs `cmd+shift+r` Behavior

### Root Cause
The application uses a Service Worker for PWA functionality, which caches JavaScript bundles and other assets. This causes inconsistent behavior between:
- **`cmd+r` (normal refresh)**: Uses cached assets, may serve old code
- **`cmd+shift+r` (hard refresh)**: Bypasses cache, loads fresh assets

### Solutions Implemented

#### 1. **Development Mode Service Worker Bypass**
- Service Worker is disabled in development mode (`NODE_ENV === 'development'`)
- Prevents cache interference during development

#### 2. **Dynamic Cache Versioning**
- Cache names now include timestamps: `ok-motor-static-v{timestamp}`
- Ensures caches are invalidated when the service worker updates

#### 3. **Aggressive Cache Clearing**
- `forceUpdate()` method unregisters service worker and clears all caches
- Used when service worker updates are detected

#### 4. **Development Shortcuts**
- **Ctrl+Shift+C**: Manually clear all caches and reload
- Useful for development debugging

#### 5. **Enhanced Debugging**
- Authentication state logging in development mode
- Better error visibility for cache-related issues

## Manual Solutions

If you still experience cache issues:

1. **Hard Refresh**: `cmd+shift+r` (or Ctrl+Shift+R on Windows/Linux)
2. **Clear Browser Data**: Clear site data for localhost:3000
3. **Development Shortcut**: Press `Ctrl+Shift+C` in the browser
4. **Disable Service Worker**: Check Application tab in DevTools and unregister SW

## Production Behavior

In production, the service worker provides proper caching and offline functionality. The cache versioning ensures users get updates when the app version changes.
