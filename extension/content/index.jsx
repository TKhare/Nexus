import React from 'react';
import { createRoot } from 'react-dom/client';
import CaptureOverlay from './CaptureOverlay.jsx';

let root = null;
let overlayContainer = null;
let isInitialized = false;

/**
 * Listen for messages from background script
 * Use singleton pattern to prevent multiple initializations
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
  if (!isInitialized) {
    isInitialized = true;
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'START_CAPTURE') {
        startCaptureMode();
        sendResponse({ success: true });
      } else if (message.action === 'EXTRACT_TABLE') {
        const tableData = extractTableAtPosition(message.clickX, message.clickY);
        sendResponse({ success: !!tableData, tableData });
      }
    });
  }
} else {
  console.error('Chrome API not available');
}

/**
 * Start capture mode - show overlay
 */
function startCaptureMode() {
  // Remove existing overlay if present
  if (overlayContainer) {
    removeOverlay();
  }

  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'ai-research-overlay-root';
  document.body.appendChild(overlayContainer);

  // Render React component
  root = createRoot(overlayContainer);
  root.render(
    <CaptureOverlay
      onCapture={handleCapture}
      onCancel={handleCancel}
    />
  );
}

/**
 * Handle capture - send region to background script
 */
function handleCapture(region) {
  // Hide overlay immediately before capture to avoid capturing it
  removeOverlay();
  
  // Wait a brief moment for overlay to be removed from DOM, then send region
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'CAPTURE_REGION',
      region: region
    }, (response) => {
      if (response && response.success) {
        console.log('Capture successful:', response.captureId);
      } else {
        console.error('Capture failed:', response?.error);
      }
    });
  }, 100);
}

/**
 * Handle cancel
 */
function handleCancel() {
  removeOverlay();
}

/**
 * Remove overlay from DOM
 */
function removeOverlay() {
  if (root) {
    root.unmount();
    root = null;
  }

  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

/**
 * Extract table data at the given position
 */
function extractTableAtPosition(x, y) {
  try {
    // Find the element at the click position
    const element = document.elementFromPoint(x, y);
    if (!element) return null;

    // Find the nearest table element
    const table = element.closest('table');
    if (!table) return null;

    // Convert to HTML for AI processing
    return table.outerHTML;
  } catch (error) {
    console.error('Error extracting table:', error);
    return null;
  }
}
