# Installation Instructions

## ✅ Extension is Built and Ready!

Your AI Research Assistant extension has been successfully built and is ready to load into Chrome.

---

## 📍 Extension Location

The built extension is in:
```
/Users/tejaskhare/Documents/Projects/NoteSynthesis/extension/dist
```

---

## 🚀 How to Load in Chrome

### Step 1: Open Chrome Extensions Page
1. Open Google Chrome
2. Type in the address bar: `chrome://extensions/`
3. Press Enter

### Step 2: Enable Developer Mode
1. Look for the **"Developer mode"** toggle in the top-right corner
2. Click to enable it (it should turn blue)

### Step 3: Load the Extension
1. Click the **"Load unpacked"** button (top-left area)
2. Navigate to: `/Users/tejaskhare/Documents/Projects/NoteSynthesis/extension/dist`
3. Click **"Select"** or **"Open"**

### Step 4: Verify Installation
You should see:
- ✅ "AI Research Assistant" appears in your extensions list
- ✅ Extension icon appears in your Chrome toolbar (may need to click the puzzle piece icon to pin it)
- ✅ No errors in red text

---

## 🎯 How to Use

### Capture a Screenshot
1. Navigate to any website (try GitHub, Stack Overflow, or a tutorial)
2. Press **`Ctrl+Shift+S`** (Windows/Linux) or **`Cmd+Shift+S`** (Mac)
3. You'll see a dark overlay with crosshair cursor
4. **Drag** to select the area you want to capture
5. **Release** to capture

### Review AI Explanation
1. Click the extension icon in your toolbar
2. You'll see:
   - Your screenshot preview
   - AI-generated explanation
   - Suggested section name
3. You can:
   - Edit the explanation
   - Change the section
   - Accept or Reject

### View Your Document
1. Click the extension icon
2. Click **"View Full Document"**
3. Your organized notes open in a new tab
4. Use toolbar buttons to:
   - **Download** - Get .md file with embedded images
   - **Copy** - Copy to clipboard for Notion/Obsidian
   - **Clear All** - Delete all captures

---

## ⚠️ IMPORTANT: API Key Security

**Your API key is currently in the code!**

### What You Need to Do:

1. **Rotate your API key immediately**:
   - Go to https://console.anthropic.com/
   - Delete the key you shared: `sk-ant-api03-RiFwxfaFJtcVEhawKoVt7gqah0riModM3R...`
   - Create a NEW key

2. **Update the extension** with the new key:
   - Edit: `extension/utils/apiConfig.js`
   - Replace with your NEW key
   - Run: `npm run build`
   - Reload extension in Chrome (click refresh icon in `chrome://extensions/`)

### Why This Matters:
- API keys posted in chat/public can be stolen
- Unauthorized users could rack up charges on your account
- Always treat API keys like passwords - never share them

---

## 🐛 Troubleshooting

### Extension won't load?
- **Error**: "Manifest file is missing"
  - **Fix**: Make sure you selected the `dist` folder, not the `extension` folder

- **Error**: Warnings about icons
  - **Fix**: Icons are placeholders and will work fine for testing. Create proper icons later for production.

### Hotkey doesn't work?
- Some websites block extension shortcuts (e.g., Google Docs)
- Try on: GitHub, Stack Overflow, Wikipedia, or news sites
- Check for conflicts: `chrome://extensions/shortcuts`

### AI analysis fails?
- Check browser console (F12 → Console tab)
- Verify API key is correct in `utils/apiConfig.js`
- Check internet connection
- Verify API credits at https://console.anthropic.com/

### Screenshots are blank?
- Some content (like Netflix) can't be captured due to DRM
- Try capturing different types of content
- Works best with: documentation, tutorials, code snippets, diagrams

### Images not showing in document?
- Images are stored in browser's IndexedDB
- Click **Download** to get a portable .md file with embedded images
- Don't clear browser data or you'll lose images

---

## 📊 Verification Checklist

Before using, verify:
- [ ] Extension loaded without errors
- [ ] Extension icon visible in toolbar
- [ ] API key configured in `utils/apiConfig.js`
- [ ] Can open popup by clicking icon
- [ ] Hotkey works (test on GitHub.com)

---

## 🎓 Quick Test

1. Open https://github.com/
2. Press `Ctrl+Shift+S` (or `Cmd+Shift+S`)
3. Drag to select GitHub logo and navigation
4. Wait for AI analysis (3-5 seconds)
5. Click extension icon to review
6. Edit if desired, then click "Accept"
7. Click "View Full Document"
8. See your first capture!

---

## 💰 Cost Information

- Model: Claude Sonnet 4.5
- Cost: ~$0.005 per screenshot (half a cent)
- Free tier: Available for testing
- Monitor usage: https://console.anthropic.com/

---

## 🔧 Development Mode

If you make changes to the code:

```bash
cd /Users/tejaskhare/Documents/Projects/NoteSynthesis/extension

# Watch mode (auto-rebuild on changes)
npm run dev

# Then reload extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Click reload icon on "AI Research Assistant"
```

---

## 📚 Documentation

- **Quick Start**: `../QUICKSTART.md`
- **Full Guide**: `README.md`
- **Architecture**: `../CLAUDE.md`
- **Status**: `../IMPLEMENTATION_STATUS.md`

---

## ✨ Features Available

✅ Drag-to-select screenshot capture
✅ AI explanation with Claude Vision
✅ Section auto-suggestion
✅ Edit explanations before saving
✅ Create custom sections
✅ Auto-organized markdown document
✅ Download as .md file
✅ Copy to clipboard
✅ Source URL tracking
✅ Timestamp metadata

---

## 🎉 You're Ready!

The extension is fully built and ready to use. Just:
1. Load it in Chrome (steps above)
2. Rotate your API key (security!)
3. Start capturing and organizing your research!

Happy capturing! 📸✨
