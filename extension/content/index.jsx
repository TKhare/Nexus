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
      } else if (message.action === 'CAPTURE_SELECTED_TEXT') {
        handleTextCapture();
        sendResponse({ success: true });
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

/**
 * Handle text capture
 */
function handleTextCapture() {
  // Get selected text
  const selectedText = window.getSelection().toString().trim();
  
  if (!selectedText) {
    showToast('No text selected', 'error');
    return;
  }

  // Show toast notification
  showToast('✓ Captured');

  // Send text to background for processing
  chrome.runtime.sendMessage({
    action: 'CAPTURE_TEXT',
    text: selectedText
  }, (response) => {
    if (response && response.success) {
      console.log('Text capture successful:', response.captureId);
    } else {
      console.error('Text capture failed:', response?.error);
      showToast('Capture failed', 'error');
    }
  });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `ai-research-toast ai-research-toast-${type}`;
  toast.textContent = message;
  
  // Add styles
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    background: type === 'success' ? '#4CAF50' : '#f44336',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: '2147483647',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    animation: 'slideIn 0.3s ease-out',
    opacity: '0',
    transform: 'translateX(100%)'
  });

  // Add animation keyframes if not already added
  if (!document.getElementById('ai-research-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-research-toast-styles';
    style.textContent = `
      @keyframes slideIn {
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Append to body
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Auto-dismiss after 2 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2000);
}
