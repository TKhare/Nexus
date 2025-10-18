import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function MarkdownEditor({ initialMarkdown, onSave, onCancel }) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e) => {
    setMarkdown(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(markdown);
    setHasChanges(false);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `research-notes-${new Date().toISOString().split('T')[0]}.md`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="editor-container">
      {/* Editor toolbar */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <button 
            className="toolbar-btn btn-save" 
            onClick={handleSave}
            disabled={!hasChanges}
            title="Save changes"
          >
            💾 Save
          </button>
          <button 
            className="toolbar-btn btn-cancel" 
            onClick={onCancel}
            title="Exit editor"
          >
            ← Back to View
          </button>
          {hasChanges && (
            <span className="unsaved-indicator">Unsaved changes</span>
          )}
        </div>
        <div className="editor-toolbar-right">
          <button 
            className="toolbar-btn btn-download" 
            onClick={handleDownload}
            title="Download markdown file"
          >
            ⬇ Download
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="editor-split-view">
        {/* Left pane - Editor */}
        <div className="editor-pane">
          <div className="pane-header">Markdown Editor</div>
          <textarea
            className="markdown-textarea"
            value={markdown}
            onChange={handleChange}
            placeholder="Write your markdown here..."
            spellCheck="false"
          />
        </div>

        {/* Right pane - Preview */}
        <div className="preview-pane">
          <div className="pane-header">Live Preview</div>
          <div className="preview-content">
            <MarkdownRenderer markdown={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
}

