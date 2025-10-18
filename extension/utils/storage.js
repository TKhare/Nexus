/**
 * Chrome Storage API helpers
 * Manages captures, sections, and pending captures
 */

const STORAGE_KEYS = {
  CAPTURES: 'captures',
  SECTIONS: 'sections',
  PENDING_CAPTURE: 'pendingCapture',
  API_KEY: 'apiKey'
};

export const storage = {
  /**
   * Get all captures
   */
  async getCaptures() {
    const result = await chrome.storage.local.get([STORAGE_KEYS.CAPTURES]);
    return result[STORAGE_KEYS.CAPTURES] || [];
  },

  /**
   * Save a new capture
   */
  async saveCapture(capture) {
    const captures = await this.getCaptures();
    captures.push(capture);
    await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: captures });
    return captures;
  },

  /**
   * Get all unique sections
   */
  async getSections() {
    const captures = await this.getCaptures();
    const sections = new Set(captures.map(c => c.section));
    return Array.from(sections).sort();
  },

  /**
   * Update a capture
   */
  async updateCapture(captureId, updates) {
    const captures = await this.getCaptures();
    const index = captures.findIndex(c => c.id === captureId);
    if (index !== -1) {
      captures[index] = { ...captures[index], ...updates };
      await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: captures });
    }
    return captures;
  },

  /**
   * Delete a capture
   */
  async deleteCapture(captureId) {
    const captures = await this.getCaptures();
    const filtered = captures.filter(c => c.id !== captureId);
    await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: filtered });
    return filtered;
  },

  /**
   * Clear all captures
   */
  async clearAllCaptures() {
    await chrome.storage.local.set({ [STORAGE_KEYS.CAPTURES]: [] });
  },

  /**
   * Get pending capture (for approval UI)
   */
  async getPendingCapture() {
    const result = await chrome.storage.local.get([STORAGE_KEYS.PENDING_CAPTURE]);
    return result[STORAGE_KEYS.PENDING_CAPTURE] || null;
  },

  /**
   * Set pending capture
   */
  async setPendingCapture(capture) {
    await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_CAPTURE]: capture });
  },

  /**
   * Clear pending capture
   */
  async clearPendingCapture() {
    await chrome.storage.local.remove([STORAGE_KEYS.PENDING_CAPTURE]);
  },

  /**
   * Get API key
   */
  async getApiKey() {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.API_KEY]);
    return result[STORAGE_KEYS.API_KEY] || null;
  },

  /**
   * Set API key
   */
  async setApiKey(apiKey) {
    await chrome.storage.sync.set({ [STORAGE_KEYS.API_KEY]: apiKey });
  }
};
