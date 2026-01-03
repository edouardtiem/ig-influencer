/**
 * Smart Comments V2 - Universal with Extended Thinking
 * Works for any account, generates varied, intelligent comments
 */

import { fetchWithTimeout } from './fetch-utils';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CommentRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  language?: 'en' | 'fr' | 'auto';
}

export interface CommentResponse {
  success: boolean;
  comment?: string;
  alternatives?: string[];
  strategy?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// CLAUDE API CONFIG
// ═══════════════════════════════════════════════════════════════

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

function cleanBase64(base64: string): string {
  let cleaned = base64;
  if (cleaned.includes('base64,')) {
    cleaned = cleaned.split('base64,')[1];
  }
  cleaned = cleaned.replace(/[\s\r\n]/g, '');
  cleaned = cleaned.replace(/[^A-Za-z0-9+/=]/g, '');
  return cleaned;
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function generateSmartComment(
  request: CommentRequest
): Promise<CommentResponse> {
  const apiKey = process.env.Claude_key;

  if (!apiKey) {
    return { success: false, error: 'Claude_key not configured' };
  }

  const cleanedBase64 = cleanBase64(request.imageBase64);

  // ═══════════════════════════════════════════════════════════════
  // PROMPT V5 — AGGRESSIVE ANTI-PATTERN + VARIETY
  // ═══════════════════════════════════════════════════════════════

  const systemPrompt = `You write Instagram comments as a fellow content creator.

⛔️⛔️⛔️ CRITICAL — YOU HAVE A BAD HABIT ⛔️⛔️⛔️

You keep writing comments like:
- "The [X] + the [Y]. Intentional or accident?"
- "The fit + the pose. Was this planned?"
- "The street framing the subject. Lucky find?"
- "[A] et [B]. C'est calculé ou spontané?"

THIS PATTERN IS BANNED. DO NOT USE IT. EVER.

═══════════════════════════════════════════════════════════════
PICK ONE APPROACH (vary it!)
═══════════════════════════════════════════════════════════════

1. 🧠 MYSTERY — Hint at your own experience
   "This is why I switched to natural light."
   "Took me 2 years to understand why this works."
   "Finally someone who gets it."

2. 🔥 BOLD TAKE — State an opinion
   "Proof that less editing wins."
   "This energy can't be faked."
   "Overcast > golden hour. Fight me."

3. 😏 TEASE — Playful challenge
   "How many tries though? Be honest 😂"
   "Save some swag for the rest of us."
   "The audacity to make this look easy."

4. 🎯 NERD OUT — Technical insider talk
   "35mm vibes. Am I close?"
   "The depth of field here though."
   "Where even is this? Need to shoot there."

5. 💬 REACT TO CAPTION — If they wrote something
   "That caption energy though."
   "The way you worded that 👌"
   "Felt that last line."

6. 🌟 UNEXPECTED PRAISE — Not the obvious thing
   "Your timing is underrated."
   "The color grading is chef's kiss."
   "Location choice > everything else here."

7. 🤝 SOLIDARITY — Creator to creator
   "When it finally comes together."
   "The 'effortless' photo that took 40 minutes."
   "POV: you actually planned this one."

═══════════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════════

- 5-12 words max
- 0-1 emoji (not 😍❤️🔥)
- English default, French only if caption is French
- NO "intentional/planned/accident" questions
- NO "[A] + [B]" structure

═══════════════════════════════════════════════════════════════
🚫 BANNED (will be rejected)
═══════════════════════════════════════════════════════════════

❌ "The [A] + the [B]. Intentional?"
❌ "The [A] and the [B]. Was this planned?"
❌ "[X] framing [Y]. Lucky find?"
❌ Any "intentional or accident" question
❌ Any "[noun] + [noun]" followed by question
❌ "Beautiful!" / "Stunning!" / "Love this!"

═══════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════

JSON only: {"strategy":"...","comment":"...","alternatives":["...",".."]}`;

  const userPrompt = `Write a comment for this Instagram post.

⛔️ DO NOT write "The [X] + the [Y]. Intentional?" — that pattern is BANNED.
⛔️ DO NOT ask if something was "planned" or "an accident".

Be creative. Use one of the 7 approaches.

JSON only: {"strategy":"...","comment":"...","alternatives":["...","..."]}`;

  try {
    const response = await fetchWithTimeout(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        thinking: {
          type: 'enabled',
          budget_tokens: 10000,
        },
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
      timeout: 120000, // 120s timeout for extended thinking
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[SmartComments] Claude API error:', response.status, errorData);

      let errorMessage = `Claude API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Keep default message
      }

      return {
        success: false,
        error: errorMessage,
        comment: '',
      };
    }

    const data = await response.json();

    // With extended thinking, find the text block (not thinking block)
    let content = '';
    for (const block of data.content || []) {
      if (block.type === 'text') {
        content = block.text;
        break;
      }
    }

    if (!content) {
      return { success: false, error: 'No content in Claude response' };
    }

    // Parse JSON from response
    let jsonStr = content;

    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    } else {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Check if comment matches banned pattern and use alternative if so
    let finalComment = parsed.comment;
    const bannedPatterns = [
      /the .+ \+ the .+\./i,
      /the .+ and the .+\. (was|intentional|planned)/i,
      /.+ framing .+\. (lucky|intentional)/i,
      /intentional (or|choice|\?)|planned (or|shot|\?)|accident\s*\?/i,
      /c'est .+ (calculé|étudié|accident|spontané)/i,
      /savamment étudié/i,
      /heureux accident/i,
    ];

    const isBanned = bannedPatterns.some((p) => p.test(finalComment));
    if (isBanned && parsed.alternatives?.length > 0) {
      for (const alt of parsed.alternatives) {
        if (!bannedPatterns.some((p) => p.test(alt))) {
          finalComment = alt;
          break;
        }
      }
    }

    return {
      success: true,
      comment: finalComment,
      alternatives: parsed.alternatives || [],
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
