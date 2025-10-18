import React, { useState, useEffect } from 'react';
import { getImage } from '../utils/imageStorage.js';

export default function ApprovalCard({ capture, explanation, onExplanationChange }) {
  const [imageUrl, setImageUrl] = useState(capture.imageUrl);

  useEffect(() => {
    // Load image from IndexedDB if needed
    const loadImage = async () => {
      if (capture.id) {
        const storedImage = await getImage(capture.id);
        if (storedImage) {
          setImageUrl(storedImage);
        }
      }
    };
    loadImage();
  }, [capture.id]);

  return (
    <div className="approval-card">
      {/* Screenshot preview */}
      <div className="screenshot-preview">
        <img src={imageUrl} alt="Screenshot" />
      </div>

      {/* AI Explanation */}
      <div className="explanation-section">
        <label className="explanation-label">AI Explanation:</label>
        <textarea
          className="explanation-textarea"
          value={explanation}
          onChange={(e) => onExplanationChange(e.target.value)}
          rows={4}
          placeholder="Edit the AI-generated explanation..."
        />
        <p className="explanation-hint">You can edit the explanation before accepting</p>
      </div>

      {/* Source info */}
      {capture.sourceUrl && (
        <div className="source-info">
          <span className="source-label">Source:</span>
          <a
            href={capture.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
            title={capture.sourceUrl}
          >
            {new URL(capture.sourceUrl).hostname}
          </a>
        </div>
      )}
    </div>
  );
}
