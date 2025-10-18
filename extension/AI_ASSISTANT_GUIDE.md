# AI Document Assistant - Usage Guide

## Overview
The AI Document Assistant adds Cursor-style inline diff editing to your markdown editor. It uses Claude AI to modify your document based on natural language commands.

## Features

### 🤖 AI Chat Widget
- **Location**: Bottom-right corner (floating)
- **Collapsible**: Click header to expand/collapse
- **Always available**: When not in diff mode

### ✨ Inline Diff View
- **Green highlights**: Added lines
- **Red highlights** (with strikethrough): Removed lines
- **Gray text**: Unchanged context lines
- **Position**: Replaces textarea in exact same spot
- **Read-only**: No accidental edits during review

### ⌨️ Keyboard Shortcuts
- **Tab**: Accept changes (apply to editor)
- **Esc**: Reject changes (restore original)
- **Cmd/Ctrl+Enter**: Submit command (in AI widget)

## How to Use

### Step 1: Enter Edit Mode
1. Open the document viewer
2. Click "Edit Markdown" button
3. The split-view editor appears

### Step 2: Open AI Assistant
1. Look for the purple "✨ AI Assistant" widget in bottom-right
2. Click to expand if collapsed
3. Type your command in the text area

### Step 3: Give Commands
Examples of commands:
- "Add an introduction section"
- "Reorganize by topic"
- "Add bullet points to section X"
- "Summarize the Neural Networks section"
- "Make the tone more formal"
- "Add more detail to the first paragraph"

### Step 4: Review Changes
1. AI processes your command
2. Textarea disappears
3. Diff view appears with colored highlighting:
   - **Green background** = New content added
   - **Red background + strikethrough** = Content removed
   - **Gray text** = Unchanged content
4. Banner appears at bottom: "Tab to accept | Esc to reject"

### Step 5: Accept or Reject
- **Press Tab**: Apply changes to your markdown
- **Press Esc**: Discard changes and return to original

### Step 6: Continue Editing
- After accept/reject, you're back in normal edit mode
- Can give another AI command or manually edit
- Remember to click "💾 Save" when done!

## Technical Details

### Architecture
- **Swap Technique**: Uses contenteditable div that replaces textarea during diff mode
- **Line-by-line Diff**: Simple comparison algorithm for green/red highlighting
- **Read-only Diff**: contentEditable="false" prevents accidental changes
- **Seamless Transitions**: Hide/show with display property

### API
- **Model**: Claude Sonnet 4 (latest)
- **Max Tokens**: 8000
- **Prompt**: Instructs AI to return only modified markdown, no explanations
- **Error Handling**: Shows alerts on failures

### Files
- `ai-assistant.js` - Core AI and diff logic
- `ai-assistant.css` - Styling for widget and diff view
- `AIAssistantWidget.jsx` - React component for chat widget
- `MarkdownEditor.jsx` - Integrated with editor

## Success Criteria ✅

- [x] User sees green/red highlighted lines inline where textarea was
- [x] Tab accepts changes smoothly
- [x] Esc rejects and restores textarea
- [x] Transitions feel seamless
- [x] No console errors
- [x] Widget floats in bottom-right
- [x] Diff view is read-only
- [x] Same styling/position as textarea

## Tips

### Best Practices
1. **Be specific**: Clear commands get better results
2. **Review carefully**: Check all changes before accepting
3. **Iterate**: You can run multiple AI commands in sequence
4. **Save often**: Accept good changes and save them

### Common Use Cases
- **Restructuring**: "Reorganize sections alphabetically"
- **Adding content**: "Add a summary at the top"
- **Formatting**: "Convert paragraphs to bullet points"
- **Cleanup**: "Remove duplicate information"
- **Enhancement**: "Add more examples to section X"

## Troubleshooting

### AI Widget Not Showing
- Make sure you're in edit mode (clicked "Edit Markdown")
- Widget only shows when NOT in diff mode

### Changes Not Applying
- Make sure to press Tab (not Enter) to accept
- Check that you're not in the middle of typing

### API Errors
- Verify API key is configured in `apiConfig.js`
- Check network connection
- Look at browser console for error details

## Next Steps

After accepting AI changes:
1. Review the modified markdown in the preview pane
2. Click "💾 Save" to persist changes
3. Continue editing or adding more captures
4. Download or copy your final document

---

Built with contenteditable swap technique for smooth, Cursor-like diff experience! ✨

