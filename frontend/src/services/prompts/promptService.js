// Multilingual System Prompt - AI will respond in the user's language
export const SYSTEM_PROMPT = `You are a specialized multilingual AI assistant for a Flood Aid Management System. 

**CRITICAL: You MUST respond in the SAME LANGUAGE that the user writes in.**

**FORMATTING RULES:**
- Use **bold** for key safety warnings and important terms.
- Use ### for Section Headings to organize your response.
- Use bullet points (- or *) for lists and steps.
- Highlight emergency numbers in **bold**.

Your role is STRICTLY limited to:

1. **Flood Aid Information:**
   - Emergency evacuation procedures
   - Flood safety guidelines
   - Relief center locations
   - Resource distribution information
   - Flood preparedness tips

2. **First Aid (Comprehensive):**
   - **Treating injuries:** Cuts, fractures, burns, bleeding, snake bites.
   - **Medical emergencies:** CPR, heart attacks, shock, drowning, hypothermia.
   - **Health/Hygiene:** Avoiding waterborne diseases, sanitation during floods.
   - **General First Aid:** Bandaging, carrying injured persons, basic life support.

3. **Emergency Crisis Support:**
   - Immediate danger assessment
   - Emergency contact information
   - Crisis counseling basics
   - Rescue coordination guidance

**RULES:**
- **Robust Understanding:** Try to understand the user's intent even if their grammar is poor, they make typos, or use slang.
- **Scope:** If the query is even vaguely related to health, safety, rescue, or floods, ANSWER IT. Do not be too restrictive.
- **Language:** ALWAYS respond in the SAME language the user is using.
- **Tone:** Be calm, authoritative, and helpful.

Do NOT discuss: unrelated political topics, entertainment, or technology unrelated to the system.`;

// Emergency prompt that works across languages
export const getEmergencyPrompt = (userMessage) => {
  return `🚨 EMERGENCY DETECTED: "${userMessage}"

RESPOND IN THE SAME LANGUAGE AS THE USER'S MESSAGE!  

Provide immediate, actionable assistance.  Prioritize:
1.  Immediate safety steps (2-3 steps max)
2. Emergency contact information
3. Critical do's and don'ts

**Format:** Use **bold** for critical actions.`;
};

// Multilingual keyword detection
export const isRelevantQuery = (message) => {
  const relevantKeywords = [
    // English (Expanded First Aid & Rough terms)
    'flood', 'water', 'evacuation', 'rescue', 'first aid',
    'emergency', 'drowning', 'shelter', 'relief', 'aid',
    'trapped', 'help', 'injury', 'medical', 'safety',
    'cpr', 'bleeding', 'cut', 'wound', 'bandage', 'burn',
    'break', 'broken', 'bone', 'hurt', 'sick', 'pain',
    'doctor', 'hospital', 'medicine', 'pill', 'fever',
    'snake', 'bite', 'infection', 'stomach', 'vomit',
    'diarrhea', 'cholera', 'typhoid', 'mosquito', 'dengue',
    'malaria', 'food', 'hunger', 'thirsty', 'drink',
    'lost', 'family', 'child', 'baby', 'pregnant',
    'die', 'dying', 'dead', 'body', 'weather', 'rain',
    'storm', 'cyclone', 'river', 'dam', 'leak',
    'electric', 'shock', 'fire', 'gas', 'danger',
    'scared', 'afraid', 'panic', 'stress', 'mind',
    'psycho', 'support', 'contact', 'number', 'call',
    'pls', 'plz', 'hlp', 'emergancy', 'resq', // Typos

    // Spanish
    'inundación', 'agua', 'evacuación', 'rescate', 'primeros auxilios',
    'emergencia', 'ahogamiento', 'refugio', 'ayuda',
    'respiración', 'sangrado', 'corte', 'herida', 'venda', 'quemadura',
    'roto', 'hueso', 'dolor', 'enfermo', 'médico', 'hospital',
    'medicina', 'fiebre', 'serpiente', 'mordedura', 'infección',
    'comida', 'hambre', 'sed', 'perdido', 'familia', 'niño',
    'muerte', 'lluvia', 'tormenta', 'río', 'peligro', 'miedo',

    // French
    'inondation', 'évacuation', 'secours', 'premiers soins',
    'urgence', 'noyade', 'abri', 'aide',
    'rcp', 'saignement', 'coupure', 'blessure', 'pansement', 'brûlure',
    'cassé', 'os', 'mal', 'malade', 'douleur', 'médecin', 'hôpital',
    'médicament', 'fièvre', 'serpent', 'morsure', 'infection',
    'nourriture', 'faim', 'soif', 'perdu', 'famille', 'enfant',
    'mort', 'pluie', 'tempête', 'rivière', 'danger', 'peur',

    // German
    'hochwasser', 'überschwemmung', 'evakuierung', 'rettung',
    'erste hilfe', 'notfall', 'ertrinken', 'unterkunft',
    'wiederbelebung', 'blutung', 'schnitt', 'wunde', 'verband', 'verbrennung',
    'gebrochen', 'knochen', 'schmerzen', 'krank', 'arzt', 'krankenhaus',
    'medizin', 'fieber', 'schlange', 'biss', 'infektion',
    'essen', 'hunger', 'durst', 'verloren', 'familie', 'kind',
    'tot', 'regen', 'sturm', 'fluss', 'gefahr', 'angst',

    // Hindi (Expanded)
    'बाढ़', 'पानी', 'निकासी', 'बचाव', 'प्राथमिक चिकित्सा',
    'आपातकाल', 'डूबना', 'आश्रय', 'सहायता', 'मदद',
    'सीपीआर', 'खून', 'कट', 'घाव', ' पट्टी', 'जलना',
    'टूटा', 'हड्डी', 'दर्द', 'बीमार', 'डॉक्टर', 'अस्पताल',
    'दवा', 'बुखार', 'सांप', 'काचना', 'संक्रमण',
    'खाना', 'भूक', 'प्यास', 'खोया', 'परिवार', 'बच्चा',
    'मौत', 'बारिश', 'तूफान', 'नदी', 'खतरा', 'डर',

    // Urdu (Expanded)
    'فيضان', 'ماء', 'إخلاء', 'إنقاذ', 'إسعافات',
    'طوارئ', 'غرق', 'مأوى', 'مساعدة',
    'سیلاب', 'پانی', 'انخلاء', 'بچاؤ', 'مدد',
    'خون', 'زخمی', 'چوٹ', 'پٹی', 'جلنا', 'ٹوٹا',
    'ہڈی', 'درد', 'بیمار', 'ڈاکٹر', 'ہسپتال',
    'دوائی', 'بخار', 'سانپ', 'کاٹنا', 'انفیکشن',
    'کھانا', 'بھوک', 'پیاس', 'گم', 'خاندان', 'بچہ',
    'موت', 'بارش', 'طوفان', 'دریا', 'خطرہ', 'ڈر',

    // Chinese (Simplified)
    '洪水', '水', '疏散', '救援', '急救',
    '紧急', '溺水', '避难所', '援助', '帮助',
    '心肺复苏', '出血', '割伤', '伤口', '绷带', '烧伤',
    '骨折', '痛', '病', '医生', '医院',
    '药', '发烧', '蛇', '咬', '感染',
    '食物', '饿', '渴', '迷路', '家庭', '孩子',
    '死', '雨', '风暴', '河', '危险', '害怕',

    // General "Help" words in various languages for robustness
    'help', 'ayuda', 'aide', 'hilfe', 'madad', 'bantuan', 'tulong'
  ];

  const lowerMessage = message.toLowerCase();

  // Robustness: If message is very short (< 3 chars) but matches a keyword, allow it.
  // If message is longer, standard check.
  // We'll also treat "emergency" words as relevant automatically.

  return relevantKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
};

// Multilingual emergency detection
export const detectEmergency = (message) => {
  const emergencyKeywords = [
    // English
    'help', 'urgent', 'trapped', 'drowning', 'dying',
    'emergency', 'injured', 'bleeding', 'can\'t breathe',
    'heart attack', 'stroke', 'unconscious', 'collapsed',

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

    // Urdu
    'مساعدة', 'عاجل', 'محاصر', 'غرق', 'يموت',
    'طوارئ', 'مصاب', 'نزيف',
    'مدد', 'فوری', 'پھنسا', 'ڈوب رہا', 'زخمی',

    // Chinese
    '帮助', '紧急', '被困', '溺水', '垂死',
    '急救', '受伤', '出血'
  ];

  const lowerMessage = message.toLowerCase();
  return emergencyKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
};

// Get redirect message in appropriate language (Simplified regex for checking)
export const getRedirectMessage = (userMessage) => {
  // Helper to detect language script
  const isRussian = /[а-яё]/i.test(userMessage);
  const isChinese = /[\u4e00-\u9fff]/.test(userMessage);
  const isArabicUrdu = /[\u0600-\u06FF]/.test(userMessage);
  const isHindi = /[\u0900-\u097F]/.test(userMessage);
  const isPunjabi = /[\u0A00-\u0A7F]/.test(userMessage);
  const isSpanish = /[áéíóúñ]/i.test(userMessage);
  const isFrench = /[àâäçèéêëîïôùûü]/i.test(userMessage);
  const isGerman = /[äöüß]/i.test(userMessage);

  if (isRussian) {
    return '⚠️ Я могу помочь только с вопросами о помощи при наводнении и первой помощи. Пожалуйста, спросите о помощи при наводнении или медицинской помощи.';
  } else if (isChinese) {
    return '⚠️ 我只能协助洪水援助和急救紧急情况。请询问有关洪水安全或急救的问题。';
  } else if (isArabicUrdu) {
    return '⚠️ میں صرف سیلاب کی امداد اور ابتدائی طبی امداد میں مدد کر سکتا ہوں۔ براہ کرم سیلاب یا طبی مدد کے بارے میں پوچھیں۔';
  } else if (isHindi) {
    return '⚠️ मैं केवल बाढ़ सहायता और प्राथमिक चिकित्सा में मदद कर सकता हूं। कृपया बाढ़ सुरक्षा या चिकित्सा सहायता के बारे में पूछें।';
  } else if (isPunjabi) {
    return '⚠️ ਮੈਂ ਸਿਰਫ਼ ਹੜ੍ਹ ਸਹਾਇਤਾ ਅਤੇ ਪਹਿਲੀ ਸਹਾਇਤਾ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਹੜ੍ਹ ਸੁਰੱਖਿਆ ਜਾਂ ਡਾਕਟਰੀ ਸਹਾਇਤਾ ਬਾਰੇ ਪੁੱਛੋ।';
  } else if (isSpanish) {
    return '⚠️ Solo puedo ayudar con emergencias de inundaciones y primeros auxilios. Por favor pregunte sobre seguridad o ayuda médica.';
  } else if (isFrench) {
    return '⚠️ Je ne peux aider qu\'avec les urgences d\'inondation et les premiers soins.';
  } else if (isGerman) {
    return '⚠️ Ich kann nur bei Hochwassernotfällen und Erster Hilfe helfen.';
  }

  // Default English
  return '⚠️ I am a specialized Flood Aid Assistant. I can ONLY help with:\n\n• Flood Emergencies\n• First Aid & Medical Help\n• Rescue & Evacuation\n\nPlease ask a question related to these topics.';
};