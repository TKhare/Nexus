/**
 * Image storage utilities
 * Handles saving and retrieving images as external files
 */

/**
 * Convert base64 data URL to Blob
 */
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Save image and return URL for referencing
 * Store base64 directly in IndexedDB and return it
 * (blob URLs don't work in service workers)
 */
export async function saveImage(base64DataUrl, captureId) {
  try {
    // Store base64 directly in IndexedDB
    await saveToIndexedDB(captureId, base64DataUrl);

    return {
      blobUrl: base64DataUrl, // Return base64 directly instead of blob URL
      imagePath: `images/${captureId}.png`
    };
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

/**
 * Retrieve image from storage
 */
export async function getImage(captureId) {
  try {
    const base64DataUrl = await getFromIndexedDB(captureId);
    return base64DataUrl || null;
  } catch (error) {
    console.error('Error retrieving image:', error);
    return null;
  }
}

/**
 * Delete image from storage
 */
export async function deleteImage(captureId) {
  try {
    await deleteFromIndexedDB(captureId);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

// IndexedDB operations
const DB_NAME = 'AIResearchAssistant';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveToIndexedDB(key, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFromIndexedDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromIndexedDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Convert blob URL back to base64 for markdown export
 * Since we're now storing base64 directly, just return it
 */
export async function blobUrlToBase64(imageUrl) {
  // If it's already base64, return it
  if (imageUrl && imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // Otherwise try to fetch it
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting to base64:', error);
    return null;
  }
}
