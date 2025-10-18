/**
 * Background Service Worker
 * Handles hotkey commands, screenshot capture, and AI analysis orchestration
 */

import { analyzeScreenshot, analyzeText, analyzeImage, analyzeTable } from './utils/ai.js';
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
      timestamp: new Date().toISOString(),
      content_type: analysis.content_type,
      markdown_content: analysis.markdown_content
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
    // Validate region coordinates
    if (!region || typeof region.x !== 'number' || typeof region.y !== 'number' || 
        typeof region.width !== 'number' || typeof region.height !== 'number') {
      throw new Error('Invalid region coordinates');
    }

    if (region.width <= 0 || region.height <= 0) {
      throw new Error('Region dimensions must be positive');
    }

    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create ImageBitmap from blob
    const imageBitmap = await createImageBitmap(blob);

    // Debug original coordinates
    console.log('Original region coordinates:', {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      devicePixelRatio: region.devicePixelRatio
    });

    // Validate original coordinates
    if (region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0) {
      throw new Error(`Invalid original coordinates: x=${region.x}, y=${region.y}, width=${region.width}, height=${region.height}`);
    }

    // We need to scale viewport coordinates by device pixel ratio to match the captured image
    // The captured image is at device pixel ratio resolution, but our coordinates are at 1x
    const devicePixelRatio = region.devicePixelRatio || 1;
    const scaledRegion = {
      x: Math.round(region.x * devicePixelRatio),
      y: Math.round(region.y * devicePixelRatio),
      width: Math.round(region.width * devicePixelRatio),
      height: Math.round(region.height * devicePixelRatio)
    };

    // Additional validation for coordinates
    if (scaledRegion.x < 0 || scaledRegion.y < 0 || 
        scaledRegion.width <= 0 || scaledRegion.height <= 0 ||
        !Number.isFinite(scaledRegion.x) || !Number.isFinite(scaledRegion.y) ||
        !Number.isFinite(scaledRegion.width) || !Number.isFinite(scaledRegion.height)) {
      throw new Error(`Invalid coordinates: ${JSON.stringify(scaledRegion)}`);
    }

    // Debug logging
    console.log('Original region:', region);
    console.log('Device pixel ratio:', devicePixelRatio);
    console.log('Scaled region:', scaledRegion);
    console.log('Image dimensions:', imageBitmap.width, 'x', imageBitmap.height);
    console.log('Expected viewport size:', Math.round(imageBitmap.width / devicePixelRatio), 'x', Math.round(imageBitmap.height / devicePixelRatio));

    // Ensure region is within image bounds and validate dimensions
    // First clamp the position to be within image bounds
    const clampedX = Math.max(0, Math.min(scaledRegion.x, imageBitmap.width - 1));
    const clampedY = Math.max(0, Math.min(scaledRegion.y, imageBitmap.height - 1));
    
    // Then calculate the maximum possible width and height from the clamped position
    const maxWidth = imageBitmap.width - clampedX;
    const maxHeight = imageBitmap.height - clampedY;
    
    console.log('Clamping details:', {
      scaledRegion,
      clampedX,
      clampedY,
      maxWidth,
      maxHeight,
      imageWidth: imageBitmap.width,
      imageHeight: imageBitmap.height
    });
    
    // Clamp dimensions to fit within the remaining space
    const clampedRegion = {
      x: clampedX,
      y: clampedY,
      width: Math.max(0, Math.min(scaledRegion.width, maxWidth)),
      height: Math.max(0, Math.min(scaledRegion.height, maxHeight))
    };

    // Check if the region is completely outside the image bounds
    if (scaledRegion.x >= imageBitmap.width || scaledRegion.y >= imageBitmap.height) {
      throw new Error(`Region is completely outside image bounds: x=${scaledRegion.x}, y=${scaledRegion.y}, image=${imageBitmap.width}x${imageBitmap.height}`);
    }

    // Additional validation for OffscreenCanvas limits
    // OffscreenCanvas has a maximum size limit (typically 32767x32767)
    const MAX_CANVAS_SIZE = 32767;
    
    if (clampedRegion.width > MAX_CANVAS_SIZE || clampedRegion.height > MAX_CANVAS_SIZE) {
      throw new Error(`Region too large for OffscreenCanvas: ${clampedRegion.width}x${clampedRegion.height}. Maximum size is ${MAX_CANVAS_SIZE}x${MAX_CANVAS_SIZE}`);
    }

    if (clampedRegion.width <= 0 || clampedRegion.height <= 0) {
      // If the region is too small, try to create a minimal valid region
      if (clampedRegion.width <= 0) {
        clampedRegion.width = Math.min(1, imageBitmap.width - clampedRegion.x);
      }
      if (clampedRegion.height <= 0) {
        clampedRegion.height = Math.min(1, imageBitmap.height - clampedRegion.y);
      }
      
      // If still invalid, throw an error
      if (clampedRegion.width <= 0 || clampedRegion.height <= 0) {
        throw new Error(`Invalid region dimensions after clamping: ${clampedRegion.width}x${clampedRegion.height}. Region may be outside image bounds.`);
      }
    }

    // Ensure coordinates are within valid range
    if (clampedRegion.x < 0 || clampedRegion.y < 0 || 
        clampedRegion.x >= imageBitmap.width || clampedRegion.y >= imageBitmap.height) {
      throw new Error(`Region coordinates out of bounds: x=${clampedRegion.x}, y=${clampedRegion.y}, image=${imageBitmap.width}x${imageBitmap.height}`);
    }

    console.log('Clamped region:', clampedRegion);

    // Create OffscreenCanvas for cropping
    const canvas = new OffscreenCanvas(clampedRegion.width, clampedRegion.height);
    const ctx = canvas.getContext('2d');

    // Draw cropped portion
    ctx.drawImage(
      imageBitmap,
      clampedRegion.x, clampedRegion.y, clampedRegion.width, clampedRegion.height, // Source rectangle
      0, 0, clampedRegion.width, clampedRegion.height                                // Destination rectangle
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

    // Update last capture time for document sync
    await chrome.storage.local.set({ lastCaptureTime: Date.now() });

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

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu
  chrome.contextMenus.create({
    id: 'ai-research-parent',
    title: 'AI Research Assistant',
    contexts: ['selection', 'image', 'page']
  });

  // Capture selected text
  chrome.contextMenus.create({
    id: 'capture-text',
    parentId: 'ai-research-parent',
    title: 'Capture Selected Text',
    contexts: ['selection']
  });

  // Capture image
  chrome.contextMenus.create({
    id: 'capture-image',
    parentId: 'ai-research-parent',
    title: 'Capture Image',
    contexts: ['image']
  });

  // Capture table (when right-clicking on table elements)
  chrome.contextMenus.create({
    id: 'capture-table',
    parentId: 'ai-research-parent',
    title: 'Capture Table',
    contexts: ['page']
  });

  // Screenshot mode (existing functionality)
  chrome.contextMenus.create({
    id: 'screenshot-mode',
    parentId: 'ai-research-parent',
    title: 'Screenshot Mode',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    switch (info.menuItemId) {
      case 'capture-text':
        await handleTextCapture(info, tab);
        break;
      case 'capture-image':
        await handleImageCapture(info, tab);
        break;
      case 'capture-table':
        await handleTableCapture(info, tab);
        break;
      case 'screenshot-mode':
        await initiateCapture();
        break;
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
  }
});

/**
 * Handle text capture from context menu
 */
async function handleTextCapture(info, tab) {
  try {
    const selectedText = info.selectionText;
    if (!selectedText || selectedText.trim().length === 0) {
      console.log('No text selected');
      return;
    }

    // Get existing sections to help AI reuse them
    const existingSections = await storage.getSections();

    // Analyze the text with AI
    console.log('Analyzing selected text with AI...');
    const analysis = await analyzeText(selectedText, tab.url, existingSections);

    // Create capture object
    const captureId = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create capture (no image for text)
    const capture = new Capture({
      id: captureId,
      imageUrl: null,
      imagePath: null,
      explanation: analysis.explanation,
      section: analysis.suggested_section,
      sourceUrl: tab.url,
      timestamp: new Date().toISOString(),
      content_type: analysis.content_type,
      markdown_content: analysis.markdown_content
    });

    // Store as pending capture
    await storage.setPendingCapture(capture.toJSON());

    // Open popup for approval
    console.log('Text capture ready for approval');
    try {
      await chrome.action.openPopup();
    } catch (error) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Text Captured',
        message: 'Click the extension icon to review and approve',
        priority: 2
      });
    }

  } catch (error) {
    console.error('Error in handleTextCapture:', error);
    throw error;
  }
}

/**
 * Handle image capture from context menu
 */
async function handleImageCapture(info, tab) {
  try {
    const imageUrl = info.srcUrl;
    if (!imageUrl) {
      console.log('No image URL found');
      return;
    }

    // Get existing sections to help AI reuse them
    const existingSections = await storage.getSections();

    // Analyze the image with AI for educational content
    console.log('Analyzing image with AI...');
    const analysis = await analyzeImage(imageUrl, tab.url, existingSections);

    // Create capture object
    const captureId = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save image
    const { blobUrl, imagePath } = await saveImage(imageUrl, captureId);

    // Create capture
    const capture = new Capture({
      id: captureId,
      imageUrl: blobUrl,
      imagePath: imagePath,
      explanation: analysis.explanation,
      section: analysis.suggested_section,
      sourceUrl: tab.url,
      timestamp: new Date().toISOString(),
      content_type: analysis.content_type,
      markdown_content: analysis.markdown_content
    });

    // Store as pending capture
    await storage.setPendingCapture(capture.toJSON());

    // Open popup for approval
    console.log('Image capture ready for approval');
    try {
      await chrome.action.openPopup();
    } catch (error) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Image Captured',
        message: 'Click the extension icon to review and approve',
        priority: 2
      });
    }

  } catch (error) {
    console.error('Error in handleImageCapture:', error);
    throw error;
  }
}

/**
 * Handle table capture from context menu
 */
async function handleTableCapture(info, tab) {
  try {
    // Send message to content script to detect and extract table
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'EXTRACT_TABLE',
      clickX: info.pageX,
      clickY: info.pageY
    });

    if (!response || !response.success) {
      console.log('No table found at click location');
      return;
    }

    const tableData = response.tableData;

    // Get existing sections to help AI reuse them
    const existingSections = await storage.getSections();

    // Analyze the table with AI
    console.log('Analyzing table with AI...');
    const analysis = await analyzeTable(tableData, tab.url, existingSections);

    // Create capture object
    const captureId = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create capture (no image for table)
    const capture = new Capture({
      id: captureId,
      imageUrl: null,
      imagePath: null,
      explanation: analysis.explanation,
      section: analysis.suggested_section,
      sourceUrl: tab.url,
      timestamp: new Date().toISOString(),
      content_type: 'table',
      markdown_content: analysis.markdown_content
    });

    // Store as pending capture
    await storage.setPendingCapture(capture.toJSON());

    // Open popup for approval
    console.log('Table capture ready for approval');
    try {
      await chrome.action.openPopup();
    } catch (error) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Table Captured',
        message: 'Click the extension icon to review and approve',
        priority: 2
      });
    }

  } catch (error) {
    console.error('Error in handleTableCapture:', error);
    throw error;
  }
}
