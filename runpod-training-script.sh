#!/bin/bash
# =============================================================
# ELENA LORA TRAINING SCRIPT FOR RUNPOD (OPTIMIZED 2026)
# =============================================================
# Run this script on your RunPod pod after uploading the dataset
#
# Prerequisites:
#   1. Dataset uploaded to /workspace/dataset/10_elena/
#   2. Model uploaded to /workspace/models/ (or use SDXL base)
#
# Based on community best practices for face/character consistency
# =============================================================

set -e

echo "=============================================="
echo "ELENA LORA TRAINING - RunPod RTX 4090"
echo "=============================================="
echo ""

# =============================================================
# OPTIMIZED CONFIGURATION FOR FACE/CHARACTER LORA
# =============================================================

# Resolution - SDXL native
RESOLUTION="1024,1024"

# Batch & Gradient Accumulation (effective batch = 2)
BATCH_SIZE=1
GRAD_ACCUM=2

# Steps - 35 images × 10 repeats = 350 per epoch, ~6 epochs = 2100 steps
MAX_TRAIN_STEPS=2100

# Learning Rates (Text Encoder lower than UNet for better face consistency)
UNET_LR="2e-4"
TEXT_ENCODER_LR="5e-5"

# LoRA Architecture
NETWORK_DIM=32               # Rank 32 = sweet spot for character
NETWORK_ALPHA=16             # Alpha = dim/2 (stable training)

# Advanced - improves contrast and face sharpness
MIN_SNR_GAMMA=5

OUTPUT_NAME="elena_v3_cloud"

# Paths
WORKSPACE="/workspace"
MODEL_PATH="$WORKSPACE/models/sd_xl_base_1.0.safetensors"
DATASET_DIR="$WORKSPACE/dataset"
OUTPUT_DIR="$WORKSPACE/output"
KOHYA_DIR="$WORKSPACE/kohya_ss"

# Step 1: Install kohya_ss if not present
if [ ! -d "$KOHYA_DIR" ]; then
    echo "📦 Installing kohya_ss..."
    cd $WORKSPACE
    git clone https://github.com/bmaltais/kohya_ss.git
    cd kohya_ss
    python -m venv venv
    source venv/bin/activate
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
    pip install -r requirements.txt
    pip install xformers bitsandbytes
    echo "✅ kohya_ss installed"
else
    echo "✅ kohya_ss already installed"
fi

# Step 2: Download SDXL base model if not present
if [ ! -f "$MODEL_PATH" ]; then
    echo "📥 Downloading SDXL base model..."
    mkdir -p $WORKSPACE/models
    cd $WORKSPACE/models
    wget -q --show-progress https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
    echo "✅ Model downloaded"
else
    echo "✅ Model already present"
fi

# Step 3: Check dataset
if [ ! -d "$DATASET_DIR" ]; then
    echo "❌ Dataset not found at $DATASET_DIR"
    echo "Please upload your dataset first!"
    echo ""
    echo "From your local machine, run:"
    echo "  scp -P <PORT> -r lora-dataset-elena-cloud/* root@<POD_IP>:/workspace/dataset/"
    exit 1
fi

IMAGE_COUNT=$(find $DATASET_DIR -name "*.jpg" -o -name "*.png" | wc -l)
echo "📊 Dataset: $IMAGE_COUNT images found"

if [ "$IMAGE_COUNT" -lt 10 ]; then
    echo "⚠️ Warning: Only $IMAGE_COUNT images. Recommend at least 25-35."
fi

# Step 4: Create output directory
mkdir -p $OUTPUT_DIR

# Step 5: Run training
echo ""
echo "🚀 Starting training with OPTIMIZED settings..."
echo "  Resolution: $RESOLUTION"
echo "  Steps: $MAX_TRAIN_STEPS (~2100 for 35 images)"
echo "  UNet LR: $UNET_LR"
echo "  Text Encoder LR: $TEXT_ENCODER_LR (trains face recognition)"
echo "  LoRA Rank: $NETWORK_DIM"
echo "  Gradient Accumulation: $GRAD_ACCUM (effective batch = 2)"
echo "  min_snr_gamma: $MIN_SNR_GAMMA (improves face sharpness)"
echo "  Checkpoints: every 300 steps"
echo "  Output: $OUTPUT_NAME"
echo ""
echo "⏱️  Estimated time: 25-40 minutes on RTX 4090"
echo ""

cd $KOHYA_DIR
source venv/bin/activate

accelerate launch --num_cpu_threads_per_process=2 sdxl_train_network.py \
    --pretrained_model_name_or_path="$MODEL_PATH" \
    --train_data_dir="$DATASET_DIR" \
    --output_dir="$OUTPUT_DIR" \
    --output_name="$OUTPUT_NAME" \
    --save_model_as="safetensors" \
    --resolution="$RESOLUTION" \
    --train_batch_size=$BATCH_SIZE \
    --gradient_accumulation_steps=$GRAD_ACCUM \
    --max_train_steps=$MAX_TRAIN_STEPS \
    --learning_rate=$UNET_LR \
    --text_encoder_lr=$TEXT_ENCODER_LR \
    --train_text_encoder \
    --optimizer_type="AdamW8bit" \
    --lr_scheduler="cosine" \
    --lr_warmup_steps=100 \
    --network_module="networks.lora" \
    --network_dim=$NETWORK_DIM \
    --network_alpha=$NETWORK_ALPHA \
    --mixed_precision="fp16" \
    --save_precision="fp16" \
    --cache_latents \
    --caption_extension=".txt" \
    --shuffle_caption \
    --keep_tokens=1 \
    --min_snr_gamma=$MIN_SNR_GAMMA \
    --seed=42 \
    --xformers \
    --gradient_checkpointing \
    --enable_bucket \
    --min_bucket_reso=512 \
    --max_bucket_reso=2048 \
    --save_every_n_steps=300 \
    --logging_dir="$WORKSPACE/logs"

echo ""
echo "=============================================="
echo "✅ TRAINING COMPLETE!"
echo "=============================================="
echo ""
echo "📁 LoRA saved to: $OUTPUT_DIR/$OUTPUT_NAME.safetensors"
echo ""
echo "📥 Download to your local machine:"
echo "   scp -P <PORT> root@<POD_IP>:$OUTPUT_DIR/$OUTPUT_NAME.safetensors ~/ComfyUI/models/loras/"
echo ""
echo "💡 Don't forget to STOP the pod to save money!"
