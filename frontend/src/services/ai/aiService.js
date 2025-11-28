import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, getEmergencyPrompt, detectEmergency } from '../prompts/promptService';

export class AIService {
  constructor(apiKey, model = 'gemini-pro') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this. model = this.genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    this.chat = null;
  }

  async initializeChat() {
    this.chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Hello, I need help with flood-related emergencies.' }],
        },
        {
          role: 'model',
          parts: [{ text: '👋 Hello! I\'m your Flood Aid Assistant. I can help you with flood emergency procedures, first aid in flood situations, evacuation guidance, and relief resources. I can communicate in any language you prefer.  How can I assist you today?' }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });
  }

  async getChatResponse(messages, userMessage) {
    const isEmergency = detectEmergency(userMessage);
    
    // Build the prompt with system instructions
    const systemInstructions = isEmergency 
      ? `${SYSTEM_PROMPT}\n\n${getEmergencyPrompt(userMessage)}`
      : SYSTEM_PROMPT;

    // Combine system prompt with user message
    const fullPrompt = `${systemInstructions}\n\nUser message: ${userMessage}\n\nRespond in the SAME language as the user's message. `;

    try {
      // Initialize chat if not already done
      if (!this.chat) {
        await this.initializeChat();
      }

      // Send message and get response
      const result = await this.chat.sendMessage(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return text || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Gemini AI Service Error:', error);
      
      // Handle specific error cases
      if (error. message?. includes('SAFETY')) {
        return '⚠️ I detected potentially sensitive content. For immediate emergency assistance, please call your local emergency services (911 or your local emergency number).';
      }
      
      throw new Error('Failed to get response from AI service');
    }
  }

  // Reset chat history
  resetChat() {
    this.chat = null;
  }
}