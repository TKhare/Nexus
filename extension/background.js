/**
 * Background Service Worker
 * Handles hotkey commands, screenshot capture, and AI analysis orchestration
 */

import { analyzeScreenshot } from './utils/ai.js';
import { storage } from './utils/storage.js';
import { saveImage } from './utils/imageStorage.js';
import { Capture } from './models/Capture.js';

// Track which tabs have content script injected
const injectedTabs = new Set();

// Listen for keyboard command (Ctrl+Shift+S or Cmd+Shift+S)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-screenshot') {
    initiateCapture();
  }
});

// Clean up tracking when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

// Clean up tracking when tabs navigate to new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    injectedTabs.delete(tabId);
  }
});

/**
 * Initiate screenshot capture
 */
async function initiateCapture() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.error('No active tab found');
      return;
    }

    // Check if content script is already injected
    const needsInjection = !injectedTabs.has(tab.id);

    if (needsInjection) {
      // Inject content script CSS first
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/content.css']
        });
      } catch (error) {
        console.log('CSS injection error:', error);
      }

      // Inject content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });

        // Mark tab as injected
        injectedTabs.add(tab.id);

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Error injecting content script:', error);
        // Show error notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Capture Failed',
          message: 'Could not inject capture overlay. Try refreshing the page.',
          priority: 2
        });
        return;
      }
    }

    // Send message to start capture
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'START_CAPTURE',
        tabId: tab.id
      });

    } catch (error) {
      console.error('Error injecting content script:', error);
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Capture Failed',
        message: 'Could not inject capture overlay. Try refreshing the page.',
        priority: 2
      });
    }

  } catch (error) {
    console.error('Error initiating capture:', error);
  }
}

/**
 * Listen for messages from content scripts and other parts of the extension
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CAPTURE_REGION') {
    handleCaptureRegion(message, sender.tab)
      .then(sendResponse)
      .catch(error => {
        console.error('Error handling capture:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }

  if (message.action === 'GET_PENDING_CAPTURE') {
    storage.getPendingCapture()
      .then(capture => sendResponse({ capture }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.action === 'APPROVE_CAPTURE') {
    handleApproveCapture(message.capture)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'REJECT_CAPTURE') {
    storage.clearPendingCapture()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * Handle region capture from content script
 */
async function handleCaptureRegion(message, tab) {
  try {
    const { region } = message;

    // Wait a moment for overlay to be fully removed from DOM
    await new Promise(resolve => setTimeout(resolve, 150));

    // Capture visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    // Crop to selected region
    const croppedImage = await cropImage(dataUrl, region);

    // Get existing sections to help AI reuse them
    const existingSections = await storage.getSections();

    // Analyze with AI
    console.log('Analyzing screenshot with AI...');
    const analysis = await analyzeScreenshot(croppedImage, tab.url, existingSections);

    // Create capture object
    const captureId = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save image
    const { blobUrl, imagePath } = await saveImage(croppedImage, captureId);

    // Create capture
    const capture = new Capture({
      id: captureId,
      imageUrl: blobUrl,
      imagePath: imagePath,
      explanation: analysis.explanation,
      section: analysis.suggested_section,
      sourceUrl: tab.url,
      timestamp: new Date().toISOString()
    });

    // Store as pending capture
    await storage.setPendingCapture(capture.toJSON());

    // Open popup for approval (or notify user to click extension icon)
    console.log('Capture ready for approval');

    // Optionally, open the popup programmatically
    // Note: This may not work in all contexts due to Chrome restrictions
    try {
      await chrome.action.openPopup();
    } catch (error) {
      // If opening popup fails, show a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Screenshot Captured',
        message: 'Click the extension icon to review and approve',
        priority: 2
      });
    }

    return { success: true, captureId };

  } catch (error) {
    console.error('Error in handleCaptureRegion:', error);
    throw error;
  }
}

/**
 * Crop image to selected region using OffscreenCanvas (works in service workers)
 */
async function cropImage(dataUrl, region) {
  try {
    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create ImageBitmap from blob
    const imageBitmap = await createImageBitmap(blob);

    // Create OffscreenCanvas for cropping
    const canvas = new OffscreenCanvas(region.width, region.height);
    const ctx = canvas.getContext('2d');

    // Draw cropped portion
    ctx.drawImage(
      imageBitmap,
      region.x, region.y, region.width, region.height, // Source rectangle
      0, 0, region.width, region.height                // Destination rectangle
    );

    // Convert to blob
    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(croppedBlob);
    });
  } catch (error) {
    console.error('Error cropping image:', error);
    throw error;
  }
}

/**
 * Handle approval of capture
 */
async function handleApproveCapture(capture) {
  try {
    // Save to captures
    await storage.saveCapture(capture);

    // Clear pending
    await storage.clearPendingCapture();

    console.log('Capture approved and saved');
  } catch (error) {
    console.error('Error approving capture:', error);
    throw error;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AI Research Assistant installed!');
    // Could open a welcome page or setup guide
  }
});
