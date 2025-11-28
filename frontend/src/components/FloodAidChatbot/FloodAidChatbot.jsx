import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle, Globe } from 'lucide-react';
import { AIService } from '../../services/ai/aiService';
import { isRelevantQuery, detectEmergency, getRedirectMessage } from '../../services/prompts/promptService';
import '../../styles/chatbot/chatbot.css';

const FloodAidChatbot = ({ 
  apiKey,
  model = 'gemini-pro',
  position = 'bottom-right',
  onEmergency = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m your Flood Aid Assistant.\n\nI can help you with:\n• Flood emergency procedures\n• First aid in flood situations\n• Evacuation guidance\n• Relief resources\n\nHow can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const aiServiceRef = useRef(null);

  // Initialize AI service
  useEffect(() => {
    if (apiKey) {
      aiServiceRef.current = new AIService(apiKey, model);
    }
  }, [apiKey, model]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (! inputValue.trim() || isLoading || !aiServiceRef.current) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      isEmergency: detectEmergency(inputValue)
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Check if query is relevant
    if (! isRelevantQuery(currentInput)) {
      const redirectMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getRedirectMessage(currentInput),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, redirectMessage]);
      setIsLoading(false);
      return;
    }

    // Trigger emergency callback if needed
    if (userMessage.isEmergency && onEmergency) {
      onEmergency(currentInput);
    }

    try {
      const response = await aiServiceRef.current. getChatResponse(
        messages,
        currentInput
      );

      const assistantMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ I encountered an error. Please try again or contact emergency services if this is urgent.\n\n📞 Emergency: 911',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '👋 Chat cleared!  How can I help you with flood aid? ',
        timestamp: new Date()
      }
    ]);
    if (aiServiceRef.current) {
      aiServiceRef.current. resetChat();
    }
  };

  return (
    <div className={`chatbot-container ${position}`}>
      {/* Floating Button */}
      {! isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-toggle-btn"
          aria-label="Open Flood Aid Chat"
        >
          <MessageCircle size={24} />
          <span className="pulse-ring"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <AlertTriangle className="emergency-icon" size={20} />
              <div>
                <h3>Flood Aid Assistant</h3>
                <div className="multilingual-badge">
                  <Globe size={12} />
                  <span>Multilingual Support</span>
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                onClick={clearChat}
                className="chatbot-clear-btn"
                aria-label="Clear chat"
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-close-btn"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-container ${message.role} ${message.isEmergency ? 'emergency' : ''}`}
              >
                <div className="message-content">
                  {message.content. split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-container assistant">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-container">
            <div className="chatbot-input">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about flood aid..."
                disabled={isLoading}
                className="chatbot-input-field"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="chatbot-send-btn"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="powered-by">
              Powered by Google Gemini AI 🤖
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloodAidChatbot;