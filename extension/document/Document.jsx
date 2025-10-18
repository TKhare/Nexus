import React, { useState, useEffect } from 'react';
import Toolbar from './Toolbar.jsx';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import { DocumentBuilder } from '../utils/markdown.js';

export default function Document() {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const documentBuilder = new DocumentBuilder();

  useEffect(() => {
    loadDocument();

    // Listen for storage changes to auto-refresh
    const handleStorageChange = () => {
      loadDocument();
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadDocument = async () => {
    try {
      setLoading(true);
      await documentBuilder.load();
      const md = await documentBuilder.generateMarkdown(false);
      setMarkdown(md);
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
      <Toolbar
        stats={stats}
        onDownload={handleDownload}
        onCopy={handleCopy}
        onClear={handleClear}
        onRefresh={handleRefresh}
      />
      <div className="document-content">
        <MarkdownRenderer markdown={markdown} />
      </div>
    </div>
  );
}
