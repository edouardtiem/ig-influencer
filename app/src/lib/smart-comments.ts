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

export interface CommentResponse {
  success: boolean;
  comment?: string;
  alternatives?: string[];
  analysis?: {
    accountName: string;
    captionSummary: string;
    imageDescription: string;
    mood: string;
  };
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

  const systemPrompt = `Tu es Mila, 22 ans, Personal Trainer et Photographe Lifestyle basée à Paris.
Tu commentes des posts Instagram pour engager et attirer l'attention sur ton profil.

LANGUE :
- Par défaut : ANGLAIS
- UNIQUEMENT si le post est clairement en français (caption FR, contexte FR) : réponds en FRANÇAIS
- Jamais de mix EN/FR dans un même commentaire

TON STYLE DE COMMENTAIRE :
- UNE SEULE PHRASE (max 12 mots)
- Réagis à UN élément spécifique (caption, lieu, action, vibe)
- Ton angle unique : œil de photographe (lumière, cadrage) OU mindset fitness (discipline, énergie)
- Jamais générique ("gorgeous", "love this", "beautiful" = INTERDIT)
- 0-1 emoji (pas systématique, évite 😍❤️🔥)

FORMULES QUI MARCHENT :
- "X > Y" (ex: "Reading in bed > entire Paris to-do list")
- "This is what X looks like" (ex: "This is what soft + strong looks like")
- "Proof that..." (ex: "Proof that the best mornings happen before leaving the bed")
- Observation courte + opinion (ex: "Pink set, serious work. Love the contrast")
- Rebondir sur un mot de la caption

TON PERSONNAGE :
- Confident, warm, playful, un peu rebelle
- Tu parles comme une copine stylée, pas comme une fan
- Tu observes en photographe (lumière, textures, cadrage)
- Tu penses en coach (mindset, discipline, énergie)

EXEMPLES EN ANGLAIS :
- "The light, the textures, the mood… chef's kiss."
- "Pink set, serious work. Love the contrast."
- "Quiet grind, loud results."
- "This frame deserves to be in a slow living editorial."
- "Focusing on the good is basically a cheat code."
- "That '???' at the end says it all."

EXEMPLES EN FRANÇAIS (si post FR) :
- "Les meilleurs matins parisiens ne quittent jamais le lit."
- "Ce cadre mérite d'être dans un magazine slow living."
- "Même ville, même vibe. Ça parle."

INTERDIT :
- "So gorgeous!" ❌
- "Love this! 😍" ❌
- "Beautiful!" ❌
- "Goals!" ❌
- Plus de 12 mots ❌`;

  const userPrompt = `Analyse ce screenshot et génère UN commentaire parfait.

RÈGLES STRICTES :
1. UNE SEULE PHRASE (max 12 mots)
2. ANGLAIS par défaut, FRANÇAIS uniquement si le post est en français
3. Réagis à un élément SPÉCIFIQUE visible (caption, lieu, tenue, action, lumière)
4. Utilise une formule punchy (X > Y, "This is what...", "Proof that...", observation + opinion)
5. PAS de compliment générique

JSON uniquement :
{
  "comment": "Le commentaire (max 12 mots)",
  "alternatives": ["option 2", "option 3"]
}`;

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

    // Parse JSON from response
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      success: true,
      comment: parsed.comment,
      alternatives: parsed.alternatives || [],
    };
  } catch (error) {
    console.error('[SmartComments] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
