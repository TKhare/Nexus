import React, { useState, useRef, useEffect } from 'react';

/**
 * CaptureOverlay component
 * Provides drag-to-select screenshot functionality
 */
export default function CaptureOverlay({ onCapture, onCancel }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);

  // Handle mouse down - start selection
  const handleMouseDown = (e) => {
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  };

  // Handle mouse move - update selection
  const handleMouseMove = (e) => {
    if (!isSelecting) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPos({ x, y });
  };

  // Handle mouse up - complete selection
  const handleMouseUp = (e) => {
    if (!isSelecting) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate region bounds
    const region = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y)
    };

    // Only capture if region is large enough (> 10px in both dimensions)
    if (region.width > 10 && region.height > 10) {
      onCapture(region);
    }

    setIsSelecting(false);
  };

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Calculate selection rectangle
  const getSelectionStyle = () => {
    if (!isSelecting) return { display: 'none' };

    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      display: 'block'
    };
  };

  return (
    <div
      ref={overlayRef}
      className="capture-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Selection rectangle */}
      <div
        className="selection-rectangle"
        style={getSelectionStyle()}
      />

      {/* Instructions */}
      <div className="capture-instructions">
        <p>Drag to select an area to capture</p>
        <p className="capture-hint">Press ESC to cancel</p>
      </div>
    </div>
  );
}
