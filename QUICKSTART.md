# Quick Start Guide

## AI Research Assistant Chrome Extension

### 🚀 Get Started in 5 Minutes

#### Step 1: Navigate to Extension Directory
```bash
cd extension
```

#### Step 2: Run Setup Script
```bash
./setup.sh
```

This will:
- ✅ Check Node.js installation
- ✅ Install dependencies
- ✅ Verify API key configuration
- ✅ Create placeholder icons (if ImageMagick installed)
- ✅ Build the extension

#### Step 3: Configure API Key

Edit `extension/utils/apiConfig.js`:

```javascript
export const CLAUDE_API_KEY = 'sk-ant-...your-actual-key...';
```

Get your API key from: https://console.anthropic.com/

#### Step 4: Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension/dist` folder
5. Done! Extension icon should appear in your toolbar

---

### 📸 Using the Extension

#### Capture a Screenshot
1. Press **`Ctrl+Shift+S`** (Windows/Linux) or **`Cmd+Shift+S`** (Mac)
2. Drag to select the area you want to capture
3. Release mouse to capture

#### Review AI Explanation
1. Click the extension icon in toolbar
2. AI-generated explanation appears
3. Edit if needed
4. Choose or create a section
5. Click **"Accept"** to save

#### View Your Notes
1. Click extension icon
2. Click **"View Full Document"**
3. Your organized markdown notes open in new tab

#### Export Your Work
- **Download**: Get a `.md` file with embedded images
- **Copy**: Copy to clipboard for Notion, Obsidian, etc.

---

### 🛠️ Development Mode

For active development:

```bash
# Watch mode - auto-rebuilds on changes
npm run dev

# In Chrome: Go to chrome://extensions/ and click reload icon
```

---

### ⚠️ Troubleshooting

**Extension won't load?**
- Make sure you ran `npm run build`
- Check `dist/` folder exists
- Look for errors in `chrome://extensions/`

**Hotkey doesn't work?**
- Try on a different website (GitHub, Stack Overflow)
- Some sites block extension shortcuts
- Check conflicts at `chrome://extensions/shortcuts`

**AI fails?**
- Verify API key in `utils/apiConfig.js`
- Check console for errors (F12)
- Ensure internet connection
- Verify API credits at https://console.anthropic.com/

**No images in document?**
- Images stored in IndexedDB
- Use Download feature for portable version with embedded images

---

### 📚 Documentation

- **Full Setup Guide**: `extension/README.md`
- **Architecture**: `CLAUDE.md`
- **Specification**: `README.md`
- **Status**: `IMPLEMENTATION_STATUS.md`

---

### 🎯 What's Included

✅ Hotkey screenshot capture
✅ Drag-to-select region
✅ AI explanation with Claude Vision
✅ Section auto-suggestion
✅ Approval UI with editing
✅ Markdown document generation
✅ Download & copy to clipboard
✅ Auto-organization by topics

---

### 💰 API Costs

- Model: Claude Sonnet 4.5
- ~$0.005 per screenshot
- Free tier available for testing

---

### 🤝 Contributing

This is an MVP implementation. Future enhancements:
- Natural language search
- Flashcard generation
- OCR support
- Multi-browser support
- Cloud sync

See `IMPLEMENTATION_STATUS.md` for roadmap.

---

**Need help?** Check `extension/README.md` for detailed documentation.

**Happy capturing!** 📸✨
