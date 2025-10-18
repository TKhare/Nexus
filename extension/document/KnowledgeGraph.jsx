import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

const AGENTS = {
  research: {
    name: 'Research Agent',
    icon: '🔬',
    description: 'Finds and connects information across your knowledge base',
    prompt: 'You are a Research Agent specialized in finding and connecting information across the user\'s knowledge base. Focus on discovering patterns, relationships, and insights from their captured content. Ask probing questions to help them explore their research more deeply.',
    color: '#4A90E2'
  },
  websearch: {
    name: 'Web Search Agent', 
    icon: '🌐',
    description: 'Uses Claude\'s native web search for real-time information',
    prompt: 'You are a Web Search Agent with access to Claude\'s native web search capabilities. When users ask about recent developments, current events, or need additional context, use web search to find up-to-date information and present the findings with proper citations.',
    color: '#28a745'
  },
  analysis: {
    name: 'Analysis Agent',
    icon: '📊', 
    description: 'Provides deep analysis and critical thinking on your research',
    prompt: 'You are an Analysis Agent focused on deep critical thinking and analysis. Help users understand the implications, limitations, and deeper meaning of their research. Ask challenging questions and provide thoughtful analysis.',
    color: '#ffc107'
  },
  summarizer: {
    name: 'Summarization Agent',
    icon: '📝',
    description: 'Condenses complex topics into clear, actionable insights',
    prompt: 'You are a Summarization Agent that excels at distilling complex information into clear, concise summaries. Focus on extracting key insights, main points, and actionable takeaways from the user\'s research.',
    color: '#17a2b8'
  },
  connector: {
    name: 'Connection Agent',
    icon: '🔗',
    description: 'Finds unexpected links and relationships between topics',
    prompt: 'You are a Connection Agent that specializes in finding unexpected relationships and connections between different topics in the user\'s knowledge base. Help them see patterns and links they might have missed.',
    color: '#6f42c1'
  }
};

export default function KnowledgeGraph() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('research');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [focusedCapture, setFocusedCapture] = useState(null);

  useEffect(() => {
    loadCaptures();
    // Add a small delay to ensure captures are loaded before checking for focused capture
    setTimeout(checkForFocusedCapture, 100);
  }, []);

  const checkForFocusedCapture = async () => {
    try {
      const result = await chrome.storage.local.get([
        'focusCaptureId', 
        'popupChatHistory', 
        'popupSelectedAgent', 
        'popupChatContext'
      ]);
      console.log('Checking for focused capture and chat context:', result);
      
      if (result.focusCaptureId) {
        // Load all captures to find the focused one
        const capturesResult = await chrome.storage.local.get(['captures']);
        const allCaptures = capturesResult.captures || [];
        console.log('All captures:', allCaptures);
        
        const focused = allCaptures.find(c => c.id === result.focusCaptureId);
        console.log('Found focused capture:', focused);
        
        if (focused) {
          setFocusedCapture(focused);
          
          // Check if we have transferred chat context from popup
          if (result.popupChatContext === 'transfer' && result.popupChatHistory) {
            console.log('Transferring chat history from popup:', result.popupChatHistory);
            setChatHistory(result.popupChatHistory);
            
            if (result.popupSelectedAgent) {
              setSelectedAgent(result.popupSelectedAgent);
            }
          }
        } else {
          console.log('Focused capture not found in captures list');
        }
        
        // Clear all the transfer data after using it
        await chrome.storage.local.remove([
          'focusCaptureId', 
          'popupChatHistory', 
          'popupSelectedAgent', 
          'popupChatContext'
        ]);
      }
    } catch (error) {
      console.error('Error checking for focused capture:', error);
    }
  };

  // Close agent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAgentSelector && !event.target.closest('.agent-selector')) {
        setShowAgentSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAgentSelector]);

  const loadCaptures = async () => {
    try {
      const result = await chrome.storage.local.get(['captures']);
      const capturesData = result.captures || [];
      setCaptures(capturesData);
    } catch (error) {
      console.error('Failed to load captures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoadingChat) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsLoadingChat(true);

    // Add user message to chat history
    const newChatHistory = [...chatHistory, { type: 'user', content: userMessage }];
    setChatHistory(newChatHistory);

    try {
      // Send message to background script for AI processing with agent context
      const response = await chrome.runtime.sendMessage({
        action: 'CHAT_WITH_GRAPH',
        userMessage: userMessage,
        captures: captures,
        agent: selectedAgent,
        agentPrompt: AGENTS[selectedAgent].prompt,
        focusedCapture: focusedCapture
      });

      if (response.success) {
        setChatHistory(prev => [...prev, { 
          type: 'assistant', 
          content: response.response,
          sources: response.sources || [],
          agent: selectedAgent
        }]);
      } else {
        setChatHistory(prev => [...prev, { 
          type: 'assistant', 
          content: 'Sorry, I encountered an error processing your question.',
          agent: selectedAgent
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: 'Sorry, I encountered an error processing your question.',
        agent: selectedAgent
      }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="knowledge-graph">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-graph">
      <div className="graph-header">
        <h2>AI Research Agents</h2>
        <div className="header-controls">
          <div className="agent-selector">
            <button 
              className="agent-selector-btn"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
            >
              <span className="agent-icon">{AGENTS[selectedAgent].icon}</span>
              <span className="agent-name">{AGENTS[selectedAgent].name}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showAgentSelector && (
              <div className="agent-dropdown">
                {Object.entries(AGENTS).map(([key, agent]) => (
                  <button
                    key={key}
                    className={`agent-option ${selectedAgent === key ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAgent(key);
                      setShowAgentSelector(false);
                    }}
                  >
                    <span className="agent-icon">{agent.icon}</span>
                    <div className="agent-info">
                      <div className="agent-name">{agent.name}</div>
                      <div className="agent-description">{agent.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="chat-interface">
        <div className="chat-history">
          {/* Always show focused capture as a system message if it exists */}
          {focusedCapture && (
            <div className="chat-message system">
              <div className="message-agent">
                <span className="agent-icon">🎯</span>
                <span className="agent-name">System</span>
              </div>
              <div className="message-content">
                <div className="focused-capture-message">
                  <h4>Focused on Recent Capture</h4>
                  <div className="capture-preview">
                    <strong>{focusedCapture.section}</strong>
                    <p>{focusedCapture.explanation}</p>
                    {focusedCapture.markdown_content && (
                      <div className="markdown-preview">
                        <MarkdownRenderer markdown={focusedCapture.markdown_content} />
                      </div>
                    )}
                  </div>
                  <div className="capture-actions">
                    <button 
                      className="btn-save-capture"
                      onClick={() => {
                        alert('This capture is already saved to your notes!');
                      }}
                    >
                      ✅ Already Saved to Notes
                    </button>
                    <button 
                      className="btn-clear-focus"
                      onClick={() => {
                        setFocusedCapture(null);
                        setChatMessage('');
                      }}
                    >
                      Clear Focus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {chatHistory.length === 0 ? (
            <div className="welcome-message">
              <div className="agent-intro">
                <span className="agent-icon-large">{AGENTS[selectedAgent].icon}</span>
                <h3>Welcome to {AGENTS[selectedAgent].name}!</h3>
                <p>{AGENTS[selectedAgent].description}</p>
              </div>
              
              {!focusedCapture && (
                <>
                  <p>I can help you with your research in the following ways:</p>
                  <ul>
                    <li>Find specific information across all your captures</li>
                    <li>Connect related topics and concepts</li>
                    <li>Summarize content from specific sections</li>
                    <li>Answer questions about your research</li>
                  </ul>
                </>
              )}
              
              <p>Try asking something like:</p>
              <div className="example-questions">
                {focusedCapture ? (
                  <>
                    <div className="example-question">"What are the key insights from this capture?"</div>
                    <div className="example-question">"How does this relate to my other research?"</div>
                    <div className="example-question">"What should I explore next based on this?"</div>
                  </>
                ) : (
                  <>
                    {selectedAgent === 'research' && (
                      <>
                        <div className="example-question">"What patterns do you see in my research?"</div>
                        <div className="example-question">"What are the main themes across my captures?"</div>
                        <div className="example-question">"What should I research next based on my notes?"</div>
                      </>
                    )}
                    {selectedAgent === 'websearch' && (
                      <>
                        <div className="example-question">"Search for latest AI research papers"</div>
                        <div className="example-question">"Find recent developments in machine learning"</div>
                        <div className="example-question">"Look up current trends in browser extensions"</div>
                      </>
                    )}
                    {selectedAgent === 'analysis' && (
                      <>
                        <div className="example-question">"What are the limitations of this approach?"</div>
                        <div className="example-question">"What are the implications of this research?"</div>
                        <div className="example-question">"What critical questions should I consider?"</div>
                      </>
                    )}
                    {selectedAgent === 'summarizer' && (
                      <>
                        <div className="example-question">"Summarize my notes on machine learning"</div>
                        <div className="example-question">"What are the key takeaways from this section?"</div>
                        <div className="example-question">"Give me a concise overview of my research"</div>
                      </>
                    )}
                    {selectedAgent === 'connector' && (
                      <>
                        <div className="example-question">"How do these topics connect?"</div>
                        <div className="example-question">"What unexpected relationships do you see?"</div>
                        <div className="example-question">"What links between my notes am I missing?"</div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            chatHistory.map((message, index) => (
              <div key={index} className={`chat-message ${message.type}`}>
                {message.type === 'assistant' && message.agent && (
                  <div className="message-agent">
                    <span className="agent-icon">{AGENTS[message.agent].icon}</span>
                    <span className="agent-name">{AGENTS[message.agent].name}</span>
                  </div>
                )}
                <div className="message-content">
                  {message.type === 'assistant' ? (
                    <MarkdownRenderer markdown={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="message-sources">
                    <strong>Sources:</strong>
                    <ul>
                      {message.sources.map((source, idx) => (
                        <li key={idx}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoadingChat && (
            <div className="chat-message assistant">
              <div className="message-agent">
                <span className="agent-icon">{AGENTS[selectedAgent].icon}</span>
                <span className="agent-name">{AGENTS[selectedAgent].name}</span>
              </div>
              <div className="message-content">Thinking...</div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleChatSubmit} className="chat-input-form">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder={`Ask ${AGENTS[selectedAgent].name} about your research...`}
            className="chat-input"
            disabled={isLoadingChat}
          />
          <button type="submit" disabled={isLoadingChat || !chatMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}