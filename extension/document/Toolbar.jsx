import React from 'react';

export default function Toolbar({ stats, onDownload, onCopy, onClear, onRefresh, onEditMode, isEditMode }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="toolbar-title">Research Notes</h1>
        {stats && (
          <div className="toolbar-stats">
            <span className="stat-item">{stats.totalCaptures} captures</span>
            <span className="stat-separator">•</span>
            <span className="stat-item">{stats.totalSections} sections</span>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        {!isEditMode && (
          <>
            <button className="toolbar-btn btn-edit" onClick={onEditMode} title="Edit markdown">
              ✏️ Edit Markdown
            </button>
            <button className="toolbar-btn btn-refresh" onClick={onRefresh} title="Refresh">
              ↻ Refresh
            </button>
            <button className="toolbar-btn btn-copy" onClick={onCopy} title="Copy to clipboard">
              📋 Copy
            </button>
            <button className="toolbar-btn btn-download" onClick={onDownload} title="Download markdown file">
              ⬇ Download
            </button>
            <button className="toolbar-btn btn-clear" onClick={onClear} title="Clear all captures">
              🗑 Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );
}
