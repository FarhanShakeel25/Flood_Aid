import { Mistral } from '@mistralai/mistralai';  // ✅ FIXED IMPORT
import { SYSTEM_PROMPT, getEmergencyPrompt, detectEmergency } from '../prompts/promptService';

export class MistralService {
  constructor(apiKey, model = 'mistral-large-latest') {
    if (!apiKey) {
      throw new Error('API key is required for MistralService');
    }

    this.client = new Mistral({ apiKey });  // ✅ FIXED: Use Mistral, not MistralClient
    this.model = model;
    this.messageCount = 0;
    this.conversationLanguage = null;
    this.conversationHistory = [];
  }

  detectLanguage(text) {
    const scripts = {
      'Urdu': /[\u0600-\u06FF\u0750-\u077F]/,
      'Hindi': /[\u0900-\u097F]/,
      'Punjabi': /[\u0A00-\u0A7F]/,
      'Chinese': /[\u4e00-\u9fff]/,
      'Russian': /[\u0400-\u04FF]/,
      'Greek': /[\u0370-\u03FF]/,
      'Arabic': /[\u0600-\u06FF]/,
      'Bengali': /[\u0980-\u09FF]/,
      'Thai': /[\u0E00-\u0E7F]/,
      'Korean': /[\uAC00-\uD7AF]/,
      'Japanese': /[\u3040-\u309F\u30A0-\u30FF]/
    };

    if (/[áéíóúñ¿¡]/i.test(text)) return 'Spanish';
    if (/[àâäçèéêëîïôùûü]/i.test(text)) return 'French';
    if (/[äöüß]/i.test(text)) return 'German';
    if (/[ãõâêô]/i.test(text)) return 'Portuguese';
    if (/[ğışçö]/i.test(text)) return 'Turkish';

    for (const [lang, regex] of Object.entries(scripts)) {
      if (regex.test(text)) return lang;
    }

    return 'English';
  }

  async getChatResponse(messages, userMessage) {
    console.log('📥 Received user message:', userMessage);
    console.log('📊 Current message count:', this.messageCount);
    
    const isEmergency = detectEmergency(userMessage);
    
    try {
      const detectedLang = this.detectLanguage(userMessage);
      this.conversationLanguage = detectedLang;
      console.log('🌍 Detected language:', detectedLang);

      let systemInstruction = '';
      if (this.messageCount === 0) {
        systemInstruction = `You are a Flood Aid Assistant. This is your FIRST interaction with this user.  Introduce yourself warmly and explain how you can help.  Respond in ${detectedLang}. `;
      } else if (this.messageCount === 1) {
        systemInstruction = `This is the user's SECOND question. They are engaging with you.  Provide detailed, helpful information.  Respond in ${detectedLang}.`;
      } else {
        systemInstruction = `This is message #${this.messageCount + 1} in an ongoing conversation.  IMPORTANT: 
- Do NOT repeat previous answers
- If the user asks a similar question, provide DIFFERENT details or a different angle
- Reference the conversation context if relevant
- Be conversational and natural
- Respond in ${detectedLang}`;
      }

      let contextPrompt = '';
      const recentHistory = this.conversationHistory.slice(-6);
      if (recentHistory.length > 0) {
        contextPrompt = 'Previous conversation:\n';
        recentHistory.forEach((entry) => {
          contextPrompt += `${entry.role}: ${entry.content}\n`;
        });
        contextPrompt += '\n';
      }

      let fullPrompt = `${SYSTEM_PROMPT}

${systemInstruction}

${contextPrompt}

User's current question in ${detectedLang}: "${userMessage}"

CRITICAL INSTRUCTIONS:
1.  Respond ONLY in ${detectedLang} (not English or any other language)
2. Do NOT repeat information from previous messages
3.  Provide NEW, UNIQUE information each time
4. Be specific and practical
5. If asked the same question, give DIFFERENT examples or perspectives

Your response in ${detectedLang}:`;

      if (isEmergency) {
        console.log('🚨 Emergency detected! ');
        const emergencyContext = getEmergencyPrompt(userMessage);
        fullPrompt = `${emergencyContext}

${SYSTEM_PROMPT}

Respond in ${detectedLang} ONLY! 

User's EMERGENCY message: "${userMessage}"

Provide immediate, actionable help in ${detectedLang}:`;
      }

      console.log('📤 Sending to Mistral...');

      // ✅ FIXED: Correct API call format
      const chatResponse = await this.client.chat.complete({
        model: this.model,
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        maxTokens: 800,
      });

      const text = chatResponse.choices[0]. message.content;

      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: text }
      );

      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      this.messageCount++;
      console. log('✅ Response delivered');
      console.log('📊 Total messages in session:', this.messageCount);

      if (! text || text.trim(). length === 0) {
        console.warn('⚠️ Empty response from Mistral');
        return this.getLocalizedErrorMessage('empty', detectedLang);
      }

      return text;

    } catch (error) {
      console.error('❌ Mistral AI Service Error:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      if (error.message?. includes('quota') || error.message?.includes('429')) {
        return this.getLocalizedErrorMessage('quota', this.conversationLanguage);
      }

      if (error.message?.includes('API key') || error.message?.includes('401')) {
        return this.getLocalizedErrorMessage('api_key', this.conversationLanguage);
      }
      
      throw error;
    }
  }

  getLocalizedErrorMessage(errorType, language) {
    const messages = {
      'empty': {
        'Urdu': 'معذرت، میں جواب نہیں دے سکا۔ براہ کرم دوبارہ کوشش کریں یا سوال مختلف طریقے سے پوچھیں۔',
        'Hindi': 'क्षमा करें, मैं उत्तर नहीं दे सका। कृपया पुनः प्रयास करें या प्रश्न अलग तरीके से पूछें।',
        'Punjabi': 'ਮਾਫ਼ ਕਰਨਾ, ਮੈਂ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਸਵਾਲ ਵੱਖਰੇ ਤਰੀਕੇ ਨਾਲ ਪੁੱਛੋ।',
        'Arabic': 'عذراً، لم أتمكن من الإجابة. يرجى المحاولة مرة أخرى أو طرح السؤال بطريقة مختلفة.',
        'default': 'I apologize, but I could not generate a response. Please try again or rephrase your question.'
      },
      'quota': {
        'Urdu': '⚠️ سروس عارضی طور پر دستیاب نہیں ہے۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔',
        'Hindi': '⚠️ सेवा अस्थायी रूप से अनुपलब्ध है। कृपया कुछ समय बाद पुनः प्रयास करें।',
        'Punjabi': '⚠️ ਸੇਵਾ ਅਸਥਾਈ ਤੌਰ ਤੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
        'Arabic': '⚠️ الخدمة غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى بعد قليل.',
        'default': '⚠️ Service temporarily unavailable. Please try again in a moment.'
      },
      'api_key': {
        'Urdu': '⚠️ تشکیل کا مسئلہ۔ سپورٹ سے رابطہ کریں۔ ہنگامی صورت میں: 1122',
        'Hindi': '⚠️ विन्यास समस्या। सहायता से संपर्क करें। आपातकाल के लिए: 112',
        'Punjabi': '⚠️ ਸੰਰਚਨਾ ਸਮੱਸਿਆ। ਸਹਾਇਤਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਐਮਰਜੈਂਸੀ ਲਈ: 112',
        'Arabic': '⚠️ مشكلة في التكوين. اتصل بالدعم.  للطوارئ: 112',
        'default': '⚠️ Configuration issue. Contact support. For emergencies: 911'
      }
    };

    return messages[errorType]?.[language] || messages[errorType]?.['default'] || 'Error occurred. ';
  }

  resetChat() {
    console.log('🔄 Resetting chat session');
    this.messageCount = 0;
    this.conversationLanguage = null;
    this.conversationHistory = [];
  }

  getChatHistory() {
    return { 
      messageCount: this.messageCount,
      language: this.conversationLanguage,
      historyLength: this.conversationHistory.length
    };
  }
}