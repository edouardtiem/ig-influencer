#!/bin/bash
# Train Elena LoRA on Mac M3 Pro
# Optimized for 18GB RAM with SDXL

set -e

# Paths
KOHYA_DIR="$HOME/kohya_ss"
MODEL_PATH="$HOME/ComfyUI/models/checkpoints/bigLust_v16.safetensors"
# Get absolute path to dataset
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATASET_DIR="$SCRIPT_DIR/lora-dataset-elena"
OUTPUT_DIR="$HOME/ComfyUI/models/loras"

# Training params (optimized for Mac M3 Pro 18GB)
RESOLUTION="512,512"
BATCH_SIZE=1
MAX_TRAIN_STEPS=100  # More steps for 10 images
LEARNING_RATE="1e-4"
NETWORK_DIM=8        # LoRA rank reduced for memory
NETWORK_ALPHA=4      # Alpha = dim/2

echo "=============================================="
echo "ELENA LORA TRAINING - Mac M3 Pro Edition"
echo "=============================================="
echo ""
echo "Model:      $MODEL_PATH"
echo "Dataset:    $DATASET_DIR"
echo "Output:     $OUTPUT_DIR"
echo "Resolution: $RESOLUTION"
echo "Steps:      $MAX_TRAIN_STEPS"
echo "LoRA Rank:  $NETWORK_DIM"
echo ""

# Check paths
if [ ! -f "$MODEL_PATH" ]; then
    echo "❌ Model not found: $MODEL_PATH"
    exit 1
fi

if [ ! -d "$DATASET_DIR" ]; then
    echo "❌ Dataset not found: $DATASET_DIR"
    exit 1
fi

# Create output dir
mkdir -p "$OUTPUT_DIR"

# Activate venv
cd "$KOHYA_DIR"
source venv/bin/activate

echo "🚀 Starting training..."
echo ""

# Set environment for MPS
export PYTORCH_ENABLE_MPS_FALLBACK=1
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0

# Change to sd-scripts directory for proper module resolution
cd "$KOHYA_DIR/sd-scripts"

# Run training
accelerate launch --num_cpu_threads_per_process=1 sdxl_train_network.py \
    --pretrained_model_name_or_path="$MODEL_PATH" \
    --train_data_dir="$DATASET_DIR" \
    --output_dir="$OUTPUT_DIR" \
    --output_name="elena_body_face_v2" \
    --save_model_as="safetensors" \
    --resolution="$RESOLUTION" \
    --train_batch_size=$BATCH_SIZE \
    --max_train_steps=$MAX_TRAIN_STEPS \
    --learning_rate=$LEARNING_RATE \
    --optimizer_type="AdamW" \
    --lr_scheduler="cosine" \
    --lr_warmup_steps=20 \
    --network_module="networks.lora" \
    --network_dim=$NETWORK_DIM \
    --network_alpha=$NETWORK_ALPHA \
    --mixed_precision="no" \
    --save_precision="fp16" \
    --cache_latents_to_disk \
    --caption_extension=".txt" \
    --shuffle_caption \
    --seed=42 \
    --max_data_loader_n_workers=0 \
    --gradient_checkpointing \
    --enable_bucket \
    --bucket_no_upscale \
    --sdpa \
    --lowram \
    --logging_dir="$OUTPUT_DIR/logs"

echo ""
echo "=============================================="
echo "✅ Training complete!"
echo "=============================================="
echo ""
echo "LoRA saved to: $OUTPUT_DIR/elena_body_face_v2.safetensors"
echo ""
echo "To use in ComfyUI:"
echo "1. Add a LoraLoader node after CheckpointLoaderSimple"
echo "2. Select 'elena_body_face_v2.safetensors'"
echo "3. Set strength to 0.7-1.0"
