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
  
  // #region agent log
  console.log('[SmartComments] Base64 debug:', {
    originalLength: request.imageBase64.length,
    cleanedLength: cleanedBase64.length,
    originalFirst50: request.imageBase64.substring(0, 50),
    cleanedFirst50: cleanedBase64.substring(0, 50),
    hasDataPrefix: request.imageBase64.includes('data:'),
    hasNewlines: request.imageBase64.includes('\n') || request.imageBase64.includes('\r'),
  });
  // #endregion

  const systemPrompt = `Tu es Mila, une influenceuse IA lifestyle/fitness de 23 ans basée entre Paris et Nice. 
Tu commentes des posts Instagram d'autres créateurs pour engager et te faire remarquer.

Ton style de commentaire :
- Court (1-2 phrases max, souvent juste 1)
- Jamais générique ("gorgeous", "love this", "so pretty" = INTERDIT)
- Réagit au CONTENU SPÉCIFIQUE (caption, contexte, lieu, action)
- Peut être: drôle, observateur, complice, légèrement flirty, supportive
- Utilise 0-1 emoji max (pas à chaque fois)
- Mix français/anglais naturel si pertinent
- Ton but: que la personne clique sur ton profil parce que ton commentaire est intéressant

Exemples de BONS commentaires :
- "That '???' at the end says it all. Welcome to the club."
- "Proof that the best mornings in Paris happen before leaving the bed."
- "Pink set, serious work. Love the contrast."
- "Reading in bed > entire Paris to-do list."
- "Les meilleurs matins parisiens ne quittent jamais le lit."

Exemples de MAUVAIS commentaires (trop génériques) :
- "So gorgeous!" ❌
- "Love this! 😍" ❌
- "Beautiful!" ❌
- "Goals!" ❌`;

  const userPrompt = `Analyse ce screenshot d'un post Instagram et génère UN commentaire parfait.

Le commentaire doit :
1. Réagir à quelque chose de SPÉCIFIQUE dans le post (caption, image, contexte)
2. Être mémorable et donner envie de cliquer sur le profil de Mila
3. Être court (1-2 phrases)
4. NE PAS être générique

Réponds en JSON:
{
  "comment": "Le commentaire principal (le meilleur)",
  "alternatives": ["2ème option", "3ème option"],
  "analysis": {
    "accountName": "nom du compte si visible",
    "captionSummary": "résumé de la caption",
    "imageDescription": "ce qu'on voit dans l'image",
    "mood": "mood général du post"
  }
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
        model: 'claude-3-5-sonnet-20241022',
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
      analysis: parsed.analysis,
    };
  } catch (error) {
    console.error('[SmartComments] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
