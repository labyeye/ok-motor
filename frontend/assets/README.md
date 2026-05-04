# Icon Files Needed

To build the Electron app with a custom icon, you need to add icon files to the `frontend/assets/` folder.

## required Files:

1. **icon.icns** - For Mac builds
2. **icon.ico** - For Windows builds
3. **icon.png** - For Linux builds

## How to Create Icons:

### Option 1: Use a Template Icon (Quick Start)

For now, the app will build without custom icons. Electron Builder will use default icons.

### Option 2: Create Your Own Icons

#### Starting Point:

Create a **512x512 pixel PNG** image with your logo/icon.

#### Convert to required Formats:

**On Mac:**

```bash
# Install ImageMagick
brew install imagemagick

# Convert PNG to .icns (Mac)
mkdir icon.iconset
for size in 16 32 64 128 256 512; do
  sips -z $size $size your-icon.png --out icon.iconset/icon_${size}x${size}.png
done
iconutil -c icns icon.iconset -o assets/icon.icns
rm -rf icon.iconset

# Convert PNG to .ico (Windows)
convert your-icon.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico

# Copy PNG for Linux
cp your-icon.png assets/icon.png
```

**On Windows:**

```bash
# Use online converter for .ico:
# 1. Go to https://convertio.co/png-ico/
# 2. Upload your 512x512 PNG
# 3. Download the .ico file
# 4. Save to frontend/assets/icon.ico

# For .icns (Mac icon), use online converter:
# 1. Go to https://cloudconvert.com/png-to-icns
# 2. Upload your 512x512 PNG
# 3. Download the .icns file
# 4. Save to frontend/assets/icon.icns

# Copy PNG for Linux
copy your-icon.png assets\icon.png
```

### Option 3: Use Default Icons

If you don't add custom icons, Electron Builder will use default Electron icons. The app will still work perfectly!

## Current Status:

**Status:** ⚠️ Custom icons not added yet

**Impact:** App will build and work fine, but will use default Electron icon

**To add icons later:**

1. Create your icon files (see above)
2. Place them in `frontend/assets/`
3. Rebuild the app with `npm run electron:build:mac` or `npm run electron:build:win`

## Icon Specifications:

| Platform | File      | Format | Size                       |
| -------- | --------- | ------ | -------------------------- |
| Mac      | icon.icns | ICNS   | 512x512 (multi-resolution) |
| Windows  | icon.ico  | ICO    | 256x256 (multi-resolution) |
| Linux    | icon.png  | PNG    | 512x512                    |

## Notes:

- Icons should have transparent backgrounds
- Use simple, recognizable designs
- Test at different sizes (16x16, 32x32, etc.)
- PNG should be high quality (no compression artifacts)
