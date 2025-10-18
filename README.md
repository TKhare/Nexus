# AI Note-Taking Assistant - Browser Extension Specification

## Overview

An intelligent browser extension that acts as a research assistant, automatically enriching captured screenshots with AI-generated explanations and organizing them into a markdown document. The core innovation is that AI does the cognitive work of explaining and contextualizing what you capture, while you simply approve or reject its suggestions.

## Core Problem

When professionals learn from multiple sources in their browser (papers, documentation, tutorials, Stack Overflow, videos), they face two key challenges:
1. **Capture friction**: Manually writing explanations and context for everything they capture breaks their flow
2. **Synthesis difficulty**: Turning scattered screenshots into a useful, organized reference document requires significant cognitive effort

## Solution

A browser extension where users can quickly capture screenshots with a hotkey and drag interaction. AI immediately enriches the capture with explanations and suggests where it fits in their markdown document. Users approve/edit/reject with one click, building a high-quality reference document effortlessly.

---

## ⚠️ IMPLEMENTATION PRIORITY

### Phase 1: Core MVP (Build These ONLY)

**Essential features to implement first:**
1. Hotkey listener (Ctrl+Shift+S or Cmd+Shift+S)
2. Drag-to-select screenshot capture
3. AI explanation generation via Claude API
4. Accept/Edit/Reject approval UI
5. Markdown document building with auto-sections
6. Document view in extension sidebar/tab
7. Download markdown file
8. Copy markdown to clipboard

**Technology constraints:**
- Chrome Extension (Manifest V3) only
- Claude API for AI (Anthropic)
- Chrome Storage API for persistence (no external database)
- Vanilla JavaScript or React (keep simple)
- Markdown output ONLY (no PDF, LaTeX, etc.)

### Phase 2: Post-MVP Features (DO NOT BUILD INITIALLY)

Everything in the "Advanced Features" section below is **EXPLICITLY OUT OF SCOPE** for the initial implementation. Only build core workflow first, validate it works, then consider additions.

---

## Core User Flow

### 1. Capture Stage

**User action:**
1. Presses global hotkey: **Ctrl+Shift+S** (Windows/Linux) or **Cmd+Shift+S** (Mac)
2. Screen dims with semi-transparent overlay
3. Cursor becomes crosshair (+)
4. User drags to select rectangular region (like native screenshot tools)
5. Selected area is highlighted
6. User releases mouse → capture happens

**Technical implementation:**
- Content script injected into active tab
- CSS overlay with `pointer-events: none` except on selection div
- Canvas API to capture selected region from `chrome.tabs.captureVisibleTab()`
- Convert to base64 PNG

### 2. AI Enrichment Stage

**What happens automatically:**
1. Screenshot sent to Claude API with vision
2. AI analyzes image and provides explanation
3. AI suggests which document section this belongs to (based on content)

**AI prompt template:**
```
Analyze this screenshot and provide:
1. A clear 2-3 sentence explanation of what this shows
2. What topic/section this relates to (e.g., "Neural Networks", "React Hooks", "Database Design")

Be concise and educational. Focus on what would be useful in study notes.

Format response as JSON:
{
  "explanation": "...",
  "suggested_section": "..."
}
```

**AI handles different content types intelligently:**
- **Diagrams**: Explains components and their relationships
- **Code snippets**: Explains what the code does and why
- **Text/definitions**: Summarizes key points
- **Equations**: Explains what the equation represents (no LaTeX extraction in MVP)
- **UI screenshots**: Describes the interface or workflow shown

### 3. Human Approval Stage

**UI appears as popup or sidebar panel:**

```
┌─────────────────────────────────────────────┐
│ [Screenshot preview]                        │
│                                             │
│ AI Explanation:                             │
│ "This diagram shows the forward pass in a   │
│ neural network. Input flows through hidden  │
│ layers with weights and activations to      │
│ produce output predictions."                │
│                                             │
│ → Adding to section: "Neural Networks"      │
│                                             │
│ [Accept]  [Different Section ▼]  [Reject]  │
└─────────────────────────────────────────────┘
```

**User options:**
- **Accept**: Add to document in suggested section (most common action)
- **Different Section**: Dropdown to choose or create new section (only if needed)
- **Reject**: Discard this capture
- **Edit**: Click explanation text to modify before accepting (inline editing)

**Design principle:** Default to smart auto-placement. User can override but most won't need to.

### 4. Document Building Stage

**AI automatically generates markdown:**
- Creates section headers based on suggested topics
- Inserts captures in chronological order within sections
- Embeds screenshots as base64 data URIs or references
- Adds metadata (timestamp, source URL)
- Maintains consistent formatting

**Markdown structure:**
```markdown
# Research Notes
*Last updated: Oct 17, 2025*

## Neural Networks

![Screenshot 1](data:image/png;base64,...)
*Captured from: https://course.site/lesson-3*

This diagram shows the forward pass in a neural network. Input flows through hidden layers with weights and activations to produce output predictions.

---

![Screenshot 2](data:image/png;base64,...)
*Captured from: https://docs.pytorch.org/...*

This code implements backpropagation using PyTorch's autograd. The backward() method computes gradients automatically through the computation graph.

---

## React Hooks

![Screenshot 3](data:image/png;base64,...)
*Captured from: https://react.dev/...*

The useEffect hook runs side effects after render. The dependency array controls when the effect re-runs.

---
```

---

## Key AI Capabilities (MVP Scope)

### Smart Content Analysis
- Recognizes content type (diagram, code, text, equation, UI)
- Generates appropriate explanation style for each type
- Suggests relevant section based on semantic understanding

### Intelligent Organization
- Auto-generates document sections based on captured topics
- Groups related captures together
- Creates new sections when encountering new topics
- Maintains logical hierarchy (all captures under appropriate headers)

### What AI Does NOT Do (Out of Scope for MVP)
- ❌ OCR extraction
- ❌ Handwritten note recognition

---

## Document Features (MVP)

### Auto-Formatting
- Screenshots embedded with proper markdown image syntax
- Section headers auto-generated (## Section Name)
- Horizontal rules (---) between captures for readability
- Source URL and timestamp metadata for each capture
- Consistent spacing and structure

### Export Options (ONLY 2 Required)

**1. Download Markdown File**
```javascript
downloadMarkdown() {
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: `research-notes-${Date.now()}.md`
  });
}
```

**2. Copy to Clipboard**
```javascript
copyToClipboard() {
  navigator.clipboard.writeText(markdownContent);
  showNotification("✓ Copied to clipboard - paste into Notion, Obsidian, etc.");
}
```

**That's it. No PDF, no LaTeX, no Notion API integration for MVP.**

### Document Viewing
- Sidebar panel or dedicated tab showing rendered markdown
- Simple markdown rendering (use marked.js or similar)
- Clean, readable styling
- Scroll to latest capture after adding

---

## Technical Architecture

### Chrome Extension Structure

```
extension/
├── manifest.json              # Extension configuration
├── background.js             # Service worker (hotkey listener)
├── content/
│   ├── content.js           # Inject capture UI into pages
│   └── content.css          # Overlay and selection styling
├── popup/
│   ├── popup.html           # Approval UI
│   ├── popup.js             # Handle accept/reject/edit
│   └── popup.css            # Styling
├── document/
│   ├── document.html        # Document view tab
│   ├── document.js          # Render markdown
│   └── document.css         # Document styling
└── utils/
    ├── ai.js               # Claude API wrapper
    ├── storage.js          # Chrome storage helpers
    └── markdown.js         # Markdown generation
```

### manifest.json (Key Sections)

```json
{
  "manifest_version": 3,
  "name": "AI Research Assistant",
  "version": "1.0",
  "permissions": [
    "activeTab",
    "storage",
    "downloads"
  ],
  "host_permissions": [
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content/content.js"],
    "css": ["content/content.css"]
  }],
  "action": {
    "default_popup": "popup/popup.html"
  },
  "commands": {
    "capture-screenshot": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Capture screenshot"
    }
  }
}
```

### Core Technologies

**Required:**
- Chrome Extension API (tabs, storage, commands, downloads)
- Claude API (vision + text generation)
- Markdown rendering library (marked.js or showdown.js)
- Vanilla JavaScript or React (keep lightweight)

**NOT required:**
- No backend server
- No database (use Chrome Storage API)
- No authentication system
- No OCR libraries
- No PDF generation libraries

---

## Implementation Guide

### Step 1: Screenshot Capture (Hours 0-6)

**File: content/content.js**
```javascript
// Listen for hotkey from background script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'startCapture') {
    initScreenshotMode();
  }
});

function initScreenshotMode() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'screenshot-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; 
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.3);
    cursor: crosshair; z-index: 999999;
  `;
  
  let startX, startY;
  const selection = document.createElement('div');
  
  overlay.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    // Create selection rectangle
  });
  
  overlay.addEventListener('mousemove', (e) => {
    // Update selection rectangle size
  });
  
  overlay.addEventListener('mouseup', (e) => {
    // Calculate coordinates and capture
    captureRegion(startX, startY, e.clientX, e.clientY);
  });
  
  document.body.appendChild(overlay);
}

function captureRegion(x1, y1, x2, y2) {
  chrome.runtime.sendMessage({
    action: 'capture',
    region: {x: x1, y: y1, width: x2-x1, height: y2-y1}
  });
}
```

**File: background.js**
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startCapture'});
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'capture') {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      // Crop to selected region using canvas
      const croppedImage = cropImage(dataUrl, msg.region);
      // Send to AI for analysis
      analyzeWithAI(croppedImage);
    });
  }
});
```

### Step 2: AI Integration (Hours 6-12)

**File: utils/ai.js**
```javascript
const CLAUDE_API_KEY = 'your-api-key'; // TODO: Store securely

async function analyzeScreenshot(base64Image) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
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
              data: base64Image.split(',')[1] // Remove data:image/png;base64,
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
    })
  });
  
  const data = await response.json();
  const result = JSON.parse(data.content[0].text);
  return result;
}
```

### Step 3: Approval UI (Hours 12-18)

**File: popup/popup.html**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="approval-container">
    <img id="screenshot-preview" />
    <div id="ai-explanation"></div>
    <div id="section-info">
      → Adding to section: <span id="suggested-section"></span>
    </div>
    <select id="section-dropdown" style="display:none">
      <!-- Populated dynamically -->
    </select>
    <div id="actions">
      <button id="accept-btn">Accept</button>
      <button id="section-btn">Different Section ▼</button>
      <button id="reject-btn">Reject</button>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

**File: popup/popup.js**
```javascript
// Load pending capture from storage
chrome.storage.local.get(['pendingCapture'], (result) => {
  const capture = result.pendingCapture;
  
  document.getElementById('screenshot-preview').src = capture.image;
  document.getElementById('ai-explanation').textContent = capture.explanation;
  document.getElementById('suggested-section').textContent = capture.section;
  
  // Make explanation editable
  document.getElementById('ai-explanation').contentEditable = true;
});

document.getElementById('accept-btn').addEventListener('click', () => {
  // Save to document
  saveCapture();
  window.close();
});

document.getElementById('reject-btn').addEventListener('click', () => {
  chrome.storage.local.remove('pendingCapture');
  window.close();
});

document.getElementById('section-btn').addEventListener('click', () => {
  // Show dropdown with existing sections + "New section..."
  document.getElementById('section-dropdown').style.display = 'block';
});
```

### Step 4: Document Building (Hours 18-24)

**File: utils/markdown.js**
```javascript
class DocumentBuilder {
  constructor() {
    this.captures = [];
  }

  async load() {
    const result = await chrome.storage.local.get(['captures']);
    this.captures = result.captures || [];
  }

  async addCapture(capture) {
    this.captures.push({
      image: capture.image,
      explanation: capture.explanation,
      section: capture.section,
      source: capture.sourceUrl,
      timestamp: new Date().toISOString()
    });
    
    await chrome.storage.local.set({ captures: this.captures });
  }

  generateMarkdown() {
    let md = `# Research Notes\n`;
    md += `*Last updated: ${new Date().toLocaleString()}*\n\n`;
    
    // Group by section
    const sections = {};
    this.captures.forEach(cap => {
      if (!sections[cap.section]) sections[cap.section] = [];
      sections[cap.section].push(cap);
    });
    
    // Generate markdown for each section
    Object.entries(sections).forEach(([section, captures]) => {
      md += `## ${section}\n\n`;
      
      captures.forEach(cap => {
        md += `![Screenshot](${cap.image})\n`;
        md += `*Captured from: ${cap.source}*\n\n`;
        md += `${cap.explanation}\n\n`;
        md += `---\n\n`;
      });
    });
    
    return md;
  }

  download() {
    const md = this.generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url,
      filename: `research-notes-${Date.now()}.md`
    });
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.generateMarkdown());
  }
}
```

### Step 5: Document View (Hours 24-30)

**File: document/document.html**
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="document.css">
</head>
<body>
  <div id="toolbar">
    <button id="download-btn">⬇ Download Markdown</button>
    <button id="copy-btn">📋 Copy to Clipboard</button>
  </div>
  <div id="document-container">
    <!-- Rendered markdown goes here -->
  </div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="document.js"></script>
</body>
</html>
```

**File: document/document.js**
```javascript
const builder = new DocumentBuilder();

async function render() {
  await builder.load();
  const markdown = builder.generateMarkdown();
  const html = marked.parse(markdown);
  document.getElementById('document-container').innerHTML = html;
}

document.getElementById('download-btn').addEventListener('click', () => {
  builder.download();
});

document.getElementById('copy-btn').addEventListener('click', () => {
  builder.copyToClipboard();
  showNotification('✓ Copied to clipboard');
});

render();
```

---

## Hackathon Demo Script

### Setup (30 seconds)
"I'm learning about machine learning and taking notes from multiple sources - courses, docs, Stack Overflow. Normally I'd screenshot, paste to Notion, write explanations... takes forever and breaks my flow."

### Demo (90 seconds)

**Action 1:** Open ML tutorial page
- Hit Ctrl+Shift+S
- Drag over neural network diagram
- *"See how smooth that capture was?"*

**Action 2:** Approval UI pops up
- *"AI instantly explained what this diagram shows"*
- *"It knows this goes in my Neural Networks section"*
- Click Accept
- *"That's it. 3 seconds total."*

**Action 3:** Capture code snippet
- Hit hotkey on PyTorch code example
- AI explains backpropagation code
- Accept

**Action 4:** Show document
- Click extension icon → View Document
- *"Look at this - professionally formatted markdown, organized by topic"*
- *"All my research in one place, ready to reference"*

**Action 5:** Export
- Click Download
- *"Now I have a .md file - works in Notion, Obsidian, VS Code, anywhere"*
- Open in VS Code to show

### Impact (30 seconds)
"The AI does the hard part - explaining what I captured. I just approve it. No more manual note-taking breaking my research flow. This works for anything - tutorials, documentation, Stack Overflow, research papers, you name it."

---

## Success Metrics

**Core metric:** Time from capture to having it in your notes
- **Old way:** 30-60 seconds (screenshot → paste → write explanation → format)
- **Our way:** 3-5 seconds (hotkey → drag → accept)

**Quality metrics:**
- AI explanation acceptance rate (target >80%)
- Number of captures per research session
- User actually downloads/uses the document (not just collecting screenshots)

---

## Advanced Features (POST-MVP ONLY - DO NOT BUILD INITIALLY)

These features are explicitly out of scope for the initial implementation. Only consider after core workflow is proven and working:

### Phase 2 Enhancements
- Natural language search ("What did I learn about attention mechanisms?")
- Cross-linking between related captures
- Session summaries ("Here are the 3 key themes from today")
- Spaced repetition / flashcard generation
- Collaborative document sharing

### Phase 3 Enhancements
- OCR for handwritten notes
- LaTeX extraction for equations
- PDF export with custom styling
- Browser extension for Firefox/Safari
- Mobile companion app
- Integration with note-taking apps (Notion, Roam, Obsidian)

**Important:** These are future considerations only. The MVP focuses entirely on the core capture → AI explain → approve → document workflow.

---

## Technical Notes

### API Key Security
```javascript
// For MVP, store in extension storage
// Post-MVP: Implement proper key management
chrome.storage.sync.set({ apiKey: 'user-provided-key' });
```

### Image Storage Considerations
- Base64 embedding works for MVP (< 20 captures)
- For production: Use Chrome FileSystem API or external storage
- Consider image compression to reduce size

### Performance
- AI calls should complete in < 3 seconds
- Show loading indicator during AI analysis
- Cache sections list to avoid recomputing

### Error Handling
```javascript
try {
  const result = await analyzeScreenshot(image);
} catch (error) {
  // Fallback: Let user write explanation manually
  showManualInputUI();
}
```

---

## Getting Started Checklist

- [ ] Set up Chrome Extension boilerplate with Manifest V3
- [ ] Implement hotkey listener in background.js
- [ ] Create capture overlay in content script
- [ ] Integrate chrome.tabs.captureVisibleTab()
- [ ] Set up Claude API integration
- [ ] Build approval popup UI
- [ ] Implement markdown generation
- [ ] Create document view page
- [ ] Add download and copy-to-clipboard
- [ ] Test entire flow end-to-end
- [ ] Polish UI and error states
- [ ] Prepare demo script and examples

---

## Questions to Resolve Before Building

1. **Where to store API key?** User provides their own Claude API key in extension options?
2. **Image size limits?** Chrome storage has 5MB sync limit, 10MB local limit
3. **Section naming?** Auto-generate from AI or let user customize?
4. **Offline mode?** Should captures queue if no internet?

---

## Final Notes

**The entire product is:**
1. Hotkey → drag → capture screenshot
2. AI explains it in 2-3 sentences
3. User clicks Accept
4. Builds markdown document automatically
5. Export with one click

**Everything else is noise.** Focus on making this core loop feel magical. Speed, smoothness, and quality of AI explanations are what matter.

Build the simplest possible version that delivers the core value. Polish beats features for a hackathon demo.