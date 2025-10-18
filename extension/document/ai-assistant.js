/**
 * AI Document Assistant
 * Provides inline diff editing with Claude API
 */

import { CLAUDE_API_KEY, API_CONFIG } from '../utils/apiConfig.js';

/**
 * Call Claude API to modify markdown based on user command
 * @param {string} currentMarkdown - Current markdown content
 * @param {string} command - User's command/instruction
 * @returns {Promise<string>} - Modified markdown
 */
export async function getAIModification(currentMarkdown, command) {
  try {
    const prompt = `You are a markdown document editor. The user has a markdown document and wants to modify it.

Current document:
\`\`\`markdown
${currentMarkdown}
\`\`\`

User command: "${command}"

Return ONLY the modified markdown document. Do not include explanations, markdown code fences, or any other text. Just return the complete modified markdown content directly.`;

    const response = await fetch(API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': API_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
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
    let modifiedMarkdown = data.content[0].text;

    // Strip markdown code blocks if present
    modifiedMarkdown = modifiedMarkdown.replace(/```markdown\s*/g, '').replace(/```\s*/g, '').trim();

    return modifiedMarkdown;
  } catch (error) {
    console.error('Error getting AI modification:', error);
    throw error;
  }
}

/**
 * Generate line-by-line diff
 * @param {string} original - Original markdown
 * @param {string} modified - Modified markdown
 * @returns {Array<{type: 'added'|'removed'|'unchanged', content: string}>}
 */
export function generateDiff(original, modified) {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const diff = [];

  // Simple line-by-line diff algorithm
  let i = 0, j = 0;

  while (i < originalLines.length || j < modifiedLines.length) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[j];

    if (i >= originalLines.length) {
      // Only modified lines left - all added
      diff.push({ type: 'added', content: modLine });
      j++;
    } else if (j >= modifiedLines.length) {
      // Only original lines left - all removed
      diff.push({ type: 'removed', content: origLine });
      i++;
    } else if (origLine === modLine) {
      // Lines match - unchanged
      diff.push({ type: 'unchanged', content: origLine });
      i++;
      j++;
    } else {
      // Lines differ - check if it's an addition, removal, or change
      // Look ahead to see if original line appears later in modified
      const origInModified = modifiedLines.slice(j).indexOf(origLine);
      const modInOriginal = originalLines.slice(i).indexOf(modLine);

      if (origInModified !== -1 && (modInOriginal === -1 || origInModified < modInOriginal)) {
        // Original line appears later in modified - current mod line is added
        diff.push({ type: 'added', content: modLine });
        j++;
      } else if (modInOriginal !== -1) {
        // Modified line appears later in original - current orig line is removed
        diff.push({ type: 'removed', content: origLine });
        i++;
      } else {
        // Both lines are different - treat as removal + addition
        diff.push({ type: 'removed', content: origLine });
        diff.push({ type: 'added', content: modLine });
        i++;
        j++;
      }
    }
  }

  return diff;
}

/**
 * Create diff view div element
 * @param {Array} diff - Diff array from generateDiff
 * @returns {HTMLDivElement}
 */
export function createDiffView(diff) {
  const diffDiv = document.createElement('div');
  diffDiv.className = 'diff-view';
  diffDiv.contentEditable = 'false'; // Make it read-only

  diff.forEach(line => {
    const lineDiv = document.createElement('div');
    lineDiv.className = `diff-line diff-${line.type}`;
    lineDiv.textContent = line.content || '\u00A0'; // Use nbsp for empty lines
    
    if (line.type === 'removed') {
      lineDiv.style.textDecoration = 'line-through';
    }
    
    diffDiv.appendChild(lineDiv);
  });

  return diffDiv;
}

/**
 * Extract plain text from diff view
 * @param {HTMLDivElement} diffDiv 
 * @returns {string}
 */
export function extractAcceptedText(diffDiv) {
  const lines = [];
  const lineElements = diffDiv.querySelectorAll('.diff-line');
  
  lineElements.forEach(lineEl => {
    if (lineEl.classList.contains('diff-removed')) {
      // Skip removed lines
      return;
    }
    
    const content = lineEl.textContent;
    // Convert nbsp back to empty string
    lines.push(content === '\u00A0' ? '' : content);
  });
  
  return lines.join('\n');
}

