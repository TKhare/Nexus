import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import AIAssistantWidget from './AIAssistantWidget.jsx';
import { getAIModification, generateDiff, createDiffView, extractAcceptedText } from './ai-assistant.js';

export default function MarkdownEditor({ initialMarkdown, onSave, onCancel }) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffViewElement, setDiffViewElement] = useState(null);
  const [modifiedMarkdown, setModifiedMarkdown] = useState('');
  
  const textareaRef = useRef(null);
  const editorPaneRef = useRef(null);

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

  const handleAICommand = async (command) => {
    try {
      // Get AI modification
      const modified = await getAIModification(markdown, command);
      setModifiedMarkdown(modified);

      // Generate diff
      const diff = generateDiff(markdown, modified);
      
      // Create diff view
      const diffView = createDiffView(diff);
      
      // Enter diff mode
      setDiffViewElement(diffView);
      setIsDiffMode(true);
    } catch (error) {
      console.error('AI command error:', error);
      throw error;
    }
  };

  const handleAcceptDiff = () => {
    if (!diffViewElement) return;
    
    // Extract accepted text (without removed lines)
    const acceptedText = extractAcceptedText(diffViewElement);
    
    // Update markdown
    setMarkdown(acceptedText);
    setHasChanges(true);
    
    // Exit diff mode
    exitDiffMode();
  };

  const handleRejectDiff = () => {
    exitDiffMode();
  };

  const exitDiffMode = () => {
    setIsDiffMode(false);
    setDiffViewElement(null);
    setModifiedMarkdown('');
  };

  // Handle keyboard shortcuts for diff mode
  useEffect(() => {
    if (!isDiffMode) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleAcceptDiff();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleRejectDiff();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDiffMode, diffViewElement]);

  // Append diff view to editor pane when entering diff mode
  useEffect(() => {
    if (isDiffMode && diffViewElement && editorPaneRef.current) {
      // Make textarea relative positioned if not already
      const pane = editorPaneRef.current;
      if (getComputedStyle(pane).position === 'static') {
        pane.style.position = 'relative';
      }
      
      pane.appendChild(diffViewElement);
      
      return () => {
        if (diffViewElement && pane.contains(diffViewElement)) {
          pane.removeChild(diffViewElement);
        }
      };
    }
  }, [isDiffMode, diffViewElement]);

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
            disabled={!hasChanges || isDiffMode}
            title="Save changes"
          >
            💾 Save
          </button>
          <button 
            className="toolbar-btn btn-cancel" 
            onClick={onCancel}
            title="Exit editor"
            disabled={isDiffMode}
          >
            ← Back to View
          </button>
          {hasChanges && !isDiffMode && (
            <span className="unsaved-indicator">Unsaved changes</span>
          )}
          {isDiffMode && (
            <span className="unsaved-indicator">Reviewing AI changes...</span>
          )}
        </div>
        <div className="editor-toolbar-right">
          <button 
            className="toolbar-btn btn-download" 
            onClick={handleDownload}
            title="Download markdown file"
            disabled={isDiffMode}
          >
            ⬇ Download
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="editor-split-view">
        {/* Left pane - Editor */}
        <div className="editor-pane" ref={editorPaneRef} style={{ position: 'relative' }}>
          <div className="pane-header">Markdown Editor</div>
          <textarea
            ref={textareaRef}
            className="markdown-textarea"
            value={markdown}
            onChange={handleChange}
            placeholder="Write your markdown here..."
            spellCheck="false"
            style={{ display: isDiffMode ? 'none' : 'block' }}
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

      {/* AI Assistant Widget */}
      {!isDiffMode && <AIAssistantWidget onApplyDiff={handleAICommand} />}

      {/* Diff Accept/Reject Banner */}
      {isDiffMode && (
        <div className="diff-banner">
          <div className="diff-banner-action">
            <span className="diff-banner-key">Tab</span>
            <span>Accept Changes</span>
          </div>
          <div className="diff-banner-action">
            <span className="diff-banner-key">Esc</span>
            <span>Reject Changes</span>
          </div>
        </div>
      )}
    </div>
  );
}

