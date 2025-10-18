import React, { useState, useRef } from 'react';
import './ai-assistant.css';

export default function AIAssistantWidget({ onApplyDiff }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async () => {
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onApplyDiff(command.trim());
      setCommand('');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`ai-assistant-widget ${isExpanded ? '' : 'ai-assistant-collapsed'}`}>
      <div className="ai-widget-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-widget-title">
          <span>✨</span>
          <span>AI Assistant</span>
        </div>
        <button className="ai-widget-toggle" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="ai-widget-body">
          <textarea
            ref={textareaRef}
            className="ai-command-input"
            placeholder="Tell me what to do with your document..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="ai-loading">
              <div className="ai-loading-spinner" />
              <span>Processing your request...</span>
            </div>
          ) : (
            <>
              <button 
                className="ai-submit-btn" 
                onClick={handleSubmit}
                disabled={!command.trim()}
              >
                <span>✨</span>
                <span>Apply Changes</span>
              </button>

              <div className="ai-examples">
                <strong>Examples:</strong>
                • "Add an introduction section"<br />
                • "Reorganize by topic"<br />
                • "Add bullet points to section X"<br />
                • "Summarize the Neural Networks section"
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

