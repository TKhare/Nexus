/**
 * Claude API integration
 * Handles screenshot analysis with vision API
 */

import { CLAUDE_API_KEY, API_CONFIG } from './apiConfig.js';

/**
 * Analyze screenshot with Claude Vision API
 * @param {string} base64Image - Base64 encoded image data URL
 * @param {string} sourceUrl - URL where screenshot was taken
 * @param {string[]} existingSections - Array of existing section names to encourage reuse
 * @returns {Promise<{explanation: string, suggested_section: string}>}
 */
export async function analyzeScreenshot(base64Image, sourceUrl = '', existingSections = []) {
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image;

    // Build prompt with existing sections if available
    let sectionGuidance = '';
    if (existingSections.length > 0) {
      sectionGuidance = `\n\nIMPORTANT: Existing sections in this document:\n${existingSections.map(s => `- ${s}`).join('\n')}\n\nStrongly prefer using one of these existing sections if the content is related. Only create a new section name if the content is clearly different from all existing sections.`;
    }

    const prompt = `Analyze this screenshot and determine the best way to represent the content.

CRITICAL DECISION: First determine if this is TEXT-BASED content that can be extracted verbatim, or VISUAL content that should be described.

**TEXT-BASED CONTENT** (extract exactly):
- Plain text, paragraphs, definitions
- Code snippets with readable text
- Mathematical equations with clear text
- Tables with readable data
- Lists with text items

**VISUAL CONTENT** (describe, don't extract):
- Graphs, charts, plots, visualizations
- Diagrams with visual elements
- Images, photos, illustrations
- Complex visual layouts
- Screenshots of UI elements

EXAMPLES:

TEXT-BASED (extract exactly):
- Code: \`\`\`javascript\\nconst [count, setCount] = useState(0);\\n\`\`\`
- Equation: $$E = mc^2$$
- Table: | Name | Age |\\n|------|-----|\\n| John | 25  |
- Text: "Neural networks have three layers: input, hidden, and output."

VISUAL CONTENT (describe):
- Graph showing temporal data patterns
- Chart displaying sales trends over time
- Diagram illustrating system architecture
- Screenshot of a user interface

Context: This was captured from ${sourceUrl || 'a web page'}.${sectionGuidance}

Format your response as valid JSON:
{
  "content_type": "text|code|equation|table|diagram|visual",
  "markdown_content": "Extracted content (if text-based) OR empty string (if visual)",
  "explanation": "Description of what the content shows",
  "suggested_section": "Topic Name"
}`;

    const response = await fetch(API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': API_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        max_tokens: API_CONFIG.maxTokens,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Data
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;

    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON response
    const result = JSON.parse(responseText);

    return {
      content_type: result.content_type || 'text',
      markdown_content: result.markdown_content || '',
      explanation: result.explanation || 'No explanation provided',
      suggested_section: result.suggested_section || 'General'
    };
  } catch (error) {
    console.error('Error analyzing screenshot:', error);

    // Return fallback response
    return {
      content_type: 'text',
      markdown_content: '',
      explanation: 'Unable to generate AI explanation. Please add your own notes.',
      suggested_section: 'General',
      error: error.message
    };
  }
}

/**
 * Mock AI response for testing without API calls
 */
export function getMockAnalysis() {
  const mockResponses = [
    {
      explanation: 'This diagram illustrates the architecture of a neural network with input, hidden, and output layers. Each node represents a neuron, and connections show weighted pathways for data flow.',
      suggested_section: 'Neural Networks'
    },
    {
      explanation: 'This code snippet demonstrates the useState hook in React. It shows how to declare state variables and update functions in functional components.',
      suggested_section: 'React Hooks'
    },
    {
      explanation: 'This database schema shows the relationship between users and posts tables. The foreign key constraint maintains referential integrity between related records.',
      suggested_section: 'Database Design'
    }
  ];

  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

/**
 * Analyze selected text with Claude API
 * @param {string} text - Selected text content
 * @param {string} sourceUrl - URL where text was selected
 * @param {string[]} existingSections - Array of existing section names
 * @returns {Promise<{content_type: string, markdown_content: string, explanation: string, suggested_section: string}>}
 */
export async function analyzeText(text, sourceUrl = '', existingSections = []) {
  try {
    // Build prompt with existing sections if available
    let sectionGuidance = '';
    if (existingSections.length > 0) {
      sectionGuidance = `\n\nIMPORTANT: Existing sections in this document:\n${existingSections.map(s => `- ${s}`).join('\n')}\n\nStrongly prefer using one of these existing sections if the content is related. Only create a new section name if the content is clearly different from all existing sections.`;
    }

    const prompt = `Analyze this selected text and format it as markdown.

CRITICAL: Format the text exactly as it appears, preserving the original content and structure. Do NOT summarize or paraphrase.

For different content types:
- **Plain Text**: Format as markdown with proper structure
- **Code**: Format with appropriate code blocks and syntax highlighting
- **Equations**: Convert to LaTeX format ($...$ for inline, $$...$$ for block)
- **Lists**: Format as markdown lists
- **Definitions**: Format with proper headings and structure

Selected text:
"${text}"

Context: This was selected from ${sourceUrl || 'a web page'}.${sectionGuidance}

Format your response as valid JSON:
{
  "content_type": "text|code|equation|list|definition",
  "markdown_content": "The formatted text as markdown",
  "explanation": "Brief context or additional notes (only if needed)",
  "suggested_section": "Topic Name"
}`;

    const response = await fetch(API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': API_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        max_tokens: API_CONFIG.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;

    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON response
    const result = JSON.parse(responseText);

    return {
      content_type: result.content_type || 'text',
      markdown_content: result.markdown_content || text,
      explanation: result.explanation || '',
      suggested_section: result.suggested_section || 'General'
    };
  } catch (error) {
    console.error('Error analyzing text:', error);

    // Return fallback response
    return {
      content_type: 'text',
      markdown_content: text,
      explanation: 'Unable to generate AI analysis. Text captured as-is.',
      suggested_section: 'General',
      error: error.message
    };
  }
}

/**
 * Analyze image URL with Claude API
 * @param {string} imageUrl - URL of the image
 * @param {string} sourceUrl - URL where image was found
 * @param {string[]} existingSections - Array of existing section names
 * @returns {Promise<{content_type: string, markdown_content: string, explanation: string, suggested_section: string}>}
 */
export async function analyzeImage(imageUrl, sourceUrl = '', existingSections = []) {
  try {
    // Convert image URL to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Build prompt with existing sections if available
    let sectionGuidance = '';
    if (existingSections.length > 0) {
      sectionGuidance = `\n\nIMPORTANT: Existing sections in this document:\n${existingSections.map(s => `- ${s}`).join('\n')}\n\nStrongly prefer using one of these existing sections if the content is related. Only create a new section name if the content is clearly different from all existing sections.`;
    }

    const prompt = `Analyze this image and provide educational notes about the content.

CRITICAL: Focus on the EDUCATIONAL VALUE and CONTENT, not visual description. Provide study notes about what the image teaches or shows.

For different image types:
- **Diagrams/Charts**: Explain the concepts, relationships, or data patterns shown
- **Code/Text**: Extract any readable text or code content
- **Mathematical content**: Explain the mathematical concepts or equations
- **Scientific content**: Explain the scientific principles or data
- **Technical content**: Explain the technical concepts or processes

DO NOT describe visual appearance like "this is a blue chart" or "this shows a graph". Instead, explain what the content teaches.

Examples of GOOD analysis:
- "This diagram illustrates the neural network architecture with three layers: input, hidden, and output. Each layer processes data through weighted connections."
- "This chart shows sales data trending upward over time, indicating growth in the market."
- "This equation represents Einstein's mass-energy equivalence principle."

Examples of BAD analysis:
- "This is a blue line chart with data points"
- "This shows a graph with axes and labels"
- "This is a diagram with boxes and arrows"

Context: This image was found on ${sourceUrl || 'a web page'}.${sectionGuidance}

Format your response as valid JSON:
{
  "content_type": "diagram|chart|code|equation|text|visual",
  "markdown_content": "Any extractable text content (if applicable)",
  "explanation": "Educational notes about what this image teaches",
  "suggested_section": "Topic Name"
}`;

    const response2 = await fetch(API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': API_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        max_tokens: API_CONFIG.maxTokens,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64.split(',')[1]
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    if (!response2.ok) {
      const errorData = await response2.json();
      throw new Error(`API error: ${errorData.error?.message || response2.statusText}`);
    }

    const data = await response2.json();
    let responseText = data.content[0].text;

    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON response
    const result = JSON.parse(responseText);

    return {
      content_type: result.content_type || 'visual',
      markdown_content: result.markdown_content || '',
      explanation: result.explanation || 'Educational content analysis',
      suggested_section: result.suggested_section || 'General'
    };
  } catch (error) {
    console.error('Error analyzing image:', error);

    // Return fallback response
    return {
      content_type: 'visual',
      markdown_content: '',
      explanation: 'Unable to analyze image. Please add your own notes.',
      suggested_section: 'General',
      error: error.message
    };
  }
}

/**
 * Analyze table data with Claude API
 * @param {string} tableData - HTML or structured table data
 * @param {string} sourceUrl - URL where table was found
 * @param {string[]} existingSections - Array of existing section names
 * @returns {Promise<{content_type: string, markdown_content: string, explanation: string, suggested_section: string}>}
 */
export async function analyzeTable(tableData, sourceUrl = '', existingSections = []) {
  try {
    // Build prompt with existing sections if available
    let sectionGuidance = '';
    if (existingSections.length > 0) {
      sectionGuidance = `\n\nIMPORTANT: Existing sections in this document:\n${existingSections.map(s => `- ${s}`).join('\n')}\n\nStrongly prefer using one of these existing sections if the content is related. Only create a new section name if the content is clearly different from all existing sections.`;
    }

    const prompt = `Analyze this table data and convert it to markdown table format.

CRITICAL: Convert the table data to proper markdown table format. Preserve all data exactly as it appears.

Table data:
${tableData}

Context: This table was found on ${sourceUrl || 'a web page'}.${sectionGuidance}

Format your response as valid JSON:
{
  "content_type": "table",
  "markdown_content": "The table formatted as markdown",
  "explanation": "Brief description of what the table shows",
  "suggested_section": "Topic Name"
}`;

    const response = await fetch(API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': API_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        max_tokens: API_CONFIG.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;

    // Strip markdown code blocks if present
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse JSON response
    const result = JSON.parse(responseText);

    return {
      content_type: 'table',
      markdown_content: result.markdown_content || tableData,
      explanation: result.explanation || 'Table data captured',
      suggested_section: result.suggested_section || 'General'
    };
  } catch (error) {
    console.error('Error analyzing table:', error);

    // Return fallback response
    return {
      content_type: 'table',
      markdown_content: tableData,
      explanation: 'Unable to generate AI analysis. Table captured as-is.',
      suggested_section: 'General',
      error: error.message
    };
  }
}
