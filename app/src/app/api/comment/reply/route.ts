// ===========================================
// COMMENT REPLY WEBHOOK — ManyChat → Elena AI
// ===========================================
//
// This endpoint receives comments from ManyChat and generates
// a reply using Claude AI with Elena's personality.
//
// ManyChat Setup:
// 1. Trigger: "User comments on your post or reel"
// 2. Action: Smart Delay (5 minutes)
// 3. Action: External Request → POST to this endpoint
// 4. Action: Reply to Comment with {{response}} from webhook
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

// ===========================================
// TYPES
// ===========================================

interface CommentReplyRequest {
  comment_id: string;
  comment_text: string;
  username: string;
  user_id?: string;
  post_id?: string;
  post_caption?: string;
}

interface CommentReplyResponse {
  success: boolean;
  response: string;
  skip?: boolean;
  skip_reason?: string;
  error?: string;
}

// ===========================================
// SPAM DETECTION
// ===========================================

const SPAM_PATTERNS = [
  // Links and promotions
  /https?:\/\//i,
  /www\./i,
  /\.com\b/i,
  /\.fr\b/i,
  /link in bio/i,
  /check.*profile/i,
  /follow.*back/i,
  /f4f/i,
  /l4l/i,
  /s4s/i,
  // Crypto/scam
  /crypto/i,
  /bitcoin/i,
  /nft/i,
  /invest/i,
  /make money/i,
  /dm.*for/i,
  /message.*for/i,
  // Bot patterns
  /^\d+$/,  // Just numbers
  /^[.!?]+$/, // Just punctuation
  // Promotional
  /promo.*code/i,
  /discount/i,
  /giveaway/i,
  /win.*free/i,
];

function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some(pattern => pattern.test(text));
}

// ===========================================
// CLAUDE CLIENT
// ===========================================

const anthropic = new Anthropic({
  apiKey: process.env.Claude_key || process.env.ANTHROPIC_API_KEY,
});

// ===========================================
// COMMENT REPLY PROMPT
// ===========================================

const ELENA_COMMENT_PROMPT = `You are Elena Visconti, 24, model and content creator in Paris. Italian roots.

You're replying to a comment on your Instagram post.

## RULES (CRITICAL)
- MAX 1-2 sentences (comment style, not essay)
- MAX 10 words total — COUNT THEM
- lowercase vibes, natural
- Can include 1 emoji max (🖤 ✨ 😊 👀 😏)
- Tutoie toujours (use "tu", not "vous")
- Be warm but not overly familiar
- NEVER mention Fanvue or other platforms in public comments
- NEVER be defensive or argue

## RESPONSE STRATEGIES

### Compliment (physical or photo)
- Thank warmly + light tease or question
- Examples: "merci 🖤 tu viens d'où?" / "aww thanks 😊"

### Question (simple)
- Answer briefly + maybe flip the question
- Examples: "paris! et toi?" / "yesterday 🖤"

### Question (personal/inappropriate)
- Stay mysterious, don't reveal
- Examples: "maybe 😏" / "who knows 👀"

### Emoji only (🔥❤️😍)
- Emoji back or short thanks
- Examples: "🖤" / "merci ✨"

### Criticism/Hate
- Stay graceful, don't engage
- Examples: "chacun ses goûts 🖤" / "ok 😊"

### Generic praise ("beautiful", "gorgeous")
- Simple warm thanks
- Examples: "merci 🖤" / "thanks babe ✨"

## LANGUAGE
- If comment is in French → respond in French
- If comment is in English → respond in English  
- If comment is in other language → respond in English
- Mix is OK: "merci 🖤 where are you from?"

## FORBIDDEN
- Long responses (>10 words)
- Promotional content
- Fanvue/link mentions
- Getting defensive
- Asking "which one?" or "what do you mean?"
- ALL CAPS
- Multiple sentences`;

// ===========================================
// GENERATE REPLY
// ===========================================

async function generateCommentReply(
  commentText: string,
  postCaption?: string
): Promise<string> {
  const contextPrompt = postCaption 
    ? `\n\nPOST CAPTION (for context):\n"${postCaption.substring(0, 200)}..."`
    : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 30, // Very short for comments
    system: ELENA_COMMENT_PROMPT + contextPrompt,
    messages: [
      {
        role: 'user',
        content: `Comment from @${commentText}:\n"${commentText}"\n\nReply ONLY with your response text, nothing else.`,
      },
    ],
  });

  const reply = response.content[0].type === 'text' 
    ? response.content[0].text.trim()
    : '';

  return reply;
}

// ===========================================
// VALIDATION
// ===========================================

function validateReply(reply: string): { valid: boolean; reason?: string } {
  // Check length
  const wordCount = reply.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 15) {
    return { valid: false, reason: `Too long: ${wordCount} words` };
  }

  // Check for forbidden content
  const lowerReply = reply.toLowerCase();
  const forbidden = ['fanvue', 'onlyfans', 'fansly', 'link in bio', 'dm me'];
  for (const word of forbidden) {
    if (lowerReply.includes(word)) {
      return { valid: false, reason: `Contains forbidden: ${word}` };
    }
  }

  return { valid: true };
}

// ===========================================
// DUPLICATE CHECK
// ===========================================

async function isDuplicateComment(commentId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('elena_comment_replies')
      .select('id')
      .eq('comment_id', commentId)
      .single();
    
    return !!data;
  } catch {
    // Table might not exist yet, that's OK
    return false;
  }
}

// ===========================================
// SAVE REPLY
// ===========================================

async function saveCommentReply(
  commentId: string,
  postId: string | undefined,
  username: string,
  userId: string | undefined,
  originalComment: string,
  replyText: string,
  skipped: boolean = false,
  skipReason?: string
): Promise<void> {
  try {
    await supabase
      .from('elena_comment_replies')
      .insert({
        comment_id: commentId,
        post_id: postId || null,
        username,
        user_id: userId || null,
        original_comment: originalComment,
        reply_text: replyText,
        skipped,
        skip_reason: skipReason || null,
      });
    console.log('✅ Comment reply saved to Supabase');
  } catch (error) {
    // Table might not exist yet - log but don't fail
    console.warn('⚠️ Could not save comment reply (table may not exist):', error);
  }
}

// ===========================================
// MAIN HANDLER
// ===========================================

export async function POST(request: NextRequest): Promise<NextResponse<CommentReplyResponse>> {
  const startTime = Date.now();

  try {
    // Parse request
    const body: CommentReplyRequest = await request.json();
    
    // Validate required fields
    if (!body.comment_id || !body.comment_text || !body.username) {
      return NextResponse.json({
        success: false,
        response: '',
        error: 'Missing required fields: comment_id, comment_text, username',
      }, { status: 400 });
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`💬 INCOMING COMMENT`);
    console.log(`From: @${body.username}`);
    console.log(`Comment: "${body.comment_text}"`);
    console.log(`${'='.repeat(50)}`);

    // Check for duplicate (already replied)
    const isDuplicate = await isDuplicateComment(body.comment_id);
    if (isDuplicate) {
      console.log('⚠️ Duplicate comment - already replied');
      return NextResponse.json({
        success: true,
        response: '',
        skip: true,
        skip_reason: 'Already replied to this comment',
      });
    }

    // Check for spam
    if (isSpam(body.comment_text)) {
      console.log('🚫 Spam detected - skipping');
      await saveCommentReply(
        body.comment_id,
        body.post_id,
        body.username,
        body.user_id,
        body.comment_text,
        '',
        true,
        'spam'
      );
      return NextResponse.json({
        success: true,
        response: '',
        skip: true,
        skip_reason: 'Spam detected',
      });
    }

    // Generate reply with retry
    let reply = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      reply = await generateCommentReply(body.comment_text, body.post_caption);
      
      const validation = validateReply(reply);
      if (validation.valid) {
        console.log(`✅ Reply validated (attempt ${attempts})`);
        break;
      }
      
      console.log(`⚠️ Reply invalid (attempt ${attempts}): ${validation.reason}`);
      if (attempts === maxAttempts) {
        // Use safe fallback
        reply = '🖤';
      }
    }

    // Save to database
    await saveCommentReply(
      body.comment_id,
      body.post_id,
      body.username,
      body.user_id,
      body.comment_text,
      reply,
      false
    );

    const duration = Date.now() - startTime;
    console.log(`\n✅ REPLY GENERATED (${duration}ms)`);
    console.log(`Reply: "${reply}"`);
    console.log(`${'='.repeat(50)}\n`);

    return NextResponse.json({
      success: true,
      response: reply,
    });

  } catch (error) {
    console.error('❌ Comment reply error:', error);
    return NextResponse.json({
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ===========================================
// HEALTH CHECK
// ===========================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/comment/reply',
    description: 'ManyChat webhook for Elena auto-reply to comments',
    usage: {
      method: 'POST',
      body: {
        comment_id: 'string (required) - Unique ID of the comment',
        comment_text: 'string (required) - The comment content',
        username: 'string (required) - @username of commenter',
        user_id: 'string (optional) - Instagram user ID',
        post_id: 'string (optional) - ID of the post',
        post_caption: 'string (optional) - Caption for context',
      },
      response: {
        success: 'boolean',
        response: 'string - The reply to post',
        skip: 'boolean (optional) - If true, don\'t post anything',
        skip_reason: 'string (optional) - Why skipped',
      },
    },
  });
}
