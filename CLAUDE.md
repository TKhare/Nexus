# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered Chrome browser extension that acts as a research assistant. It allows users to capture screenshots via hotkey + drag interaction, enriches them with AI-generated explanations using Claude's vision API, and automatically builds organized markdown documents.

**Core Value Proposition**: AI does the cognitive work of explaining and contextualizing captures; users simply approve or reject suggestions.

## Development Commands

This project is currently in **specification phase** - no code has been implemented yet. The following commands will be relevant once development begins:

### Initial Setup (when implementation starts)
```bash
# Create extension directory structure
mkdir -p extension/{background,content,popup,document,utils}

# Chrome extension development
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the extension/ directory
```

### Testing
- Manual testing via Chrome extension developer mode
- Test hotkey: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- Use Chrome DevTools to debug content scripts and background service worker
- Check `chrome://extensions/` errors tab for runtime issues

## Architecture Overview

### Technology Stack
- **Chrome Extension (Manifest V3)**: Core platform
- **Claude API (Anthropic)**: AI vision + text generation for screenshot analysis
- **Chrome Storage API**: Local persistence (no external database)
- **Vanilla JavaScript or React**: Keep implementation lightweight
- **marked.js or showdown.js**: Markdown rendering

### Extension Structure
```
extension/
├── manifest.json          # Manifest V3 configuration
├── background.js          # Service worker (hotkey listener, screenshot capture)
├── content/
│   ├── content.js        # Inject capture UI overlay into web pages
│   └── content.css       # Overlay styling (dim screen, crosshair cursor)
├── popup/
│   ├── popup.html        # Approval UI (accept/edit/reject AI suggestions)
│   ├── popup.js          # Handle user approval actions
│   └── popup.css         # Popup styling
├── document/
│   ├── document.html     # Document view tab (rendered markdown)
│   ├── document.js       # Markdown rendering and export
│   └── document.css      # Document styling
└── utils/
    ├── ai.js            # Claude API wrapper for screenshot analysis
    ├── storage.js       # Chrome storage helpers
    └── markdown.js      # Markdown generation and document building
```

### Core Workflow (5-Component Architecture)

1. **Capture System** (`background.js` + `content/content.js`)
   - Listens for `Ctrl+Shift+S` hotkey via Chrome commands API
   - Injects overlay with drag-to-select UI
   - Captures visible tab region using `chrome.tabs.captureVisibleTab()`
   - Crops to selected region using Canvas API

2. **AI Analysis** (`utils/ai.js`)
   - Sends screenshot to Claude API with vision capability
   - Receives 2-3 sentence explanation + suggested section name
   - Response format: `{ "explanation": "...", "suggested_section": "..." }`

3. **Human Approval** (`popup/popup.html` + `popup/popup.js`)
   - Shows screenshot preview + AI explanation
   - User can: Accept, Edit explanation, Choose different section, or Reject
   - Editable contenteditable div for AI explanation

4. **Document Building** (`utils/markdown.js`)
   - Auto-organizes captures by section (topic-based grouping)
   - Embeds screenshots as base64 data URIs
   - Adds metadata: timestamp, source URL
   - Chronological order within each section

5. **Export** (`document/document.js`)
   - Download as `.md` file
   - Copy to clipboard for pasting into Notion, Obsidian, etc.

### Data Flow
```
User presses hotkey
  → background.js sends message to content.js
  → content.js shows overlay + drag selection
  → User drags to select region
  → background.js captures visible tab
  → Canvas crops to selected region
  → utils/ai.js sends to Claude API
  → popup.html shows preview + AI explanation
  → User approves
  → utils/markdown.js adds to document
  → chrome.storage.local persists captures
  → document.html renders markdown view
```

## Implementation Priority

**CRITICAL: Follow phased approach strictly**

### Phase 1: MVP Only (Build These First)
1. Hotkey listener (`Ctrl+Shift+S`)
2. Drag-to-select screenshot capture
3. AI explanation generation via Claude API
4. Accept/Edit/Reject approval UI
5. Markdown document building with auto-sections
6. Document view in extension tab
7. Download markdown file
8. Copy to clipboard

### Phase 2+: Post-MVP Features (DO NOT BUILD INITIALLY)
Everything in the "Advanced Features" section of README.md is explicitly out of scope until MVP is validated. This includes:
- Natural language search
- OCR for handwritten notes
- LaTeX extraction
- PDF export
- Cross-linking between captures
- Flashcard generation
- Notion/Roam/Obsidian API integrations

## Key Technical Decisions

### API Key Management
- **MVP**: User provides their own Claude API key, stored in `chrome.storage.sync`
- **Security Note**: Keys visible in extension storage; post-MVP requires proper key management

### Image Storage Strategy
- **MVP**: Base64 embedding in markdown (< 20 captures, < 5MB Chrome storage limit)
- **Production**: Use Chrome FileSystem API or external storage for larger documents
- **Consideration**: Implement image compression to reduce size

### Section Organization
- AI auto-generates section names from content (e.g., "Neural Networks", "React Hooks")
- Groups semantically related captures together
- User can override AI suggestion via dropdown in approval UI

### Error Handling Strategy
```javascript
// If Claude API fails, fallback to manual input
try {
  const result = await analyzeScreenshot(image);
} catch (error) {
  showManualInputUI(); // Let user write explanation manually
}
```

## Claude API Integration

### Required Permissions
- Model: `claude-sonnet-4-5-20250929` (or latest vision-capable model)
- Endpoint: `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`

### Request Format
```javascript
{
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Image // Without data:image/png;base64, prefix
        }
      },
      {
        type: 'text',
        text: `Analyze this screenshot and provide:
1. A clear 2-3 sentence explanation of what this shows
2. What topic/section this relates to

Format response as JSON:
{
  "explanation": "...",
  "suggested_section": "..."
}`
      }
    ]
  }]
}
```

### AI Content Analysis Capabilities
- **Diagrams**: Explains components and relationships
- **Code snippets**: Explains functionality and purpose
- **Text/definitions**: Summarizes key points
- **Equations**: Describes what equation represents (no LaTeX extraction in MVP)
- **UI screenshots**: Describes interface or workflow

## Chrome Extension Permissions Required

```json
{
  "permissions": [
    "activeTab",      // Capture visible tab
    "storage",        // Persist captures and API key
    "downloads"       // Download markdown file
  ],
  "host_permissions": [
    "https://*/*"     // Access to all HTTPS sites for capturing
  ]
}
```

## Markdown Output Format

```markdown
# Research Notes
*Last updated: Oct 17, 2025*

## [Section Name from AI]

![Screenshot](data:image/png;base64,...)
*Captured from: https://source-url.com*

[AI-generated explanation - 2-3 sentences]

---

[Next capture in same section...]

---

## [Different Section]

[More captures...]
```

## Performance Targets
- AI analysis response time: < 3 seconds
- Show loading indicator during AI processing
- Capture-to-approval workflow: 3-5 seconds total
- Old manual workflow: 30-60 seconds (baseline to beat)

## Success Metrics
- **Core metric**: Time from capture to notes (target: < 5 seconds)
- **Quality metric**: AI explanation acceptance rate (target: > 80%)
- **Engagement metric**: Number of captures per research session
- **Value metric**: Users actually download/use the generated document

## Common Gotchas

1. **Base64 Image Size**: Chrome storage limits (5MB sync, 10MB local). Base64 encoding inflates image size by ~33%.

2. **Content Script Injection**: Must wait for tab to fully load before injecting overlay. Use `chrome.tabs.onUpdated` or `document.readyState`.

3. **Manifest V3 Service Workers**: Background scripts are ephemeral. Cannot maintain long-lived state. Use `chrome.storage.local` for persistence.

4. **CORS with Claude API**: API calls must originate from background script or use proper CORS headers.

5. **Screenshot Capture Timing**: `chrome.tabs.captureVisibleTab()` captures current viewport. Ensure overlay is hidden before capture to avoid capturing the overlay itself.

6. **Hotkey Conflicts**: `Ctrl+Shift+S` may conflict with browser/OS shortcuts. Provide customization in extension options.

## Development Workflow

1. **Start with capture mechanism**: Get hotkey + drag selection working first
2. **Mock AI responses**: Hardcode example explanations to test approval UI
3. **Integrate real Claude API**: Replace mocks once UI is stable
4. **Build document view last**: Focus on capture → approval loop first
5. **Polish incrementally**: Make core loop work, then improve UX

## Testing Strategy

### Manual Testing Checklist
- [ ] Hotkey triggers capture mode on active tab
- [ ] Overlay dims screen with crosshair cursor
- [ ] Drag selection creates visible rectangle
- [ ] Screenshot captures correct region
- [ ] Claude API returns explanation + section
- [ ] Approval UI displays correctly
- [ ] Accept adds to document in correct section
- [ ] Reject discards capture
- [ ] Edit allows modifying AI explanation
- [ ] Document view renders markdown correctly
- [ ] Download creates valid .md file
- [ ] Copy to clipboard works

### Edge Cases to Test
- Very large screenshots (> 1MB)
- Very small screenshots (< 100px)
- Screenshots of dynamic content (videos, animations)
- Multiple rapid captures in succession
- API failures / timeout handling
- Storage quota exceeded scenarios
- Extension reload while capture in progress

## Not in Scope for MVP

The following are **explicitly excluded** from initial implementation:
- OCR text extraction
- Handwritten note recognition
- LaTeX equation parsing
- PDF generation
- Cross-platform support (Firefox, Safari)
- Backend server / authentication
- Multi-user collaboration
- Browser bookmark integration
- Mobile companion app
- Integration APIs for note-taking apps

Focus exclusively on the core capture → AI explain → approve → markdown document workflow.
