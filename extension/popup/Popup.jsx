import React, { useState, useEffect } from 'react';
import ApprovalCard from './ApprovalCard.jsx';
import SectionSelector from './SectionSelector.jsx';

export default function Popup() {
  const [pendingCapture, setPendingCapture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [editedExplanation, setEditedExplanation] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Load pending capture on mount
  useEffect(() => {
    loadPendingCapture();
    loadSections();
  }, []);

  const loadPendingCapture = async () => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage({
        action: 'GET_PENDING_CAPTURE'
      });

      if (response.capture) {
        setPendingCapture(response.capture);
        setEditedExplanation(response.capture.explanation);
        setSelectedSection(response.capture.section);
      } else {
        setPendingCapture(null);
      }
    } catch (err) {
      setError('Failed to load capture');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const result = await chrome.storage.local.get(['captures']);
      const captures = result.captures || [];
      const uniqueSections = [...new Set(captures.map(c => c.section))];
      setSections(uniqueSections.sort());
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  };

  const handleAccept = async () => {
    try {
      // Update capture with edited values
      const updatedCapture = {
        ...pendingCapture,
        explanation: editedExplanation,
        section: selectedSection
      };

      await chrome.runtime.sendMessage({
        action: 'APPROVE_CAPTURE',
        capture: updatedCapture
      });

      // Show success and close
      alert('Capture saved successfully!');
      window.close();
    } catch (err) {
      setError('Failed to save capture');
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'REJECT_CAPTURE'
      });

      window.close();
    } catch (err) {
      setError('Failed to reject capture');
      console.error(err);
    }
  };

  const handleViewDocument = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('document/document.html') });
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="popup-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.close()}>Close</button>
        </div>
      </div>
    );
  }

  if (!pendingCapture) {
    return (
      <div className="popup-container">
        <div className="no-capture">
          <h2>AI Research Assistant</h2>
          <p>No pending captures</p>
          <p className="hint">Press <kbd>Ctrl+Shift+S</kbd> (or <kbd>Cmd+Shift+S</kbd> on Mac) to capture a screenshot</p>
          <button onClick={handleViewDocument} className="btn-primary">
            View Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <ApprovalCard
        capture={pendingCapture}
        explanation={editedExplanation}
        onExplanationChange={setEditedExplanation}
      />

      <div className="section-selection">
        {showSectionSelector ? (
          <SectionSelector
            sections={sections}
            selectedSection={selectedSection}
            onSelectSection={(section) => {
              setSelectedSection(section);
              setShowSectionSelector(false);
            }}
            onCancel={() => setShowSectionSelector(false)}
          />
        ) : (
          <div className="section-info">
            <span className="section-label">Adding to section:</span>
            <span className="section-name">{selectedSection}</span>
            <button
              className="btn-change-section"
              onClick={() => setShowSectionSelector(true)}
            >
              Change
            </button>
          </div>
        )}
      </div>

      <div className="actions">
        <button className="btn-accept" onClick={handleAccept}>
          Accept
        </button>
        <button className="btn-reject" onClick={handleReject}>
          Reject
        </button>
      </div>

      <div className="footer">
        <button className="btn-link" onClick={handleViewDocument}>
          View Full Document
        </button>
      </div>
    </div>
  );
}
