# Troubleshooting Guide

## Common Errors and Solutions

### ✅ "Could not establish connection. Receiving end does not exist."

**Status**: FIXED in latest build

**What it means**: The background script tried to send a message to the content script before it was ready.

**Solution**:
1. Reload the extension in `chrome://extensions/`
2. The latest build includes retry logic and error handling
3. If you still see this error, it's harmless and won't affect functionality

---

### ✅ "Cannot use import statement outside a module"

**Status**: FIXED in latest build

**What it means**: Service worker wasn't declared as an ES module.

**Solution**: Already fixed in manifest.json with `"type": "module"`

---

### 🔧 "Manifest file is missing or unreadable"

**Cause**: You selected the wrong folder when loading the extension.

**Solution**:
1. Make sure you select the **`dist`** folder, not the `extension` folder
2. Path should be: `/Users/tejaskhare/Documents/Projects/NoteSynthesis/extension/dist`

---

### 🔧 Hotkey (Ctrl+Shift+S) Doesn't Work

**Possible Causes**:

1. **Some websites block extension shortcuts**
   - Chrome Web Store pages
   - chrome:// pages (like chrome://extensions/)
   - Some Google services

   **Solution**: Try on GitHub, Stack Overflow, or Wikipedia

2. **Keyboard shortcut conflict**

   **Solution**:
   - Go to `chrome://extensions/shortcuts`
   - Check if another extension uses the same key
   - Change the shortcut if needed

3. **Extension not loaded properly**

   **Solution**:
   - Go to `chrome://extensions/`
   - Check extension shows no errors
   - Try clicking the reload icon

---

### 🔧 Dark Overlay Appears But Can't Select

**Cause**: Content script CSS not loaded properly.

**Solution**:
1. Rebuild: `npm run build`
2. Reload extension in `chrome://extensions/`
3. Try on a different website

---

### 🔧 AI Analysis Fails / Returns Generic Message

**Possible Causes**:

1. **API key not configured**

   **Solution**:
   - Check `extension/utils/apiConfig.js`
   - Make sure `CLAUDE_API_KEY` is set to your actual key
   - Rebuild: `npm run build`
   - Reload extension

2. **API key invalid or expired**

   **Solution**:
   - Verify key at https://console.anthropic.com/
   - Generate new key if needed
   - Update `apiConfig.js`
   - Rebuild

3. **No internet connection**

   **Solution**: Check your internet connection

4. **API rate limit or quota exceeded**

   **Solution**:
   - Check usage at https://console.anthropic.com/
   - Wait a few minutes if rate limited
   - Add credits if quota exceeded

---

### 🔧 Screenshots Are Blank/Black

**Possible Causes**:

1. **Protected content (DRM)**
   - Netflix, Amazon Prime, etc. prevent screenshots

   **Solution**: This is by design, can't be fixed

2. **Hardware acceleration issue**

   **Solution**:
   - Try different browser window
   - Capture different content type

3. **Capturing too quickly**

   **Solution**: Wait 1-2 seconds after page loads before capturing

---

### 🔧 Extension Icon Not Visible

**Cause**: Extension icon hidden by default.

**Solution**:
1. Click the puzzle piece icon in Chrome toolbar
2. Find "AI Research Assistant"
3. Click the pin icon to show it permanently

---

### 🔧 Popup Doesn't Open

**Possible Causes**:

1. **No pending capture**

   **Solution**: Capture a screenshot first using Ctrl+Shift+S

2. **Popup blocked**

   **Solution**:
   - Right-click extension icon
   - Select "This can read and change site data" → "On all sites"

---

### 🔧 Images Not Showing in Document View

**Cause**: Images stored in IndexedDB might be cleared.

**Solutions**:

1. **Don't clear browser data**
   - Clearing browser data removes IndexedDB

2. **Download markdown file**
   - Click "Download" button in document view
   - This creates a portable file with embedded images

3. **Check browser console**
   - Press F12
   - Look for IndexedDB errors

---

### 🔧 Build Errors

#### `npm: command not found`

**Solution**: Install Node.js from https://nodejs.org/

#### `EACCES` permission errors

**Solution**:
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

#### Module not found errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### 🔧 Developer Mode Issues

#### Extension gets disabled

**Cause**: Chrome disables extensions in developer mode after browser restart.

**Solution**:
- This is normal behavior
- Re-enable the extension when prompted
- Or load it fresh each time

---

## Debug Mode

### Enable Verbose Logging

Open extension background service worker console:
1. Go to `chrome://extensions/`
2. Find "AI Research Assistant"
3. Click "service worker" link
4. Console opens with detailed logs

### Check Content Script

On any webpage:
1. Press F12 to open DevTools
2. Check Console for errors
3. Look for messages starting with "Content script..."

### Check Popup/Document

While popup/document is open:
1. Right-click in the popup/document
2. Select "Inspect"
3. DevTools opens for that specific page

---

## Still Having Issues?

### Verify Installation

Run through this checklist:

```bash
cd /Users/tejaskhare/Documents/Projects/NoteSynthesis/extension

# 1. Check Node version (should be 18+)
node -v

# 2. Rebuild from scratch
rm -rf dist node_modules
npm install
npm run build

# 3. Verify dist folder
ls -la dist/
# Should see: background.js, manifest.json, content/, popup/, document/, icons/

# 4. Check manifest
cat dist/manifest.json | grep "type"
# Should see: "type": "module"
```

### Test Basic Functionality

1. **Load extension**: Should load without errors
2. **Click icon**: Popup should open (even if no captures)
3. **Press hotkey on GitHub.com**: Overlay should appear
4. **Drag and select**: Selection rectangle should show
5. **Check service worker console**: Should see "Analyzing screenshot..."

### Get Console Logs

If reporting an issue, include:

1. **Background service worker console** (`chrome://extensions/` → service worker link)
2. **Page console** (F12 on the page where you're capturing)
3. **Popup console** (Right-click popup → Inspect)

---

## Performance Tips

### Extension Running Slow?

1. **Capture smaller regions** - Smaller images process faster
2. **Close unused tabs** - Saves memory
3. **Clear old captures** - Click "Clear All" in document view occasionally

### API Calls Taking Long?

- Normal response time: 2-5 seconds
- If longer: Check internet speed
- Check Anthropic API status: https://status.anthropic.com/

---

## Reset Everything

If all else fails, complete reset:

```bash
# 1. Remove extension from Chrome
# Go to chrome://extensions/ and click "Remove"

# 2. Clear browser data
# Chrome → Settings → Privacy → Clear browsing data
# Select "Cookies and site data"
# Select "Last hour"

# 3. Rebuild extension
cd /Users/tejaskhare/Documents/Projects/NoteSynthesis/extension
rm -rf dist node_modules package-lock.json
npm install
npm run build

# 4. Load fresh in Chrome
# chrome://extensions/ → Load unpacked → Select dist folder
```

---

## Common Questions

### Q: Do I need to rebuild after every change?

**A**:
- Yes, if you change `.js`, `.jsx`, or `.css` files
- Run `npm run build` or `npm run dev` (watch mode)
- Then reload extension in `chrome://extensions/`

### Q: Can I use this on Firefox or Safari?

**A**:
- Not currently - Chrome only
- Different extensions APIs on other browsers
- Would need separate implementation

### Q: Where is my data stored?

**A**:
- **Metadata**: Chrome Storage API (local to browser)
- **Images**: IndexedDB (local to browser)
- **Nothing in the cloud** - all local

### Q: Will my API key be shared?

**A**:
- No - API key stays on your computer
- Only used for direct calls to Anthropic API
- Never sent to any other server

---

## Getting Help

1. **Check this guide first**
2. **Check browser console** for specific errors
3. **Verify build succeeded** with `npm run build`
4. **Try complete reset** (instructions above)

---

## Useful Commands

```bash
# Rebuild extension
npm run build

# Watch mode (auto-rebuild)
npm run dev

# Check what's in dist
ls -la dist/

# View manifest
cat dist/manifest.json

# Clean build
rm -rf dist && npm run build

# Fresh start
rm -rf dist node_modules && npm install && npm run build
```

---

**Last Updated**: After fixing message passing errors
**Extension Version**: 1.0.0
