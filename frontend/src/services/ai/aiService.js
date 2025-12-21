import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, getEmergencyPrompt, detectEmergency } from '../prompts/promptService';

export class AIService {
  constructor(apiKey, model = 'models/gemini-1.5-flash') {
    if (!apiKey) {
      throw new Error('API key is required for AIService');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature: 1.0,         // ✅ Maximum creativity
        topK: 64,                  // ✅ More token variety
        topP: 0.99,                // ✅ Maximum diversity
        maxOutputTokens: 1024,
      },
    });
    this.chat = null;
    this.messageCount = 0;
    this. conversationLanguage = null;
    this.conversationHistory = []; // ✅ Track full conversation
  }

  async initializeChat() {
    console.log('🔄 Initializing new chat session...');
    
    // ✅ Start completely fresh - no pre-loaded history
    this.chat = this.model.startChat({
      history: [],
      generationConfig: {
        temperature: 1.0,
        topK: 64,
        topP: 0.99,
        maxOutputTokens: 1024,
      },
    });
    
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
      'Japanese': /[\u3040-\u309F\u30A0-\u30FF]/,
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
      if (! this.chat) {
        await this.initializeChat();
      }

      // Detect language
      const detectedLang = this.detectLanguage(userMessage);
      this.conversationLanguage = detectedLang;
      console.log('🌍 Detected language:', detectedLang);

      // ✅ Build context-aware prompt with conversation history
      let contextPrompt = '';
      
      // Only include last 3 exchanges to prevent repetition
      const recentHistory = this.conversationHistory.slice(-6); // Last 3 Q&A pairs
      if (recentHistory.length > 0) {
        contextPrompt = 'Previous conversation:\n';
        recentHistory.forEach((entry, index) => {
          contextPrompt += `${entry.role}: ${entry.content}\n`;
        });
        contextPrompt += '\n';
      }

      // ✅ Create dynamic system instruction based on message count
      let systemInstruction = '';
      if (this.messageCount === 0) {
        // First message - introduce yourself
        systemInstruction = `You are a Flood Aid Assistant. This is your FIRST interaction with this user.  Introduce yourself warmly and explain how you can help.  Respond in ${detectedLang}. `;
      } else if (this.messageCount === 1) {
        // Second message - be helpful and detailed
        systemInstruction = `This is the user's SECOND question. They are engaging with you.  Provide detailed, helpful information.  Respond in ${detectedLang}.`;
      } else {
        // Ongoing conversation - vary your responses
        systemInstruction = `This is message #${this.messageCount + 1} in an ongoing conversation.  IMPORTANT: 
- Do NOT repeat previous answers
- If the user asks a similar question, provide DIFFERENT details or a different angle
- Reference the conversation context if relevant
- Be conversational and natural
- Respond in ${detectedLang}`;
      }

      // ✅ Build the complete prompt
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

      // ✅ Add emergency context if needed
      if (isEmergency) {
        console.log('🚨 Emergency detected! ');
        const emergencyContext = getEmergencyPrompt(userMessage);
        fullPrompt = `${emergencyContext}

${SYSTEM_PROMPT}

Respond in ${detectedLang} ONLY! 

User's EMERGENCY message: "${userMessage}"

Provide immediate, actionable help in ${detectedLang}:`;
      }

      console.log('📤 Sending to Gemini (length:', fullPrompt.length, 'chars)');

      // ✅ Send message
      const result = await this.chat.sendMessage(fullPrompt);
      const response = await result.response;
      let text = response.text();

      // ✅ Store in conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: text }
      );

      // ✅ Keep only last 10 exchanges (20 messages)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      // Verify response language
      const responseLang = this.detectLanguage(text);
      console.log('📥 Response language detected:', responseLang);

      // If wrong language and not English, try to fix
      if (responseLang !== detectedLang && detectedLang !== 'English' && !text.match(/[\u0600-\u06FF\u0900-\u097F\u0A00-\u0A7F]/)) {
        console. warn(`⚠️ Response in ${responseLang}, expected ${detectedLang}. Requesting translation...`);
        
        const translationPrompt = `Translate this EXACT message to ${detectedLang}.  Keep the same meaning and structure.  Use ${detectedLang} script only:

"${text}"

Translation in ${detectedLang}:`;
        
        const retryResult = await this.chat. sendMessage(translationPrompt);
        const retryResponse = await retryResult.response;
        text = retryResponse.text();
        
        console.log('🔄 Translation attempt completed');
      }

      this.messageCount++;
      console. log('✅ Response delivered');
      console.log('📊 Total messages in session:', this.messageCount);
      console.log('📚 Conversation history length:', this.conversationHistory.length);

      if (! text || text.trim(). length === 0) {
        console.warn('⚠️ Empty response from Gemini');
        return this.getLocalizedErrorMessage('empty', detectedLang);
      }

      return text;

    } catch (error) {
      console.error('❌ Gemini AI Service Error:', {
        message: error.message,
        code: error.code,
        status: error.status,
      });
      
      if (error.message?. includes('SAFETY')) {
        return this.getLocalizedErrorMessage('safety', this.conversationLanguage);
      }
      
      if (error.message?.includes('quota') || error.message?.includes('429')) {
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
        'Spanish': 'Lo siento, no pude generar una respuesta.  Intenta de nuevo o reformula tu pregunta.',
        'default': 'I apologize, but I could not generate a response. Please try again or rephrase your question.'
      },
      'safety': {
        'Urdu': '⚠️ حساس مواد کا پتہ چلا۔ فوری مدد کے لیے اپنی مقامی ایمرجنسی سروس کو کال کریں: 1122',
        'Hindi': '⚠️ संवेदनशील सामग्री का पता चला। तत्काल सहायता के लिए अपनी स्थानीय आपातकालीन सेवा पर कॉल करें: 112',
        'Punjabi': '⚠️ ਸੰਵੇਦਨਸ਼ੀਲ ਸਮੱਗਰੀ ਦਾ ਪਤਾ ਲੱਗਾ। ਤੁਰੰਤ ਸਹਾਇਤਾ ਲਈ ਆਪਣੀ ਸਥਾਨਕ ਐਮਰਜੈਂਸੀ ਸੇਵਾ ਨੂੰ ਕਾਲ ਕਰੋ।',
        'Arabic': '⚠️ تم اكتشاف محتوى حساس. اتصل بخدمة الطوارئ المحلية للحصول على مساعدة فورية: 112',
        'default': '⚠️ Sensitive content detected. Call your local emergency service for immediate help.'
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
    this.chat = null;
    this.messageCount = 0;
    this.conversationLanguage = null;
    this. conversationHistory = [];
  }

  getChatHistory() {
    return { 
      messageCount: this.messageCount,
      language: this.conversationLanguage,
      historyLength: this.conversationHistory.length
    };
  }
}