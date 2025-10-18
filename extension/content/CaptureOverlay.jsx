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
    // Use viewport coordinates (clientX/Y) since captureVisibleTab captures the viewport
    const x = e.clientX;
    const y = e.clientY;

    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  };

  // Handle mouse move - update selection
  const handleMouseMove = (e) => {
    if (!isSelecting) return;

    // Use viewport coordinates (clientX/Y) since captureVisibleTab captures the viewport
    const x = e.clientX;
    const y = e.clientY;

    setCurrentPos({ x, y });
  };

  // Handle mouse up - complete selection
  const handleMouseUp = (e) => {
    if (!isSelecting) return;

    // Use viewport coordinates (clientX/Y) since captureVisibleTab captures the viewport
    const x = e.clientX;
    const y = e.clientY;

    // Debug mouse positions
    console.log('Mouse positions:', {
      startPos,
      currentPos: { x, y },
      pageX: e.pageX,
      pageY: e.pageY,
      clientX: e.clientX,
      clientY: e.clientY,
      devicePixelRatio: window.devicePixelRatio
    });

    // Calculate region bounds with proper rounding
    const region = {
      x: Math.round(Math.min(startPos.x, x)),
      y: Math.round(Math.min(startPos.y, y)),
      width: Math.round(Math.abs(x - startPos.x)),
      height: Math.round(Math.abs(y - startPos.y)),
      devicePixelRatio: window.devicePixelRatio || 1
    };

    console.log('Calculated region:', region);

    // Validate region coordinates
    if (region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0) {
      console.warn('Invalid region coordinates:', region);
      setIsSelecting(false);
      return;
    }

    // Check for reasonable maximum size (prevent extremely large selections)
    const MAX_SELECTION_SIZE = 10000; // 10k pixels max
    if (region.width > MAX_SELECTION_SIZE || region.height > MAX_SELECTION_SIZE) {
      console.warn('Selection too large:', region);
      setIsSelecting(false);
      return;
    }

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

    // Since we're using viewport coordinates (clientX/Y), no scroll adjustment needed
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
