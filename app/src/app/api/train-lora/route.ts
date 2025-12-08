import { NextResponse } from 'next/server';
import Replicate from 'replicate';

/**
 * POST /api/train-lora
 * Start LoRA training on Replicate
 * 
 * Body: { zipUrl: string } (actually manifest URL with image URLs)
 */

function getClient(): Replicate {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }
  return new Replicate({ auth: apiToken });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipUrl } = body;

    if (!zipUrl) {
      return NextResponse.json(
        { success: false, error: 'zipUrl is required' },
        { status: 400 }
      );
    }

    console.log('[LoRA Training] Starting training...');
    console.log('[LoRA Training] Manifest URL:', zipUrl);

    // Fetch the manifest to get image URLs
    const manifestResponse = await fetch(zipUrl);
    if (!manifestResponse.ok) {
      throw new Error('Failed to fetch manifest');
    }

    const manifest = await manifestResponse.json();
    const imageUrls = manifest.images || [];

    if (imageUrls.length === 0) {
      throw new Error('No images found in manifest');
    }

    console.log('[LoRA Training] Found', imageUrls.length, 'images in manifest');

    const client = getClient();

    // Get Replicate username from env or use default
    const replicateUsername = process.env.REPLICATE_USERNAME || 'your-username';
    const destination = `${replicateUsername}/mila-lora-${Date.now()}`;

    console.log('[LoRA Training] Destination:', destination);

    // Start LoRA training with Flux Dev LoRA Trainer
    // https://replicate.com/ostris/flux-dev-lora-trainer
    const training = await client.trainings.create(
      'ostris',
      'flux-dev-lora-trainer',
      'e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497',
      {
        destination: destination as `${string}/${string}`,
        input: {
          // Training images - pass as URLs array
          input_images: zipUrl, // URL to ZIP or tar file
          
          // Core training parameters
          steps: 1000, // Number of training steps
          lora_rank: 16, // LoRA rank (16 is good balance)
          optimizer: 'adamw8bit', // Memory efficient optimizer
          batch_size: 1, // Batch size (1 for stability)
          resolution: '512,768,1024', // Training resolutions
          
          // Learning rate
          learning_rate: 0.0004, // 4e-4 is recommended
          
          // Trigger word
          trigger_word: 'MILA', // The word to invoke Mila in prompts
          
          // Auto-captioning
          autocaption: true, // Generate captions automatically
          autocaption_prefix: 'MILA, ', // Prefix for captions
          
          // Dropout for better generalization
          caption_dropout_rate: 0.05,
          
          // Performance
          cache_latents_to_disk: false,
          
          // Weights & Biases tracking (optional)
          wandb_project: 'flux-lora-mila',
          wandb_save_interval: 100,
          wandb_sample_interval: 100,
        },
      }
    );

    console.log('[LoRA Training] Training started!');
    console.log('[LoRA Training] Training ID:', training.id);
    console.log('[LoRA Training] Status:', training.status);
    console.log('[LoRA Training] Destination:', destination);

    return NextResponse.json({
      success: true,
      trainingId: training.id,
      status: training.status,
      destination,
      estimatedTime: '20-30 minutes',
      estimatedCost: '$3-5 USD',
      urls: training.urls,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[LoRA Training] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/train-lora?id=TRAINING_ID
 * Check training status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainingId = searchParams.get('id');

    if (!trainingId) {
      return NextResponse.json(
        { success: false, error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const client = getClient();
    const training = await client.trainings.get(trainingId);

    return NextResponse.json({
      success: true,
      training: {
        id: training.id,
        status: training.status,
        created_at: training.created_at,
        started_at: training.started_at,
        completed_at: training.completed_at,
        logs: training.logs,
        output: training.output,
        error: training.error,
        metrics: training.metrics,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[LoRA Training] Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

