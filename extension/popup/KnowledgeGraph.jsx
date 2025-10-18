import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function KnowledgeGraph() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const svgRef = useRef();
  const graphRef = useRef();

  useEffect(() => {
    loadCaptures();
  }, []);

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

  useEffect(() => {
    if (captures.length > 0) {
      renderGraph();
    }
  }, [captures, searchTerm]);

  const renderGraph = () => {
    if (!svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Filter captures based on search term
    const filteredCaptures = captures.filter(capture => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        capture.explanation.toLowerCase().includes(searchLower) ||
        capture.section.toLowerCase().includes(searchLower) ||
        capture.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (capture.markdown_content && capture.markdown_content.toLowerCase().includes(searchLower))
      );
    });

    if (filteredCaptures.length === 0) return;

    // Create nodes and links
    const nodes = [];
    const links = [];
    const tagMap = new Map();

    // Create nodes for captures
    filteredCaptures.forEach(capture => {
      nodes.push({
        id: capture.id,
        type: 'capture',
        data: capture,
        label: capture.section,
        group: capture.content_type
      });

      // Create nodes for tags and link them
      capture.tags.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            id: `tag_${tag}`,
            type: 'tag',
            label: tag,
            group: 'tag'
          });
          nodes.push(tagMap.get(tag));
        }

        links.push({
          source: capture.id,
          target: `tag_${tag}`,
          strength: 0.5
        });
      });
    });

    // Set up SVG
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    svg.attr('width', width).attr('height', height);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => d.type === 'capture' ? 12 : 8)
      .attr('fill', d => {
        const colors = {
          'text': '#4A90E2',
          'code': '#28a745',
          'equation': '#ffc107',
          'table': '#17a2b8',
          'diagram': '#6f42c1',
          'visual': '#fd7e14',
          'chart': '#20c997',
          'tag': '#6c757d'
        };
        return colors[d.group] || '#6c757d';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (d.type === 'capture') {
          setSelectedNode(d);
        }
      })
      .on('mouseover', function(event, d) {
        // Show tooltip
        d3.select(this).attr('r', d.type === 'capture' ? 16 : 12);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', d.type === 'capture' ? 12 : 8);
      });

    // Add labels
    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y + 20);
    });

    // Store simulation reference
    graphRef.current = simulation;
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
      // Send message to background script for AI processing
      const response = await chrome.runtime.sendMessage({
        action: 'CHAT_WITH_GRAPH',
        message: userMessage,
        captures: captures
      });

      if (response.success) {
        setChatHistory(prev => [...prev, { 
          type: 'assistant', 
          content: response.response,
          sources: response.sources || []
        }]);
      } else {
        setChatHistory(prev => [...prev, { 
          type: 'assistant', 
          content: 'Sorry, I encountered an error processing your question.'
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

  if (loading) {
    return (
      <div className="knowledge-graph">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-graph">
      <div className="graph-header">
        <h2>Knowledge Graph</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="graph-content">
        <div className="graph-visualization">
          <svg ref={svgRef}></svg>
        </div>

        <div className="graph-sidebar">
          {selectedNode && (
            <div className="node-details">
              <h3>Node Details</h3>
              <div className="node-info">
                <p><strong>Type:</strong> {selectedNode.data.content_type}</p>
                <p><strong>Section:</strong> {selectedNode.data.section}</p>
                <p><strong>Tags:</strong> {selectedNode.data.tags.join(', ')}</p>
                <p><strong>Source:</strong> <a href={selectedNode.data.sourceUrl} target="_blank" rel="noopener noreferrer">View Source</a></p>
                {selectedNode.data.explanation && (
                  <div className="explanation">
                    <strong>Explanation:</strong>
                    <p>{selectedNode.data.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="chat-section">
            <h3>Chat with Your Notes</h3>
            <div className="chat-history">
              {chatHistory.map((message, index) => (
                <div key={index} className={`chat-message ${message.type}`}>
                  <div className="message-content">{message.content}</div>
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
              ))}
              {isLoadingChat && (
                <div className="chat-message assistant">
                  <div className="message-content">Thinking...</div>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="chat-input-form">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask a question about your notes..."
                className="chat-input"
                disabled={isLoadingChat}
              />
              <button type="submit" disabled={isLoadingChat || !chatMessage.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
