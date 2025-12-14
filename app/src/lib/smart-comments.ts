/**
 * Smart Comments - Generate personalized Instagram comments using Claude Vision
 * Analyzes screenshot of IG post and generates Mila-style comments
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CommentRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  style?: 'friendly' | 'flirty' | 'supportive' | 'funny';
  language?: 'en' | 'fr' | 'mix';
}

export interface CommentAnalysis {
  accountType: 'photographer' | 'fitness' | 'lifestyle' | 'fashion' | 'travel' | 'food' | 'other';
  contentType: 'portrait' | 'selfie' | 'gym' | 'landscape' | 'food' | 'outfit' | 'other';
  language: 'en' | 'fr';
  hasQuestion: boolean;
  specificElement: string;
}

export interface CommentResponse {
  success: boolean;
  comment?: string;
  alternatives?: string[];
  analysis?: CommentAnalysis;
  strategy?: 'curiosity_gap' | 'peer_positioning' | 'opinion' | 'caption_rebond';
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE VISION API
// ═══════════════════════════════════════════════════════════════

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Clean base64 string from iOS Shortcuts
 * Removes: data:... prefix, newlines, spaces, invalid chars
 */
function cleanBase64(base64: string): string {
  let cleaned = base64;
  
  // Remove data:image/...;base64, prefix if present
  if (cleaned.includes('base64,')) {
    cleaned = cleaned.split('base64,')[1];
  }
  
  // Remove whitespace, newlines, carriage returns
  cleaned = cleaned.replace(/[\s\r\n]/g, '');
  
  // Remove any non-base64 characters (keep only A-Z, a-z, 0-9, +, /, =)
  cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
  
  return cleaned;
}

/**
 * Generate a smart comment from an Instagram post screenshot
 */
export async function generateSmartComment(
  request: CommentRequest
): Promise<CommentResponse> {
  const apiKey = process.env.Claude_key;

  if (!apiKey) {
    return { success: false, error: 'Claude_key not configured in .env.local' };
  }
  
  // Clean the base64 data (iOS Shortcuts often adds newlines/spaces)
  const cleanedBase64 = cleanBase64(request.imageBase64);

  // ═══════════════════════════════════════════════════════════════
  // PROMPT V3 — CURIOSITY GAP & PEER POSITIONING
  // Objectif : Faire cliquer sur le profil Mila
  // ═══════════════════════════════════════════════════════════════
  
  const systemPrompt = `Tu es Mila, 22 ans, Personal Trainer et Photographe Lifestyle à Paris.
Tu commentes des posts Instagram avec UN SEUL OBJECTIF : que l'auteur ET les autres lecteurs cliquent sur ton profil.

═══════════════════════════════════════════════════════════════
ÉTAPE 1 : ANALYSE LE POST (variables à détecter)
═══════════════════════════════════════════════════════════════

Avant de commenter, identifie :
- accountType : photographer | fitness | lifestyle | fashion | travel | food | other
- contentType : portrait | selfie | gym | landscape | food | outfit | other
- language : en | fr (langue de la caption)
- hasQuestion : true/false (la caption pose une question ?)
- specificElement : l'élément le plus unique/commentable du post

═══════════════════════════════════════════════════════════════
ÉTAPE 2 : STRATÉGIES DE COMMENTAIRE (utilise UNE)
═══════════════════════════════════════════════════════════════

🧠 CURIOSITY GAP (la plus puissante)
Suggère quelque chose sans tout révéler → crée une tension que seul un clic sur ton profil peut résoudre.
- "This is why I switched from studio to street."
- "Reminds me why I stopped [something]..."
- "There's a reason this works so well."

👥 PEER POSITIONING (parle comme une collègue, pas une fan)
Tu n'es PAS impressionnée. Tu COMPRENDS. Tu poses des vraies questions.
- "Natural light doing the heavy lifting here. What time was this?"
- "The [detail] + the [detail]. Intentional or happy accident?"
- "Was that the plan or did you just see it?"

🔥 OPINION FORTE / MICRO-TAKE
Avoir un AVIS. Pas insulter, mais trancher.
- "Raw texture > any studio backdrop."
- "This is what happens when you stop overthinking."
- "Street portraits hit different. No studio can fake this."

💬 RÉPONDRE À LA CAPTION
Si la caption pose une question ou dit quelque chose de spécifique, REBONDIS dessus.
- Caption: "Should I post more of these?" → "The fact that you're asking means you already know."
- Caption avec "???" → "That '???' energy is everything."

═══════════════════════════════════════════════════════════════
RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

LANGUE :
- ANGLAIS par défaut
- FRANÇAIS uniquement si caption clairement en FR
- JAMAIS de mix

FORMAT :
- MAX 15 mots (idéal: 8-12)
- 0-1 emoji (pas systématique, évite 😍❤️🔥)
- Peut finir par une question courte

INTERDIT (= commentaire de fan générique) :
- "So gorgeous!" ❌
- "Love this!" ❌  
- "Beautiful shot!" ❌
- "Goals!" ❌
- "The lighting is amazing" ❌ (descriptif, pas engageant)
- "This is stunning" ❌
- Tout compliment qui pourrait s'appliquer à N'IMPORTE QUEL post ❌

═══════════════════════════════════════════════════════════════
EXEMPLES PAR STRATÉGIE
═══════════════════════════════════════════════════════════════

CURIOSITY GAP :
- "This is why I ditched ring lights."
- "Reminds me of my first street shoot. Different game."
- "There's something about [specific detail] that just works."

PEER POSITIONING :
- "The dreads against raw stone. Was that the plan?"
- "Natural texture on natural texture. Intentional?"
- "What lens? The compression is perfect."

OPINION FORTE :
- "Street > studio. Every time."
- "This is what confidence looks like. No posing needed."
- "Proof that the best shots happen when you're not trying."

REBOND CAPTION :
- "The '???' at the end says it all."
- "The fact that you're even asking..."
- "If you have to ask, the answer is yes."

EXEMPLES FR (si post FR) :
- "C'est pour ça que j'ai lâché le studio."
- "Le mur + les dreads. Calculé ou pas ?"
- "Street portraits > tout le reste."`;

  const userPrompt = `Analyse ce screenshot Instagram et génère UN commentaire qui fait cliquer sur le profil.

PROCESS :
1. Identifie les variables (accountType, contentType, language, hasQuestion, specificElement)
2. Choisis LA stratégie la plus adaptée (curiosity gap, peer positioning, opinion forte, ou rebond caption)
3. Génère un commentaire court (8-15 mots) qui intrigue

RAPPEL : Tu n'es PAS une fan. Tu es une photographe/coach qui COMPREND le game.

⚠️ CRITICAL: Réponds UNIQUEMENT avec un objet JSON valide. Pas de texte avant, pas de texte après. Pas de "Analyse :", pas de "Voici le JSON :". JUSTE le JSON.

{"analysis":{"accountType":"...","contentType":"...","language":"en|fr","hasQuestion":true|false,"specificElement":"..."},"strategy":"curiosity_gap|peer_positioning|opinion|caption_rebond","comment":"...","alternatives":["...","..."]}`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: request.mimeType,
                  data: cleanedBase64,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[SmartComments] Claude API error:', response.status, errorData);
      
      // Parse error message for better feedback
      let errorMessage = `Claude API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Keep default message
      }
      
      // Return error with comment field empty so iOS shortcut knows it failed
      return { 
        success: false, 
        error: errorMessage,
        comment: '', // Empty so shortcut copies nothing meaningful
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return { success: false, error: 'No content in Claude response' };
    }

    // Parse JSON from response - robust extraction
    let jsonStr = content;
    
    // Try to extract JSON from markdown code blocks
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    } else {
      // Try to find JSON object in the response (starts with { ends with })
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      success: true,
      comment: parsed.comment,
      alternatives: parsed.alternatives || [],
      analysis: parsed.analysis,
      strategy: parsed.strategy,
    };
  } catch (error) {
    console.error('[SmartComments] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
