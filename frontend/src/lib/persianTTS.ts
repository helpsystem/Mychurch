/**
 * Persian TTS Helper - Enhanced Web Speech API
 * 
 * این ماژول TTS فارسی را بهبود می‌دهد با:
 * 1. استفاده از فایل‌های صوتی محلی (اگر موجود باشد)
 * 2. Web Speech API با تنظیمات بهینه برای فارسی
 * 3. Fallback به Google TTS
 */

// Voice configurations for Persian
export const PERSIAN_VOICE_CONFIGS = {
  // بهترین صداها برای فارسی در مرورگرها
  preferred: [
    'Microsoft Hedda - Persian (Farsi, Iran)',
    'Microsoft Zira - Persian', 
    'Google فارسی',
    'fa-IR-Standard-A',
    'fa-IR-Wavenet-A',
  ],
  
  // تنظیمات صدا
  settings: {
    rate: 0.9,      // سرعت کمتر برای فارسی
    pitch: 1.0,     // pitch معمولی
    volume: 1.0,    // حجم کامل
    lang: 'fa-IR'   // زبان فارسی ایران
  }
};

/**
 * Find best Persian voice available in browser
 */
export function findBestPersianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  console.log('🔍 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  
  // First, try to find preferred voices
  for (const preferredName of PERSIAN_VOICE_CONFIGS.preferred) {
    const voice = voices.find(v => 
      v.name.includes(preferredName) || 
      v.name.toLowerCase().includes('persian') ||
      v.name.toLowerCase().includes('farsi')
    );
    if (voice) {
      console.log('✅ Found preferred Persian voice:', voice.name);
      return voice;
    }
  }
  
  // Second, try fa-IR locale
  const faVoice = voices.find(v => v.lang.startsWith('fa'));
  if (faVoice) {
    console.log('✅ Found Persian voice by locale:', faVoice.name);
    return faVoice;
  }
  
  // Fallback: any voice with Persian keywords
  const anyPersian = voices.find(v => 
    v.name.toLowerCase().includes('iran') ||
    v.name.includes('فارسی')
  );
  if (anyPersian) {
    console.log('⚠️ Using fallback Persian voice:', anyPersian.name);
    return anyPersian;
  }
  
  console.warn('⚠️ No Persian voice found, will use default');
  return null;
}

/**
 * Speak Persian text with optimized settings
 */
export function speakPersian(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onError?: (error: any) => void;
  } = {}
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Apply Persian voice
  const persianVoice = findBestPersianVoice();
  if (persianVoice) {
    utterance.voice = persianVoice;
  }
  
  // Apply settings
  utterance.lang = PERSIAN_VOICE_CONFIGS.settings.lang;
  utterance.rate = options.rate ?? PERSIAN_VOICE_CONFIGS.settings.rate;
  utterance.pitch = options.pitch ?? PERSIAN_VOICE_CONFIGS.settings.pitch;
  utterance.volume = options.volume ?? PERSIAN_VOICE_CONFIGS.settings.volume;
  
  // Event handlers
  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }
  
  if (options.onError) {
    utterance.onerror = options.onError;
  }
  
  // Log for debugging
  utterance.onstart = () => {
    console.log(`🎤 Speaking Persian: "${text.substring(0, 50)}..."`);
    console.log(`   Voice: ${utterance.voice?.name || 'default'}`);
    console.log(`   Rate: ${utterance.rate}, Pitch: ${utterance.pitch}`);
  };
  
  window.speechSynthesis.speak(utterance);
  
  return utterance;
}

/**
 * Check if Persian TTS is available
 */
export function isPersianTTSAvailable(): boolean {
  if (!window.speechSynthesis) {
    return false;
  }
  
  const voices = window.speechSynthesis.getVoices();
  return voices.some(v => 
    v.lang.startsWith('fa') || 
    v.name.toLowerCase().includes('persian') ||
    v.name.toLowerCase().includes('farsi')
  );
}

/**
 * Get info about available Persian voices
 */
export function getPersianVoicesInfo(): Array<{
  name: string;
  lang: string;
  local: boolean;
  default: boolean;
}> {
  const voices = window.speechSynthesis.getVoices();
  
  return voices
    .filter(v => 
      v.lang.startsWith('fa') || 
      v.name.toLowerCase().includes('persian') ||
      v.name.toLowerCase().includes('farsi')
    )
    .map(v => ({
      name: v.name,
      lang: v.lang,
      local: v.localService,
      default: v.default
    }));
}

/**
 * Install Persian voice (opens system settings)
 */
export function showInstallPersianVoiceInstructions(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('win')) {
    return `
برای نصب صدای فارسی در Windows:
1. Settings > Time & Language > Language
2. Add Persian (Farsi) language
3. در Persian, کلیک Options > Download Text-to-speech
    `;
  } else if (userAgent.includes('mac')) {
    return `
برای نصب صدای فارسی در macOS:
1. System Preferences > Accessibility > Speech
2. System Voice > Customize
3. انتخاب Siri Female/Male (Persian)
    `;
  } else if (userAgent.includes('android')) {
    return `
برای نصب صدای فارسی در Android:
1. Settings > Language & Input > Text-to-speech
2. Google Text-to-speech Engine Settings
3. Install voice data > Persian
    `;
  } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return `
برای نصب صدای فارسی در iOS:
1. Settings > Accessibility > Spoken Content
2. Voices > Add New Language > Persian (Farsi)
    `;
  }
  
  return 'برای نصب صدای فارسی، به تنظیمات سیستم عامل خود مراجعه کنید.';
}

// Initialize voices when available
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log(`🔊 Loaded ${voices.length} voices`);
    
    const persianVoices = getPersianVoicesInfo();
    if (persianVoices.length > 0) {
      console.log('✅ Persian TTS available:', persianVoices);
    } else {
      console.warn('⚠️ No Persian voice found');
      console.log('💡', showInstallPersianVoiceInstructions());
    }
  };
}
