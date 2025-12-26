import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle, Globe, Mic, MicOff } from 'lucide-react';
import { AIService } from '../services/ai/aiService';
import { MistralService } from '../services/ai/mistralService';
import { isRelevantQuery, detectEmergency, getRedirectMessage } from '../services/prompts/promptService';
import '../styles/chatbot.css';

/**
 * Improved FloodAidChatbot
 * - Better error handling (shows localized emergency number)
 * - Logs full error to console for debugging
 * - Shows clearer messages when the AI service isn't initialized or returns nothing
 * - Voice input support for multilingual (including Punjabi)
 * - Mistral AI support
 */

const EMERGENCY_MAP = {
  US: '911',
  GB: '112',
  IN: '112',
  PK: '1122',
  AU: '000',
  CA: '911',
};

function getCountryCodeFromNavigator() {
  try {
    const locale = (navigator.language || navigator.userLanguage || '').toUpperCase();
    const parts = locale.split(/[-_]/);
    if (parts.length === 2 && parts[1].length === 2) return parts[1];
    const resolved = Intl?.DateTimeFormat()?.resolvedOptions()?.locale;
    if (resolved) {
      const p = resolved.toUpperCase().split(/[-_]/);
      if (p.length === 2) return p[1];
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getLocalizedEmergencyNumber() {
  const cc = getCountryCodeFromNavigator();
  if (cc && EMERGENCY_MAP[cc]) return EMERGENCY_MAP[cc];
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Pakistan') || tz.includes('Asia/Karachi')) return EMERGENCY_MAP.PK;
  } catch (e) { }
  return '112';
}

const FloodAidChatbot = ({
  apiKey,
  model = 'mistral-large-latest',
  position = 'bottom-right',
  onEmergency = null,
  aiProvider = 'mistral' // ✅ NEW: 'mistral' or 'gemini'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content:
        "👋 Hello!  I'm your Flood Aid Assistant.\n\n🌍 मैं किसी भी भाषा में बात कर सकता हूं | 我会说任何语言 | أتحدث أي لغة | ਮੈਂ ਕਿਸੇ ਵੀ ਭਾਸ਼ਾ ਵਿੱਚ ਗੱਲ ਕਰ ਸਕਦਾ ਹਾਂ\n\nI can help you with:\n• Flood emergency procedures\n• First aid in flood situations\n• Evacuation guidance\n• Relief resources\n\n🎤 Use the microphone to speak in any language!\n\nHow can I assist you today? ",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  const messagesEndRef = useRef(null);
  const aiServiceRef = useRef(null);
  const recognitionRef = useRef(null);
  const LOCAL_EMERGENCY = useRef(getLocalizedEmergencyNumber());

  // Language options for voice input
  const languages = {
    'en-US': '🇺🇸 English',
    'pa-IN': '🇮🇳 ਪੰਜਾਬੀ (Punjabi)',
    'hi-IN': '🇮🇳 हिंदी (Hindi)',
    'ur-PK': '🇵🇰 اردو (Urdu)',
    'ar-SA': '🇸🇦 العربية (Arabic)',
    'es-ES': '🇪🇸 Español (Spanish)',
    'fr-FR': '🇫🇷 Français (French)',
    'zh-CN': '🇨🇳 中文 (Chinese)',
  };

  // ✅ MODIFIED: Initialize AI Service (Mistral or Gemini)
  useEffect(() => {
    if (apiKey) {
      try {
        if (aiProvider === 'mistral') {
          console.log('🤖 Initializing Mistral AI.. .');
          aiServiceRef.current = new MistralService(apiKey, model);
          console.log('✅ Mistral AI initialized');
        } else {
          console.log('🤖 Initializing Google Gemini.. .');
          aiServiceRef.current = new AIService(apiKey, model);
          console.log('✅ Gemini AI initialized');
        }
      } catch (err) {
        console.error('Failed to initialize AI service:', err);
        aiServiceRef.current = null;
      }
    } else {
      aiServiceRef.current = null;
    }
  }, [apiKey, model, aiProvider]); // ✅ Added aiProvider to dependencies

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage;

      recognitionRef.current.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Recognized:', transcript);
        setInputValue(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);

        if (event.error === 'not-allowed') {
          alert('🎤 Microphone access denied. Please enable microphone permissions in your browser settings.');
        } else if (event.error === 'no-speech') {
          alert('🎤 No speech detected.  Please try again.');
        } else {
          alert(`🎤 Error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
      };
    } else {
      console.warn('⚠️ Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage, isListening]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('🎤 Speech recognition is not supported in your browser.\n\nPlease use:\n• Google Chrome\n• Microsoft Edge\n• Safari (iOS/macOS)');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        alert('🎤 Could not start voice input. Please try again.');
      }
    }
  };

  const sendSystemErrorMessage = (details) => {
    const emergency = LOCAL_EMERGENCY.current || '112';
    const content = `❌ I encountered an error.  Please try again later or contact local emergency services if this is urgent.\n\n📞 Emergency: ${emergency}\n\n(Technical: ${details})`;
    const errorMessage = {
      id: `err-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, errorMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      isEmergency: detectEmergency(inputValue)
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = inputValue;
    setInputValue('');
    setIsLoading(true);

    if (!isRelevantQuery(prompt)) {
      const redirect = {
        id: `r-${Date.now()}`,
        role: 'assistant',
        content: getRedirectMessage(prompt),
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, redirect]);
      setIsLoading(false);
      return;
    }

    if (userMessage.isEmergency && onEmergency) {
      try {
        onEmergency(prompt);
      } catch (e) {
        console.warn('onEmergency callback threw:', e);
      }
    }

    if (!aiServiceRef.current) {
      console.warn('AI service not initialized; cannot fetch response.');
      sendSystemErrorMessage('AI service unavailable');
      setIsLoading(false);
      return;
    }

    try {
      const response = await aiServiceRef.current.getChatResponse(messages, prompt);

      if (!response || (typeof response === 'string' && response.trim().length === 0)) {
        console.warn('AI service returned empty response:', response);
        sendSystemErrorMessage('AI returned no response');
        setIsLoading(false);
        return;
      }

      const assistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: typeof response === 'string' ? response : String(response),
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error while getting AI response:', err);

      let shortDetail = 'unexpected_error';
      if (err?.message) shortDetail = err.message;
      if (err?.response?.status) shortDetail = `status_${err.response.status}`;

      sendSystemErrorMessage(shortDetail);
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
        content: `👋 Chat cleared! How can I help you with flood aid? `,
        timestamp: new Date()
      }
    ]);
    try {
      aiServiceRef.current?.resetChat?.();
    } catch (e) {
      console.warn('resetChat failed:', e);
    }
  };

  return (
    <div className={`chatbot-container ${position}`}>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chatbot-toggle-btn" aria-label="Open Flood Aid Chat">
          <MessageCircle size={24} />
          <span className="pulse-ring" />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="Flood Aid Chat Window">
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
              <button onClick={clearChat} className="chatbot-clear-btn" title="Clear chat">🗑️</button>
              <button onClick={() => setIsOpen(false)} className="chatbot-close-btn" title="Close chat">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`message-container ${m.role} ${m.isEmergency ? 'emergency' : ''}`}>
                <div className="message-content">
                  {/* Custom Markdown Renderer */}
                  {String(m.content).split('\n').map((line, i) => {
                    // Check for Headings (###)
                    if (line.startsWith('### ')) {
                      return <h4 key={i} className="msg-heading">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={i} className="msg-heading">{line.replace('## ', '')}</h3>;
                    }

                    // Check for lists
                    let content = line;
                    let isListItem = false;
                    if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
                      isListItem = true;
                      content = line.replace(/^[•-]\s*/, '');
                    }

                    // Bold Parsing (**text**)
                    const parts = content.split(/(\*\*.*?\*\*)/g);

                    return (
                      <div key={i} className={`msg-line ${isListItem ? 'msg-list-item' : ''}`}>
                        {isListItem && <span className="msg-bullet">•</span>}
                        <span>
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="message-time">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isListening && (
              <div className="message-container assistant">
                <div className="voice-listening-indicator">
                  🎤 Listening in {languages[selectedLanguage]}...
                </div>
              </div>
            )}

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

          <div className="chatbot-input-container">
            {/* Language Selector */}
            <div className="language-selector">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-dropdown"
                title="Select voice input language"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>

            {/* Input Area */}
            <div className="chatbot-input">
              <textarea
                className="chatbot-input-field"
                placeholder="Ask about flood aid...  🎤 or click mic to speak"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize textarea based on content
                  e.target.style.height = '44px'; // Reset to single line height
                  if (e.target.scrollHeight > 44) {
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                aria-label="Type your message"
                rows={1}
                style={{
                  resize: 'none',
                  overflow: 'hidden',
                  height: '44px',
                  maxHeight: '120px'
                }}
              />

              {/* Mic Button */}
              <button
                onClick={toggleVoiceInput}
                className={`chatbot-voice-btn ${isListening ? 'listening' : ''}`}
                disabled={isLoading}
                aria-label="Voice input"
                title={isListening ? 'Stop recording' : `Start voice input (${languages[selectedLanguage]})`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                className="chatbot-send-btn"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>

            {/* ✅ MODIFIED: Show current AI provider */}
            <div className="powered-by">
              Powered by {aiProvider === 'mistral' ? 'Mistral AI' : 'Google Gemini'} 🤖 | 🎤 Voice enabled
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloodAidChatbot;