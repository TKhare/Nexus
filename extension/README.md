# AI Research Assistant - Chrome Extension

> Capture screenshots with AI-generated explanations and build organized markdown notes

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Chrome browser
- Claude API key from Anthropic (https://console.anthropic.com/)

### 2. Installation

```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install
```

### 3. Configure API Key

Edit `utils/apiConfig.js` and add your Claude API key:

```javascript
export const CLAUDE_API_KEY = 'your-actual-api-key-here';
```

> **Important:** This file is gitignored. Never commit your API key.

### 4. Build the Extension

```bash
# Development build (watch mode)
npm run dev

# Production build
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 5. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/dist` folder
5. The extension should now appear in your toolbar

### 6. Add Icons (Optional but Recommended)

Create three icon files in `public/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

See `public/icons/README.md` for quick creation methods.

## Usage

### Capture a Screenshot

1. Press **Ctrl+Shift+S** (Windows/Linux) or **Cmd+Shift+S** (Mac)
2. Drag to select the area you want to capture
3. Release to capture

### Review and Approve

1. Click the extension icon in your toolbar
2. Review the AI-generated explanation
3. Edit the explanation if needed
4. Change the section if desired
5. Click "Accept" to save or "Reject" to discard

### View Your Document

1. Click the extension icon
2. Click "View Full Document"
3. Your organized markdown notes will open in a new tab

### Export Your Notes

In the document view:
- **Download**: Get a `.md` file with embedded images
- **Copy**: Copy markdown to clipboard for pasting into Notion, Obsidian, etc.

## Development

### Project Structure

```
extension/
├── manifest.json              # Extension configuration
├── package.json              # Dependencies
├── vite.config.js            # Build configuration
├── background.js             # Service worker (hotkey, capture orchestration)
├── content/
│   ├── index.jsx            # Content script entry
│   ├── CaptureOverlay.jsx   # Screenshot selection UI
│   └── content.css          # Overlay styling
├── popup/
│   ├── popup.html           # Popup entry point
│   ├── index.jsx            # React root
│   ├── Popup.jsx            # Main popup component
│   ├── ApprovalCard.jsx     # Screenshot preview + explanation
│   ├── SectionSelector.jsx  # Section chooser
│   └── popup.css            # Popup styling
├── document/
│   ├── document.html        # Document view entry point
│   ├── index.jsx            # React root
│   ├── Document.jsx         # Main document component
│   ├── Toolbar.jsx          # Download, copy, clear buttons
│   ├── MarkdownRenderer.jsx # Markdown display
│   └── document.css         # Document styling
├── utils/
│   ├── ai.js               # Claude API integration
│   ├── apiConfig.js        # API key configuration
│   ├── storage.js          # Chrome storage helpers
│   ├── imageStorage.js     # IndexedDB image storage
│   ├── markdown.js         # Markdown generation
│   └── capture.js          # Screenshot utilities
├── models/
│   └── Capture.js          # Capture data model
└── public/
    └── icons/              # Extension icons
```

### Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Chrome Extension Manifest V3** - Extension platform
- **Claude API (Anthropic)** - AI vision and text generation
- **IndexedDB** - Image storage
- **Chrome Storage API** - Metadata persistence
- **react-markdown** - Markdown rendering

### Development Workflow

1. **Make changes** to source files
2. **Build** runs automatically in watch mode (`npm run dev`)
3. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension
4. **Test** the feature
5. **Repeat**

### Key Files to Modify

- **AI Behavior**: `utils/ai.js` - Modify prompts or analysis logic
- **Markdown Format**: `utils/markdown.js` - Change document structure
- **UI Styling**: CSS files in each component folder
- **Capture Logic**: `background.js` and `content/CaptureOverlay.jsx`

## Troubleshooting

### Extension doesn't load
- Make sure you ran `npm run build`
- Check the `dist/` folder exists
- Look for errors in `chrome://extensions/` errors tab

### Hotkey doesn't work
- Some websites block extension keyboard shortcuts
- Try on a different website (e.g., GitHub, Stack Overflow)
- Check Chrome keyboard shortcut conflicts in `chrome://extensions/shortcuts`

### AI analysis fails
- Verify your API key in `utils/apiConfig.js`
- Check browser console for error messages
- Ensure you have internet connection
- Check API key has credits at https://console.anthropic.com/

### Screenshots are black
- Some websites use canvas elements that can't be captured
- Try capturing different content
- Check Chrome permissions for the site

### Images not showing in document
- Images are stored in IndexedDB and retrieved via blob URLs
- Clear browser cache if images disappear
- For portability, use the Download function which embeds images

## Features Implemented

✅ Hotkey screenshot capture (Ctrl+Shift+S / Cmd+Shift+S)
✅ Drag-to-select region
✅ AI explanation generation with Claude Vision
✅ AI section suggestion
✅ Approval UI with edit capability
✅ Section management (choose or create new)
✅ Markdown document generation
✅ Document view with rendering
✅ Download as .md file (with embedded images)
✅ Copy to clipboard
✅ Auto-organization by sections
✅ Source URL tracking
✅ Timestamp metadata
✅ Image storage in IndexedDB
✅ Clear all captures

## Future Enhancements (Post-MVP)

- [ ] Natural language search
- [ ] Cross-linking between captures
- [ ] Session summaries
- [ ] Spaced repetition / flashcards
- [ ] OCR for handwritten notes
- [ ] LaTeX extraction
- [ ] PDF export with styling
- [ ] Firefox/Safari support
- [ ] Mobile companion app
- [ ] Notion/Roam/Obsidian API integration

## API Usage Notes

### Claude API Costs

- Model: `claude-sonnet-4-5-20250929`
- Approximate cost: $3 per 1M input tokens, $15 per 1M output tokens
- Average capture: ~1,500 tokens (input image) + ~200 tokens (output)
- Estimated: $0.005 per screenshot

### Rate Limits

- Free tier: Limited requests per minute
- Paid tier: Higher limits
- Implement request queuing for bulk captures (future enhancement)

## Security Notes

⚠️ **Never commit `utils/apiConfig.js` with your API key**

For production:
1. Implement user-provided API keys via extension options page
2. Store keys securely in `chrome.storage.sync`
3. Add key validation
4. Provide clear setup instructions

## License

MIT License - See parent directory for details

## Support

For bugs or feature requests, please open an issue in the main repository.
