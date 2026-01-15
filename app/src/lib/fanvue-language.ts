/**
 * Language Detection for Fanvue DM System
 * Same logic as Instagram DM system (elena-dm.ts)
 * 
 * Detects user language from messages and stores for personalized responses
 */

import { supabase } from './supabase';

// ===========================================
// TYPES
// ===========================================

export type DetectedLanguage = 'en' | 'fr' | 'it' | 'es' | 'pt' | 'de' | null;

export interface LanguageDetectionResult {
  language: DetectedLanguage;
  isExplicit: boolean;  // true = user explicitly stated their language
}

// ===========================================
// LANGUAGE PATTERNS
// ===========================================

// Common words/phrases for each language
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  fr: [
    /\b(bonjour|salut|coucou|bonsoir|merci|beaucoup|comment|pourquoi|qu'est-ce|c'est|je suis|tu es|t'es|trop|vraiment|génial|magnifique|belle|beau|super|oui|non|peut-être|d'accord|ok|quoi|ça va|bisou|bisous|bises|chéri|chérie|mdr|ptdr|jsuis|chui|tkt|stp|svp|pk|pcq|tjrs|tjs|bcp|jsp)\b/i,
    /\b(parle|français|france|parler|dis-moi|montre|veux|voudrais|aime|adore|pense|trouve|sais|connais)\b/i,
  ],
  it: [
    /\b(ciao|buongiorno|buonasera|grazie|prego|come|stai|sono|sei|siamo|bello|bella|bellissimo|bellissima|amore|tesoro|perfetto|fantastico|meraviglioso|molto|tanto|sì|no|forse|perché|quando|dove|cosa|chi)\b/i,
    /\b(parli|italiano|italia|dimmi|mostrami|voglio|vorrei|amo|adoro|penso|trovo|so|conosco)\b/i,
  ],
  es: [
    /\b(hola|buenos días|buenas tardes|buenas noches|gracias|por favor|cómo|estás|soy|eres|somos|hermoso|hermosa|bonito|bonita|guapo|guapa|perfecto|genial|increíble|mucho|muy|sí|no|quizás|por qué|cuándo|dónde|qué|quién)\b/i,
    /\b(hablas|español|españa|dime|muéstrame|quiero|quisiera|amo|adoro|pienso|encuentro|sé|conozco)\b/i,
  ],
  pt: [
    /\b(olá|oi|bom dia|boa tarde|boa noite|obrigado|obrigada|por favor|como|você|eu sou|você é|lindo|linda|bonito|bonita|perfeito|incrível|muito|sim|não|talvez|por que|quando|onde|o que|quem)\b/i,
    /\b(fala|português|brasil|portugal|me diz|me mostra|quero|gostaria|amo|adoro|acho|sei|conheço)\b/i,
  ],
  de: [
    /\b(hallo|guten tag|guten morgen|guten abend|danke|bitte|wie|geht's|bin|bist|sind|schön|wunderschön|perfekt|toll|super|sehr|ja|nein|vielleicht|warum|wann|wo|was|wer)\b/i,
    /\b(sprichst|deutsch|deutschland|sag mir|zeig mir|will|möchte|liebe|denke|finde|weiß|kenne)\b/i,
  ],
  en: [
    /\b(hello|hi|hey|good morning|good evening|thanks|thank you|please|how|are you|i am|you are|beautiful|gorgeous|perfect|amazing|great|awesome|very|much|yes|no|maybe|why|when|where|what|who)\b/i,
    /\b(speak|english|tell me|show me|want|would like|love|think|find|know)\b/i,
  ],
};

// Explicit language statements (100% confidence)
const EXPLICIT_LANGUAGE_STATEMENTS: Record<string, RegExp[]> = {
  fr: [
    /\b(je parle français|parle français|en français|français svp|français stp|speak french)\b/i,
    /\b(je suis français|je suis française|from france|de france)\b/i,
  ],
  it: [
    /\b(parlo italiano|in italiano|italiano per favore|speak italian)\b/i,
    /\b(sono italiano|sono italiana|from italy|dall'italia)\b/i,
  ],
  es: [
    /\b(hablo español|en español|español por favor|speak spanish)\b/i,
    /\b(soy español|soy española|from spain|de españa)\b/i,
  ],
  pt: [
    /\b(falo português|em português|português por favor|speak portuguese)\b/i,
    /\b(sou brasileiro|sou brasileira|sou português|from brazil|from portugal|do brasil|de portugal)\b/i,
  ],
  de: [
    /\b(ich spreche deutsch|auf deutsch|deutsch bitte|speak german)\b/i,
    /\b(ich bin deutsch|from germany|aus deutschland)\b/i,
  ],
  en: [
    /\b(i speak english|in english|english please|speak english)\b/i,
    /\b(i am english|i'm english|from usa|from uk|from america|from england)\b/i,
  ],
};

// ===========================================
// DETECTION FUNCTIONS
// ===========================================

/**
 * Detect language from a message
 * Returns: { language, isExplicit }
 * isExplicit = true means user explicitly stated their language (100% confidence)
 */
export function detectLanguageFromMessage(message: string): LanguageDetectionResult {
  const lowerMessage = message.toLowerCase();
  
  // First check explicit statements (100% confidence)
  for (const [lang, patterns] of Object.entries(EXPLICIT_LANGUAGE_STATEMENTS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return { language: lang as DetectedLanguage, isExplicit: true };
      }
    }
  }
  
  // Then check language patterns
  const scores: Record<string, number> = { en: 0, fr: 0, it: 0, es: 0, pt: 0, de: 0 };
  
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = lowerMessage.match(pattern);
      if (matches) {
        scores[lang] += matches.length;
      }
    }
  }
  
  // Find the language with highest score
  let maxScore = 0;
  let detectedLang: DetectedLanguage = null;
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang as DetectedLanguage;
    }
  }
  
  // Only return if we have at least 1 match
  return { language: maxScore > 0 ? detectedLang : null, isExplicit: false };
}

/**
 * Update contact language based on message analysis
 * - If explicit: set immediately with confidence 10
 * - If detected: increment confidence, set language when >= 3
 */
export async function updateFanvueContactLanguage(
  contactId: string,
  currentLanguage: string | null,
  currentConfidence: number,
  message: string
): Promise<string | null> {
  const { language, isExplicit } = detectLanguageFromMessage(message);
  
  if (!language) {
    return currentLanguage; // No language detected, keep existing
  }
  
  // If explicit statement, set immediately with max confidence
  if (isExplicit) {
    await supabase
      .from('fanvue_dm_contacts')
      .update({
        detected_language: language,
        language_confidence: 10,
        language_detected_at: new Date().toISOString(),
      })
      .eq('id', contactId);
    
    console.log(`🌍 [Fanvue] Language set (EXPLICIT): ${language} for contact ${contactId}`);
    return language;
  }
  
  // If same as already detected, we're good
  if (currentLanguage === language) {
    // Increase confidence if not maxed
    if (currentConfidence < 10) {
      await supabase
        .from('fanvue_dm_contacts')
        .update({
          language_confidence: Math.min(currentConfidence + 1, 10),
        })
        .eq('id', contactId);
    }
    return currentLanguage;
  }
  
  // If no language set yet, track this detection
  if (!currentLanguage) {
    const newConfidence = currentConfidence + 1;
    
    // Set language only when confidence >= 3 (3+ messages in same language)
    if (newConfidence >= 3) {
      await supabase
        .from('fanvue_dm_contacts')
        .update({
          detected_language: language,
          language_confidence: newConfidence,
          language_detected_at: new Date().toISOString(),
        })
        .eq('id', contactId);
      
      console.log(`🌍 [Fanvue] Language confirmed after ${newConfidence} messages: ${language}`);
      return language;
    } else {
      // Not enough confidence yet, but track the count
      await supabase
        .from('fanvue_dm_contacts')
        .update({
          language_confidence: newConfidence,
        })
        .eq('id', contactId);
      
      console.log(`🌍 [Fanvue] Language tracking: ${language} (confidence ${newConfidence}/3)`);
      return null; // Not confirmed yet
    }
  }
  
  // If different language detected but already had one set, might be mixing
  // Keep the original one (don't switch mid-conversation)
  return currentLanguage;
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: DetectedLanguage): string {
  const names: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    es: 'Español',
    pt: 'Português',
    de: 'Deutsch',
  };
  return code ? names[code] || 'Unknown' : 'Not detected';
}
