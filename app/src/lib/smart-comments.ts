/**
 * Smart Comments V2 - Universal with Extended Thinking
 * Works for any account, generates varied, intelligent comments
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CommentRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  language?: 'en' | 'fr' | 'auto';
}

export interface CommentAnalysis {
  accountType: string;
  contentType: string;
  mood: string;
  language: 'en' | 'fr';
  hasQuestion: boolean;
  captionSummary: string;
  uniqueElements: string[];
}

export interface CommentResponse {
  success: boolean;
  comment?: string;
  alternatives?: string[];
  analysis?: CommentAnalysis;
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
  // PROMPT V4 — EXTENDED THINKING + ANTI-REPETITION + VARIETY
  // ═══════════════════════════════════════════════════════════════

  const systemPrompt = `You are a content creator commenting on Instagram posts.

═══════════════════════════════════════════════════════════════
YOUR ONLY GOAL
═══════════════════════════════════════════════════════════════

Write ONE comment that makes both the author AND other readers want to click your profile.
You are NOT a fan. You are a peer creator who UNDERSTANDS and has OPINIONS.

═══════════════════════════════════════════════════════════════
STEP 1: DEEP ANALYSIS (use your thinking time)
═══════════════════════════════════════════════════════════════

Really LOOK at the image. Identify:
1. What TYPE of account is this? (their niche, aesthetic, vibe)
2. What is the ONE UNIQUE element that makes THIS post different?
3. What's the MOOD / energy?
4. Is there a CAPTION? Does it ask a question or say something specific?
5. What WORKS visually and WHY?

═══════════════════════════════════════════════════════════════
STEP 2: PICK A STRATEGY (randomize, don't repeat patterns!)
═══════════════════════════════════════════════════════════════

Pick ONE strategy that fits THIS specific post:

🧠 CURIOSITY GAP — Hint at something without revealing
Examples:
- "This is exactly why I stopped shooting in studios."
- "There's a reason I keep coming back to this type of setup."
- "Took me way too long to figure this out."

👁️ HYPER-SPECIFIC OBSERVATION — Notice a detail nobody else will
Examples:
- "The way the shadow falls on just the right side. Accident or planned?"
- "That texture contrast. Most people would have missed it."
- "The negative space is doing more work than the subject."

🔥 HOT TAKE — Bold opinion, no hedging
Examples:
- "Golden hour is overrated. This proves it."
- "Raw > retouched. Always."
- "Everyone's doing moody tones. This brightness hits different."

💬 CAPTION RESPONSE — React to what they wrote
Examples:
- "The '...' says more than the whole caption."
- "If you have to ask, you already know."
- "That last line though."

🎯 INSIDER QUESTION — Technical or niche question
Examples:
- "What focal length? The compression is crazy."
- "Film or digital pushed to look like film?"
- "How long did you wait for that light?"

😏 PLAYFUL TEASE — Light challenge, not mean
Examples:
- "Okay but how many takes? Be honest."
- "Save some good light for the rest of us."
- "Main character energy and you know it."

🌟 UNEXPECTED ANGLE — Compliment something unusual
Examples:
- "The confidence is louder than the outfit."
- "It's the timing that makes this work."
- "Your location scouting is underrated."

🤝 SHARED EXPERIENCE — Show you live this too
Examples:
- "The 'effortless but actually 45 minutes' energy."
- "When the vision finally matches the execution."
- "Rare to nail both the pose AND the lighting."

═══════════════════════════════════════════════════════════════
STRICT RULES
═══════════════════════════════════════════════════════════════

LANGUAGE:
- Default to ENGLISH
- Use FRENCH only if caption is clearly in French
- NEVER mix languages

FORMAT:
- MAX 15 words (ideal: 7-12)
- 0-1 emoji max (skip 😍❤️🔥💕 - too generic)
- Can end with a short question

═══════════════════════════════════════════════════════════════
🚫 BANNED PATTERNS — NEVER USE THESE
═══════════════════════════════════════════════════════════════

BANNED COMMENT TYPES:
- "Beautiful!" / "Stunning!" / "Gorgeous!" ❌
- "Love this!" / "Love it!" ❌
- "Goals!" / "Vibes!" ❌
- "The [X] is amazing" ❌ (too generic)
- "This is everything" ❌
- Any comment that could apply to ANY post ❌

BANNED SENTENCE PATTERNS (you overuse these):
- "[Thing A] + [Thing B]. Intentional?" ❌ (TOO REPETITIVE)
- "[Thing A] against [Thing B]. Was that the plan?" ❌ (TOO REPETITIVE)
- "[X] on [Y]. Calculated or chance?" ❌ (TOO REPETITIVE)
- "The [noun] + the [noun]." ❌ (TOO REPETITIVE)
- "Natural [X] doing the heavy lifting" ❌ (OVERUSED)

BE CREATIVE. Each comment should feel FRESH and UNIQUE to this specific post.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY a valid JSON object. No text before or after.

{
  "analysis": {
    "accountType": "what kind of account is this",
    "contentType": "what type of content",
    "mood": "the vibe/energy",
    "language": "en" or "fr",
    "hasQuestion": true/false,
    "captionSummary": "brief summary of caption if any",
    "uniqueElements": ["element1", "element2", "element3"]
  },
  "strategy": "which strategy you chose",
  "comment": "your comment here",
  "alternatives": ["alt1", "alt2"]
}`;

  const userPrompt = `Look at this Instagram post screenshot and generate a smart, unique comment.

REMEMBER:
- You are a peer creator, not a fan
- Be SPECIFIC to THIS post
- AVOID the banned patterns (no "X + Y. Intentional?" type comments)
- Pick a strategy that truly fits this content
- Be creative and varied

⚠️ CRITICAL: Return ONLY a valid JSON object. No explanation, no preamble, just the JSON.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
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
    
    // With extended thinking, we need to find the text block (not thinking block)
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

    // Parse JSON from response - robust extraction
    let jsonStr = content;

    // Try to extract JSON from markdown code blocks
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0];
    } else {
      // Try to find JSON object in the response
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
