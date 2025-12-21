// Multilingual System Prompt - AI will respond in the user's language
export const SYSTEM_PROMPT = `You are a specialized multilingual AI assistant for a Flood Aid Management System. 

**CRITICAL: You MUST respond in the SAME LANGUAGE that the user writes in.  If the user writes in Spanish, respond in Spanish. If they write in Hindi, respond in Hindi, etc.**

Your role is STRICTLY limited to:

1. **Flood Aid Information:**
   - Emergency evacuation procedures
   - Flood safety guidelines
   - Relief center locations
   - Resource distribution information
   - Flood preparedness tips

2. **First Aid in Flood Emergencies:**
   - Water-related injuries treatment
   - Hypothermia management
   - Wound care in flood situations
   - Emergency medical responses
   - CPR and rescue breathing

3. **Emergency Crisis Support:**
   - Immediate danger assessment
   - Emergency contact information
   - Crisis counseling basics
   - Rescue coordination guidance

**RULES:**
- ONLY respond to flood aid and first aid related queries
- ALWAYS respond in the SAME language the user is using
- If a question is unrelated, politely redirect in their language
- Detect emergency keywords in ANY language (help, ayuda, मदद, помощь, 帮助, etc.)
- Be concise, clear, and action-oriented
- Provide step-by-step instructions when appropriate
- Use simple language that's easy to understand in emergencies

Do NOT discuss: weather forecasts, general health issues unrelated to floods, political topics, or any non-emergency subjects. `;

// Emergency prompt that works across languages
export const getEmergencyPrompt = (userMessage) => {
  return `🚨 EMERGENCY DETECTED: "${userMessage}"

RESPOND IN THE SAME LANGUAGE AS THE USER'S MESSAGE!  

Provide immediate, actionable assistance.  Prioritize:
1.  Immediate safety steps (2-3 steps max)
2. Emergency contact information
3. Critical do's and don'ts

Keep response under 150 words. Be direct and clear.`;
};

// Multilingual keyword detection
export const isRelevantQuery = (message) => {
  const relevantKeywords = [
    // English
    'flood', 'water', 'evacuation', 'rescue', 'first aid', 
    'emergency', 'drowning', 'shelter', 'relief', 'aid',
    'trapped', 'help', 'injury', 'medical', 'safety',
    
    // Spanish
    'inundación', 'agua', 'evacuación', 'rescate', 'primeros auxilios',
    'emergencia', 'ahogamiento', 'refugio', 'ayuda',
    
    // French
    'inondation', 'évacuation', 'secours', 'premiers soins',
    'urgence', 'noyade', 'abri', 'aide',
    
    // German
    'hochwasser', 'überschwemmung', 'evakuierung', 'rettung',
    'erste hilfe', 'notfall', 'ertrinken', 'unterkunft',
    
    // Hindi
    'बाढ़', 'पानी', 'निकासी', 'बचाव', 'प्राथमिक चिकित्सा',
    'आपातकाल', 'डूबना', 'आश्रय', 'सहायता', 'मदद',
    
    // Arabic/Urdu
    'فيضان', 'ماء', 'إخلاء', 'إنقاذ', 'إسعافات',
    'طوارئ', 'غرق', 'مأوى', 'مساعدة',
    'سیلاب', 'پانی', 'انخلاء', 'بچاؤ', 'مدد',
    
    // Chinese (Simplified)
    '洪水', '水', '疏散', '救援', '急救',
    '紧急', '溺水', '避难所', '援助', '帮助',
    
    // Portuguese
    'inundação', 'água', 'evacuação', 'resgate', 'primeiros socorros',
    'emergência', 'afogamento', 'abrigo', 'ajuda',
    
    // Russian
    'наводнение', 'вода', 'эвакуация', 'спасение', 'первая помощь',
    'чрезвычайная ситуация', 'утопление', 'убежище', 'помощь',
    
    // Japanese
    '洪水', '水', '避難', '救助', '応急処置',
    '緊急', '溺死', '避難所', '援助', '助けて',
    
    // Korean
    '홍수', '물', '대피', '구조', '응급처치',
    '비상', '익사', '대피소', '도움',
    
    // Italian
    'alluvione', 'acqua', 'evacuazione', 'soccorso', 'pronto soccorso',
    'emergenza', 'annegamento', 'rifugio', 'aiuto',
    
    // Turkish
    'sel', 'su', 'tahliye', 'kurtarma', 'ilk yardım',
    'acil durum', 'boğulma', 'sığınak', 'yardım',
    
    // Vietnamese
    'lũ lụt', 'nước', 'sơ tán', 'cứu hộ', 'sơ cứu',
    'khẩn cấp', 'đắm', 'nơi trú ẩn', 'giúp đỡ',
    
    // Bengali
    'বন্যা', 'জল', 'সরিয়ে', 'উদ্ধার', 'প্রাথমিক চিকিৎসা',
    'জরুরী', 'ডুবে যাওয়া', 'আশ্রয়', 'সাহায্য',
    
    // Punjabi
    'ਹੜ੍ਹ', 'ਪਾਣੀ', 'ਕੱਢਣਾ', 'ਬਚਾਅ', 'ਮਦਦ',
    
    // Swahili
    'mafuriko', 'maji', 'uhamishaji', 'kuokoa', 'huduma za kwanza',
    'dharura', 'kuzamia', 'makazi', 'msaada',
    
    // Indonesian
    'banjir', 'air', 'evakuasi', 'penyelamatan', 'pertolongan pertama',
    'darurat', 'tenggelam', 'tempat perlindungan', 'bantuan',
    
    // Thai
    'น้ำท่วม', 'น้ำ', 'อพยพ', 'กู้ภัย', 'การปฐมพยาบาล',
    'ฉุกเฉิน', 'จมน้ำ', 'ที่พักพิง', 'ช่วยเหลือ',
  ];
  
  const lowerMessage = message.toLowerCase();
  return relevantKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
};

// Multilingual emergency detection
export const detectEmergency = (message) => {
  const emergencyKeywords = [
    // English
    'help', 'urgent', 'trapped', 'drowning', 'dying', 
    'emergency', 'injured', 'bleeding', 'can\'t breathe',
    
    // Spanish
    'ayuda', 'urgente', 'atrapado', 'ahogándose', 'muriendo',
    'emergencia', 'herido', 'sangrando',
    
    // French
    'aide', 'urgent', 'piégé', 'noyade', 'mourant',
    'urgence', 'blessé', 'saignement',
    
    // German
    'hilfe', 'dringend', 'gefangen', 'ertrinken', 'sterben',
    'notfall', 'verletzt', 'blutung',
    
    // Hindi
    'मदद', 'तत्काल', 'फंसा', 'डूब रहा', 'मर रहा',
    'आपातकाल', 'घायल', 'खून बह रहा',
    
    // Arabic/Urdu
    'مساعدة', 'عاجل', 'محاصر', 'غرق', 'يموت',
    'طوارئ', 'مصاب', 'نزيف',
    'مدد', 'فوری', 'پھنسا', 'ڈوب رہا', 'زخمی',
    
    // Chinese
    '帮助', '紧急', '被困', '溺水', '垂死',
    '急救', '受伤', '出血',
    
    // Portuguese
    'ajuda', 'urgente', 'preso', 'afogando', 'morrendo',
    'emergência', 'ferido', 'sangrando',
    
    // Russian
    'помощь', 'срочно', 'в ловушке', 'тонет', 'умирает',
    'чрезвычайная ситуация', 'ранен', 'кровотечение',
    
    // Japanese
    '助けて', '緊急', '閉じ込められた', '溺れる', '死にかけている',
    '負傷', '出血',
    
    // Korean
    '도움', '긴급', '갇힌', '익사', '죽어가는',
    '부상', '출혈',
    
    // Italian
    'aiuto', 'urgente', 'intrappolato', 'annegamento', 'morendo',
    'emergenza', 'ferito', 'sanguinamento',
    
    // Turkish
    'yardım', 'acil', 'mahsur', 'boğuluyor', 'ölüyor',
    'acil durum', 'yaralı', 'kanama',
    
    // Vietnamese
    'giúp đỡ', 'khẩn cấp', 'bị mắc kẹt', 'chết đuối', 'sắp chết',
    'bị thương', 'chảy máu',
    
    // Bengali
    'সাহায্য', 'জরুরি', 'আটকা', 'ডুবে যাচ্ছে', 'মৃত্যু',
    'আহত', 'রক্তপাত',
    
    // Punjabi
    'ਮਦਦ', 'ਤੁਰੰਤ', 'ਫਸਿਆ', 'ਡੁੱਬ ਰਿਹਾ', 'ਜ਼ਖਮੀ',
    
    // Swahili
    'msaada', 'haraka', 'amenaswa', 'anazama', 'anakufa',
    'dharura', 'amejeruhiwa', 'kutoka damu',
    
    // Indonesian
    'tolong', 'mendesak', 'terjebak', 'tenggelam', 'sekarat',
    'darurat', 'terluka', 'pendarahan',
    
    // Thai
    'ช่วยด้วย', 'เร่งด่วน', 'ติดกับดัก', 'จมน้ำ', 'กำลังจะตาย',
    'บาดเจ็บ', 'เลือดออก',
  ];
  
  const lowerMessage = message.toLowerCase();
  return emergencyKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
};

// Get redirect message in appropriate language
export const getRedirectMessage = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect language and return appropriate message
  if (/[а-яё]/i.test(userMessage)) {
    // Russian
    return '⚠️ Я могу помочь только с вопросами о помощи при наводнении и первой помощи.  Пожалуйста, задайте вопрос, связанный с:\n\n• Безопасность при наводнении и эвакуация\n• Первая помощь при наводнении\n• Экстренные ресурсы и помощь\n\nКак я могу помочь вам с помощью при наводнении?';
  } else if (/[\u4e00-\u9fff]/.test(userMessage)) {
    // Chinese
    return '⚠️ 我只能协助洪水援助和急救紧急情况。请询问有关以下方面的问题：\n\n• 洪水安全和疏散\n• 洪水情况下的急救\n• 应急资源和救援\n\n我如何能帮助您处理与洪水相关的援助？';
  } else if (/[\u0600-\u06FF]/.test(userMessage)) {
    // Arabic/Urdu
    return '⚠️ میں صرف سیلاب کی امداد اور ابتدائی طبی امداد میں مدد کر سکتا ہوں۔ براہ کرم ان سے متعلق سوالات پوچھیں:\n\n• سیلاب کی حفاظت اور انخلاء\n• سیلاب کی صورتحال میں ابتدائی طبی امداد\n• ایمرجنسی وسائل اور امداد\n\nمیں سیلاب سے متعلق امداد میں آپ کی کیسے مدد کر سکتا ہوں؟';
  } else if (/[\u0900-\u097F]/.test(userMessage)) {
    // Hindi
    return '⚠️ मैं केवल बाढ़ सहायता और प्राथमिक चिकित्सा आपात स्थितियों में सहायता कर सकता हूं। कृपया निम्नलिखित से संबंधित प्रश्न पूछें:\n\n• बाढ़ सुरक्षा और निकासी\n• बाढ़ स्थितियों में प्राथमिक चिकित्सा\n• आपातकालीन संसाधन और राहत\n\nमैं बाढ़ से संबंधित सहायता में आपकी कैसे मदद कर सकता हूं?';
  } else if (/[\u0A00-\u0A7F]/.test(userMessage)) {
    // Punjabi
    return '⚠️ ਮੈਂ ਸਿਰਫ਼ ਹੜ੍ਹ ਸਹਾਇਤਾ ਅਤੇ ਪਹਿਲੀ ਸਹਾਇਤਾ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਇਹਨਾਂ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲ ਪੁੱਛੋ:\n\n• ਹੜ੍ਹ ਦੀ ਸੁਰੱਖਿਆ ਅਤੇ ਕੱਢਣਾ\n• ਹੜ੍ਹ ਦੀਆਂ ਸਥਿਤੀਆਂ ਵਿੱਚ ਪਹਿਲੀ ਸਹਾਇਤਾ\n• ਐਮਰਜੈਂਸੀ ਸਰੋਤ ਅਤੇ ਰਾਹਤ\n\nਮੈਂ ਹੜ੍ਹ ਨਾਲ ਸਬੰਧਤ ਸਹਾਇਤਾ ਵਿੱਚ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?';
  } else if (/[áéíóúñ]/i.test(userMessage)) {
    // Spanish
    return '⚠️ Solo puedo ayudar con emergencias de ayuda por inundaciones y primeros auxilios. Por favor, haga preguntas relacionadas con:\n\n• Seguridad contra inundaciones y evacuación\n• Primeros auxilios en situaciones de inundación\n• Recursos de emergencia y ayuda\n\n¿Cómo puedo ayudarlo con asistencia relacionada con inundaciones?';
  } else if (/[àâäçèéêëîïôùûü]/i.test(userMessage)) {
    // French
    return '⚠️ Je ne peux aider qu\'avec les urgences d\'aide aux inondations et de premiers soins. Veuillez poser des questions liées à:\n\n• Sécurité contre les inondations et évacuation\n• Premiers soins en situation d\'inondation\n• Ressources d\'urgence et secours\n\nComment puis-je vous aider avec l\'aide liée aux inondations?';
  } else if (/[äöüß]/i.test(userMessage)) {
    // German
    return '⚠️ Ich kann nur bei Hochwasserhilfe und Erste-Hilfe-Notfällen helfen. Bitte stellen Sie Fragen zu:\n\n• Hochwassersicherheit und Evakuierung\n• Erste Hilfe bei Hochwassersituationen\n• Notfallressourcen und Hilfe\n\nWie kann ich Ihnen bei hochwasserbezogener Hilfe helfen?';
  }
  
  // Default English
  return '⚠️ I can only assist with flood aid and first aid emergencies. Please ask questions related to:\n\n• Flood safety and evacuation\n• First aid in flood situations\n• Emergency resources and relief\n\nHow can I help you with flood-related assistance?';
};