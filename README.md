# Nexus
## Elevator Pitch
Research is messy. Capture anything (text, images, tables), Nexus AI explains it seamlessly with sources and builds one organized, polished markdown document. You guide, AI executes. Tab to accept.

## Inspiration
Research feels like drowning in browser tabs, screenshots, and scattered notes that never get organized. Interfacing with AI generally consists of manually dragging screenshots or copy-pasting text into an LLM chat. But context is important, and without one unified hub that captures the user's intent and all relevant information, AI is not used to its full potential. In addition, an integrated research agent that chains Claude's reasoning with web search tools makes research much more powerful, providing sourced explanations that cite original materials rather than hallucinating facts. We built Nexus to make research feel effortless—capture anything instantly, let AI do the synthesis, and stay in control of what makes it into your final document.

## What it does
Nexus allows you to use hotkeys to seamlessly capture anything (text, screenshots, diagrams, tables) during your research, explains it with a powerful AI research agent that has your entire document context as well as tool-calling capabililties, and build a synthesized markdown document. At every step, you can accept, edit, or reject the AI's suggestions as well as prompt it to align with your intentions. After building the document, Nexus's markdown editor can be used to revise your document on the fly as well as use AI for further revision. You stay in control: approve each addition, reorganize with natural language commands, review changes with inline diffs. Tab to accept, Esc to reject. 

## How we built it
We built Nexus as a Chrome extension using React and Claude's Sonnet 4 API, with the central goal of making capture and document-building seamless and triggered by keyboard shortcuts (Command+Shift+S for screenshots, Command+Shift+E for text, Tab to accept AI edits). 

The screenshot system injects an overlay that calculates viewport coordinates, uses Chrome's captureVisibleTab API, and times element removal to avoid capturing the overlay itself. 

The research agent integrates Claude with custom tool-calling for web search, providing your entire document as context and parsing structured JSON responses to ensure cited sources rather than hallucinations. There are different sub-agents carefully prompted and provided with different tool-calling capabilities for different use-cases: a vision model analyzes screenshots, a markdown processing agent converts to markdown when possible, and all feed into the central research agent.

For editing, we built a split-view markdown editor with ReactMarkdown and KaTeX, plus an AI assistant using a contenteditable swap technique—hide the textarea, show a diff view with green/red highlighting, accept with Tab or reject with Esc—giving Cursor-style inline diffs without complex libraries. There are multiple ways to edit the document (e.g., new captures vs direct Markdown editing), so we always use the most recent action as source of truth, letting users fluidly switch between manual editing and AI-assisted capture.

## Challenges we ran into
Storage presented an unexpected challenge, as service workers can't use URL.createObjectURL, so we opted to store base64 images directly in IndexedDB and load them dynamically. Capturing clean screenshots required unexpected timing, since we had to hide the overlay and wait for the element's removal before calling the tab capture function, or the overlay would appear in the saved screenshot. 

Dealing with responses from various different AI agents in different formats was also more difficult than expected, especially when they were used for something as rigid as markdown document creation. The API would sometimes wrap JSON in markdown code, requiring us to implement additional regex functions for stripping to parse the actual data. 

Finally, merging edited markdown with new captures resulting in syncing errors. We ended up using logic that always uses most recent user action.

## Accomplishments that we're proud of
We're really proud of how seamless the capture flow feels, allowing you to press a hotkey, drag a region, and you're done. There's context switching or manual copying and pasting, or dealing with missing context, which we believe would be very useful during practical research settings. 

The AI agent system surprised us with how well it works in practice, as the vision model is able to reliably extracts equations from screenshots, the research agent reliably cites sources, and all the document context allow suggestions to remain coherent. 

## What we learned
At a high level, we learned about the human-AI interaction needed to make an AI tool truly be beneficial rather than hindering. We focused on creating a tight human-in-the-loop workflow so that users maintain absolute control over what enters their document and how the AI is being used. 

From a technical perspective, we learned about Chrome extension architecture (content scripts, service workers, message passing), the limitations of worker storage APIs, and the importance of carefully structuring AI prompts to return parseable responses, and much more.

## What's next for Nexus
We're very happy with the experience of Nexus and would like to further build on how AI can help users learn and take notes in a truly frictionless way. For example, we'd like to add proactive AI suggestions that enrich the note taking experience by offering suggestions such as "would you like to add an explanation to this figure?" or "these two paragraphs seem contradicting - would you like to take another look at them?" However, we want to be careful not to overwhelm users with suggestions that break their flow. We'd also like to explore concepts like spaced repetition for retention, collaborative note taking, and deeper academic database integrations (arXiv, PubMed). The goal is to evolve Nexus from a capture tool into a complete learning system that helps you not just organize research, but internalize it. 