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

    const prompt = `Analyze this screenshot and extract the key information as study notes.

Write the explanation as if YOU are taking notes for yourself - use natural, direct language without meta-references like "this screenshot shows" or "this passage says" or "this image displays". Just state the facts and concepts directly as you would in your own notebook.

Example of BAD notes: "This screenshot shows a neural network with three layers."
Example of GOOD notes: "Neural networks consist of three main layers: input, hidden, and output. Each node represents a neuron with weighted connections."

Provide:
1. A clear 2-3 sentence explanation in natural study note style (be specific and educational)
2. What topic/section this relates to (e.g., "Neural Networks", "React Hooks", "Database Design")

Context: This was captured from ${sourceUrl || 'a web page'}.${sectionGuidance}

Format your response as valid JSON:
{
  "explanation": "Your natural study notes here (2-3 sentences, no meta-references)",
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
      explanation: result.explanation || 'No explanation provided',
      suggested_section: result.suggested_section || 'General'
    };
  } catch (error) {
    console.error('Error analyzing screenshot:', error);

    // Return fallback response
    return {
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
