/**
 * Markdown generation and document building
 */

import { storage } from './storage.js';
import { blobUrlToBase64 } from './imageStorage.js';

export class DocumentBuilder {
  constructor() {
    this.captures = [];
  }

  /**
   * Load captures from storage
   */
  async load() {
    this.captures = await storage.getCaptures();
    return this.captures;
  }

  /**
   * Add a new capture
   */
  async addCapture(capture) {
    await storage.saveCapture(capture);
    this.captures.push(capture);
    return this.captures;
  }

  /**
   * Generate markdown document
   * @param {boolean} embedImages - If true, convert image URLs to base64 for portability
   */
  async generateMarkdown(embedImages = false) {
    await this.load();

    if (this.captures.length === 0) {
      return '# Research Notes\n\n*No captures yet. Press Ctrl+Shift+S (or Cmd+Shift+S on Mac) to start capturing!*';
    }

    let md = '# Research Notes\n';
    md += `*Last updated: ${new Date().toLocaleString()}*\n`;
    md += `*Total captures: ${this.captures.length}*\n\n`;

    // Group captures by section
    const sections = this.groupBySection();

    // Generate markdown for each section
    for (const [sectionName, captures] of Object.entries(sections)) {
      md += `## ${sectionName}\n\n`;

      for (const capture of captures) {
        // Get image reference
        let imageRef = capture.imagePath || capture.imageUrl;

        // If embedding images, load from IndexedDB and convert to base64
        if (embedImages && capture.id) {
          const { getImage } = await import('./imageStorage.js');
          const base64 = await getImage(capture.id);
          if (base64) {
            imageRef = base64;
          }
        }

        // Add screenshot
        md += `![Screenshot](${imageRef})\n`;

        // Add metadata
        if (capture.sourceUrl) {
          md += `*Captured from: ${capture.sourceUrl}*\n`;
        }
        md += `*Captured at: ${new Date(capture.timestamp).toLocaleString()}*\n\n`;

        // Add explanation
        md += `${capture.explanation}\n\n`;

        // Add separator
        md += `---\n\n`;
      }
    }

    return md;
  }

  /**
   * Group captures by section
   */
  groupBySection() {
    const sections = {};

    this.captures.forEach(capture => {
      const section = capture.section || 'Unsorted';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(capture);
    });

    // Sort sections alphabetically, but keep "Unsorted" at the end
    const sortedSections = {};
    const sectionNames = Object.keys(sections).sort((a, b) => {
      if (a === 'Unsorted') return 1;
      if (b === 'Unsorted') return -1;
      return a.localeCompare(b);
    });

    sectionNames.forEach(name => {
      sortedSections[name] = sections[name];
    });

    return sortedSections;
  }

  /**
   * Download markdown file
   */
  async download() {
    const md = await this.generateMarkdown(true); // Embed images for portability
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const filename = `research-notes-${new Date().toISOString().split('T')[0]}.md`;

    // Use Chrome downloads API
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      });
    } else {
      // Fallback for non-extension context
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Copy markdown to clipboard
   */
  async copyToClipboard() {
    const md = await this.generateMarkdown(false); // Don't embed for clipboard

    try {
      await navigator.clipboard.writeText(md);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Clear all captures
   */
  async clearAll() {
    await storage.clearAllCaptures();
    this.captures = [];
  }

  /**
   * Get statistics
   */
  getStats() {
    const sections = this.groupBySection();
    return {
      totalCaptures: this.captures.length,
      totalSections: Object.keys(sections).length,
      sections: Object.keys(sections).map(name => ({
        name,
        count: sections[name].length
      }))
    };
  }
}
