import React, { useState, useEffect } from 'react';
import Toolbar from './Toolbar.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import MarkdownEditor from './MarkdownEditor.jsx';
import KnowledgeGraph from './KnowledgeGraph.jsx';
import { DocumentBuilder } from '../utils/markdown.js';
import './knowledge-graph.css';

const STORAGE_KEY_EDITED_MARKDOWN = 'editedMarkdown';

export default function Document() {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('document');
  const documentBuilder = new DocumentBuilder();

  useEffect(() => {
    loadDocument();

    // Listen for storage changes to auto-refresh (only if not in edit mode)
    const handleStorageChange = () => {
      if (!isEditMode) {
        loadDocument();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [isEditMode]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      
      // Check if there's edited markdown in storage
      const result = await chrome.storage.local.get([STORAGE_KEY_EDITED_MARKDOWN]);
      const editedMarkdown = result[STORAGE_KEY_EDITED_MARKDOWN];
      
      if (editedMarkdown) {
        // Use edited markdown as source of truth
        setMarkdown(editedMarkdown);
      } else {
        // Generate from captures
        await documentBuilder.load();
        const md = await documentBuilder.generateMarkdown(false);
        setMarkdown(md);
      }
      
      // Always load stats from captures
      await documentBuilder.load();
      setStats(documentBuilder.getStats());
    } catch (error) {
      console.error('Error loading document:', error);
      setMarkdown('# Error\n\nFailed to load document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await documentBuilder.download();
      alert('Markdown file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Failed to download. Please try again.');
    }
  };

  const handleCopy = async () => {
    try {
      const success = await documentBuilder.copyToClipboard();
      if (success) {
        alert('Copied to clipboard! You can now paste into Notion, Obsidian, or any markdown editor.');
      } else {
        alert('Failed to copy. Please try again.');
      }
    } catch (error) {
      console.error('Error copying:', error);
      alert('Failed to copy. Please try again.');
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to delete all captures? This cannot be undone.')) {
      try {
        await documentBuilder.clearAll();
        await loadDocument();
        alert('All captures cleared.');
      } catch (error) {
        console.error('Error clearing:', error);
        alert('Failed to clear captures. Please try again.');
      }
    }
  };

  const handleRefresh = () => {
    loadDocument();
  };

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleSaveMarkdown = async (editedMarkdown) => {
    try {
      // Save edited markdown to storage
      await chrome.storage.local.set({ [STORAGE_KEY_EDITED_MARKDOWN]: editedMarkdown });
      setMarkdown(editedMarkdown);
      alert('Markdown saved successfully!');
    } catch (error) {
      console.error('Error saving markdown:', error);
      alert('Failed to save markdown. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <div className="document-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-container">
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'document' ? 'active' : ''}`}
          onClick={() => setActiveTab('document')}
        >
          Document
        </button>
        <button 
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          Knowledge Graph
        </button>
      </div>
      
      {activeTab === 'document' ? (
        <>
          <Toolbar
            stats={stats}
            onDownload={handleDownload}
            onCopy={handleCopy}
            onClear={handleClear}
            onRefresh={handleRefresh}
            onEditMode={handleEditMode}
            isEditMode={isEditMode}
          />
          {isEditMode ? (
            <MarkdownEditor
              initialMarkdown={markdown}
              onSave={handleSaveMarkdown}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="document-content">
              <MarkdownRenderer markdown={markdown} />
            </div>
          )}
        </>
      ) : (
        <KnowledgeGraph />
      )}
    </div>
  );
}
