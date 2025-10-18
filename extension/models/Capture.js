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
    timestamp,
    content_type,
    markdown_content
  }) {
    this.id = id || this.generateId();
    this.imageUrl = imageUrl || null;
    this.imagePath = imagePath || null;
    this.explanation = explanation || '';
    this.section = section || 'Unsorted';
    this.sourceUrl = sourceUrl || '';
    this.timestamp = timestamp || new Date().toISOString();
    this.content_type = content_type || 'text';
    this.markdown_content = markdown_content || '';
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
      timestamp: this.timestamp,
      content_type: this.content_type,
      markdown_content: this.markdown_content
    };
  }

  static fromJSON(json) {
    return new Capture(json);
  }
}
