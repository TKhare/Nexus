import React, { useState, useEffect } from 'react';
import ApprovalCard from './ApprovalCard.jsx';
import SectionSelector from './SectionSelector.jsx';
import MarkdownRenderer from '../document/MarkdownRenderer.jsx';

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

export default function Popup() {
  const [pendingCapture, setPendingCapture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [editedExplanation, setEditedExplanation] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('research');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [captures, setCaptures] = useState([]);

  // Load pending capture on mount
  useEffect(() => {
    loadPendingCapture();
    loadSections();
    loadCaptures();
  }, []);

  const loadPendingCapture = async () => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage({
        action: 'GET_PENDING_CAPTURE'
      });

      if (response.capture) {
        setPendingCapture(response.capture);
        setEditedExplanation(response.capture.explanation);
        setSelectedSection(response.capture.section);
      } else {
        setPendingCapture(null);
      }
    } catch (err) {
      setError('Failed to load capture');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const result = await chrome.storage.local.get(['captures']);
      const captures = result.captures || [];
      const uniqueSections = [...new Set(captures.map(c => c.section))];
      setSections(uniqueSections.sort());
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  };

  const loadCaptures = async () => {
    try {
      const result = await chrome.storage.local.get(['captures']);
      setCaptures(result.captures || []);
    } catch (err) {
      console.error('Failed to load captures:', err);
    }
  };

  const handleAccept = async () => {
    try {
      // Update capture with edited values
      const updatedCapture = {
        ...pendingCapture,
        explanation: editedExplanation,
        section: selectedSection
      };

      await chrome.runtime.sendMessage({
        action: 'APPROVE_CAPTURE',
        capture: updatedCapture
      });

      // Show success and close
      alert('Capture saved successfully!');
      window.close();
    } catch (err) {
      setError('Failed to save capture');
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'REJECT_CAPTURE'
      });

      window.close();
    } catch (err) {
      setError('Failed to reject capture');
      console.error(err);
    }
  };

  const handleViewDocument = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('document/document.html') });
  };


  const handleStartChat = async () => {
    try {
      // First save the capture
      const updatedCapture = {
        ...pendingCapture,
        explanation: editedExplanation,
        section: selectedSection
      };

      await chrome.runtime.sendMessage({
        action: 'APPROVE_CAPTURE',
        capture: updatedCapture
      });

      // Reload captures to include the new one
      await loadCaptures();
      
      // Start chat with this capture focused
      setShowChat(true);
    } catch (err) {
      setError('Failed to save capture');
      console.error(err);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoadingChat) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsLoadingChat(true);

    const newChatHistory = [...chatHistory, { type: 'user', content: userMessage }];
    setChatHistory(newChatHistory);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'CHAT_WITH_GRAPH',
        userMessage: userMessage,
        captures: captures,
        agent: selectedAgent,
        agentPrompt: AGENTS[selectedAgent].prompt,
        focusedCapture: pendingCapture
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
        content: 'Sorry, I encountered an error processing your question.'
      }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleMoveToFullPage = () => {
    // Store the current capture ID and chat context for the agent to focus on
    if (pendingCapture?.id) {
      chrome.storage.local.set({
        focusCaptureId: pendingCapture.id,
        lastCaptureTime: Date.now(),
        // Transfer chat context
        popupChatHistory: chatHistory,
        popupSelectedAgent: selectedAgent,
        popupChatContext: 'transfer'
      });
    }
    chrome.tabs.create({ url: chrome.runtime.getURL('document/document.html') });
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="popup-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.close()}>Close</button>
        </div>
      </div>
    );
  }

  if (!pendingCapture) {
    return (
      <div className="popup-container">
        <div className="no-capture">
          <h2>AI Research Assistant</h2>
          <p>No pending captures</p>
          <p className="hint">Press <kbd>Ctrl+Shift+S</kbd> (or <kbd>Cmd+Shift+S</kbd> on Mac) to capture a screenshot</p>
          <button onClick={handleViewDocument} className="btn-primary">
            View Document
          </button>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="popup-container popup-chat">
        <div className="chat-header">
          <div className="header-controls">
            <button 
              className="agent-selector"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
            >
              <span className="agent-icon">{AGENTS[selectedAgent].icon}</span>
              <span className="agent-name">{AGENTS[selectedAgent].name}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showAgentSelector && (
              <div className="agent-dropdown">
                {Object.entries(AGENTS).map(([key, agent]) => (
                  <div
                    key={key}
                    className={`agent-option ${selectedAgent === key ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAgent(key);
                      setShowAgentSelector(false);
                    }}
                  >
                    <div className="agent-info">
                      <span className="agent-icon">{agent.icon}</span>
                      <span className="agent-name">{agent.name}</span>
                    </div>
                    <div className="agent-description">{agent.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="btn-move-to-full"
            onClick={handleMoveToFullPage}
            title="Move to full page"
          >
            📄 Full Page
          </button>
        </div>

        <div className="chat-history">
          {/* Show focused capture as system message */}
          {pendingCapture && (
            <div className="chat-message system">
              <div className="message-agent">
                <span className="agent-icon">🎯</span>
                <span className="agent-name">System</span>
              </div>
              <div className="message-content">
                <div className="focused-capture-message">
                  <h4>Focused on Recent Capture</h4>
                  <div className="capture-preview">
                    <strong>{pendingCapture.section}</strong>
                    <p>{pendingCapture.explanation}</p>
                    {pendingCapture.markdown_content && (
                      <div className="markdown-preview">
                        <MarkdownRenderer markdown={pendingCapture.markdown_content} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {chatHistory.length === 0 ? (
            <div className="welcome-message">
              <div className="agent-intro">
                <span className="agent-icon-large">{AGENTS[selectedAgent].icon}</span>
                <h3>{AGENTS[selectedAgent].name}</h3>
                <p>{AGENTS[selectedAgent].description}</p>
              </div>
              <p>Ask me anything about your recent capture!</p>
            </div>
          ) : (
            chatHistory.map((message, index) => (
              <div key={index} className={`chat-message ${message.type}`}>
                {message.type === 'assistant' && (
                  <div className="message-agent">
                    <span className="agent-icon">{AGENTS[message.agent || selectedAgent].icon}</span>
                    <span className="agent-name">{AGENTS[message.agent || selectedAgent].name}</span>
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
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="source-item">
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form className="chat-input-form" onSubmit={handleChatSubmit}>
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder={`Ask ${AGENTS[selectedAgent].name.toLowerCase()}...`}
            disabled={isLoadingChat}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!chatMessage.trim() || isLoadingChat}
            className="chat-send-btn"
          >
            {isLoadingChat ? '⏳' : '➤'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <ApprovalCard
        capture={pendingCapture}
        explanation={editedExplanation}
        onExplanationChange={setEditedExplanation}
      />

      <div className="section-selection">
        {showSectionSelector ? (
          <SectionSelector
            sections={sections}
            selectedSection={selectedSection}
            onSelectSection={(section) => {
              setSelectedSection(section);
              setShowSectionSelector(false);
            }}
            onCancel={() => setShowSectionSelector(false)}
          />
        ) : (
          <div className="section-info">
            <span className="section-label">Adding to section:</span>
            <span className="section-name">{selectedSection}</span>
            <button
              className="btn-change-section"
              onClick={() => setShowSectionSelector(true)}
            >
              Change
            </button>
          </div>
        )}
      </div>

      <div className="actions">
        <button className="btn-accept" onClick={handleAccept}>
          Accept
        </button>
        <button className="btn-reject" onClick={handleReject}>
          Reject
        </button>
      </div>

      <div className="footer">
        <button 
          className="btn-primary" 
          onClick={handleStartChat}
        >
          💬 Start Chat
        </button>
        <button className="btn-link" onClick={handleViewDocument}>
          View Full Document
        </button>
      </div>
    </div>
  );
}
