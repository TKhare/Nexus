import React, { useState } from 'react';

export default function SectionSelector({ sections, selectedSection, onSelectSection, onCancel }) {
  const [newSection, setNewSection] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSelect = (section) => {
    onSelectSection(section);
  };

  const handleCreateNew = () => {
    if (newSection.trim()) {
      onSelectSection(newSection.trim());
    }
  };

  return (
    <div className="section-selector">
      {!isCreatingNew ? (
        <>
          <div className="section-list">
            <p className="section-list-label">Select a section:</p>
            {sections.map((section) => (
              <button
                key={section}
                className={`section-option ${section === selectedSection ? 'selected' : ''}`}
                onClick={() => handleSelect(section)}
              >
                {section}
              </button>
            ))}
          </div>
          <div className="section-actions">
            <button
              className="btn-new-section"
              onClick={() => setIsCreatingNew(true)}
            >
              + New Section
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="new-section-form">
          <label className="new-section-label">New section name:</label>
          <input
            type="text"
            className="new-section-input"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="e.g., Machine Learning"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNew();
              } else if (e.key === 'Escape') {
                setIsCreatingNew(false);
              }
            }}
          />
          <div className="new-section-actions">
            <button className="btn-create" onClick={handleCreateNew}>
              Create
            </button>
            <button className="btn-cancel" onClick={() => setIsCreatingNew(false)}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
