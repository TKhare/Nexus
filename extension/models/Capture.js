/**
 * Capture data model
 * Represents a single screenshot capture with AI-generated explanation
 */
export class Capture {
  constructor({
    id,
    imageUrl,
    imagePath,
    explanation,
    section,
    sourceUrl,
    timestamp
  }) {
    this.id = id || this.generateId();
    this.imageUrl = imageUrl || null;
    this.imagePath = imagePath || null;
    this.explanation = explanation || '';
    this.section = section || 'Unsorted';
    this.sourceUrl = sourceUrl || '';
    this.timestamp = timestamp || new Date().toISOString();
  }

  generateId() {
    return `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      imageUrl: this.imageUrl,
      imagePath: this.imagePath,
      explanation: this.explanation,
      section: this.section,
      sourceUrl: this.sourceUrl,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new Capture(json);
  }
}
