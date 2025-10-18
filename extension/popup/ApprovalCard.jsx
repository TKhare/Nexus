import React, { useState, useEffect } from 'react';
import { getImage } from '../utils/imageStorage.js';
import MarkdownRenderer from '../document/MarkdownRenderer.jsx';

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

  // Determine if we should show markdown content, captured text, or image
  const hasMarkdownContent = capture.markdown_content && capture.markdown_content.trim().length > 0;
  const hasCapturedText = capture.capturedText && capture.capturedText.trim().length > 0;
  const hasImage = capture.imageUrl || imageUrl;
  const shouldShowImage = (!hasMarkdownContent && !hasCapturedText && hasImage) || capture.content_type === 'diagram' || capture.content_type === 'visual' || capture.content_type === 'chart';

  return (
    <div className="approval-card">
      {/* Content display - markdown, captured text, or image */}
      {hasCapturedText && !hasImage ? (
        <div className="captured-text-preview">
          <div className="content-type-badge">
            📝 Captured Text
          </div>
          <div className="captured-text-content">
            {capture.capturedText}
          </div>
        </div>
      ) : hasMarkdownContent && !shouldShowImage ? (
        <div className="markdown-preview">
          <div className="content-type-badge">
            {capture.content_type === 'chart' && '📊 Chart'}
            {capture.content_type === 'code' && '📝 Code'}
            {capture.content_type === 'equation' && '🧮 Equation'}
            {capture.content_type === 'text' && '📄 Text'}
            {capture.content_type === 'diagram' && '📐 Diagram'}
            {capture.content_type === 'visual' && '📈 Visual Content'}
          </div>
          <div className="markdown-content">
            <MarkdownRenderer markdown={capture.markdown_content} />
          </div>
        </div>
      ) : hasImage ? (
        <div className="screenshot-preview">
          <img src={imageUrl} alt="Screenshot" />
        </div>
      ) : null}

      {/* AI Explanation */}
      <div className="explanation-section">
        <label className="explanation-label">
          {hasMarkdownContent ? 'Additional Notes:' : 'AI Analysis:'}
        </label>
        <textarea
          className="explanation-textarea"
          value={explanation}
          onChange={(e) => onExplanationChange(e.target.value)}
          rows={4}
          placeholder={hasMarkdownContent ? "Add any additional notes..." : "Edit the AI analysis..."}
        />
        <p className="explanation-hint">
          {hasMarkdownContent 
            ? "The content above was extracted as markdown. You can add additional notes here."
            : "AI analysis of the content. You can edit this before accepting."
          }
        </p>
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
