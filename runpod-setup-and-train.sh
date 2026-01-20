#!/bin/bash
# =============================================================
# ELENA LORA FULL SETUP & TRAINING SCRIPT FOR RUNPOD
# =============================================================
# Run this directly on the RunPod pod via Web Terminal
# Copy-paste into: https://console.runpod.io/pods -> Click pod -> Connect -> Start Web Terminal
# =============================================================

set -e

echo "=============================================="
echo "ELENA LORA TRAINING - Full Setup"
echo "=============================================="
echo ""

WORKSPACE="/workspace"
cd $WORKSPACE

# =============================================================
# STEP 1: Download Dataset from Cloudinary
# =============================================================
echo "📥 Step 1: Downloading dataset from Cloudinary..."

mkdir -p $WORKSPACE/dataset/10_elena
cd $WORKSPACE/dataset/10_elena

# Download all 35 images
IMAGES=(
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768847547/elena-scheduled/carousel-2-1768847547.jpg elena_01.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768847319/elena-scheduled/carousel-1-1768847318.jpg elena_02.jpg profile medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768844736/elena-scheduled/carousel-1-1768844735.jpg elena_03.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768763692/elena-scheduled/carousel-3-1768763692.jpg elena_04.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768763641/elena-scheduled/carousel-2-1768763641.jpg elena_05.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768763588/elena-scheduled/carousel-1-1768763588.jpg elena_06.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768739598/elena-scheduled/carousel-3-1768739597.jpg elena_07.jpg 3/4 full"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768677268/elena-scheduled/carousel-2-1768677268.jpg elena_08.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768677197/elena-scheduled/carousel-1-1768677196.jpg elena_09.jpg profile medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768656524/elena-scheduled/carousel-2-1768656524.jpg elena_10.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768656426/elena-scheduled/carousel-1-1768656426.jpg elena_11.jpg 3/4 full"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768653117/elena-scheduled/carousel-1-1768653117.jpg elena_12.jpg 3/4 full"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768591221/elena-scheduled/carousel-3-1768591221.jpg elena_13.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768591177/elena-scheduled/carousel-2-1768591177.jpg elena_14.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768591118/elena-scheduled/carousel-1-1768591118.jpg elena_15.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768518016/elena-fanvue-daily/morning_selfie_above-1768518015.jpg elena_16.jpg front closeup"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768517864/elena-fanvue-daily/yoga_from_above-1768517863.jpg elena_17.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768511997/elena-scheduled/carousel-2-1768511997.jpg elena_18.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768511907/elena-scheduled/carousel-1-1768511906.jpg elena_19.jpg 3/4 full"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768506296/elena-scheduled/carousel-1-1768506295.jpg elena_20.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768484265/elena-scheduled/carousel-1-1768484265.jpg elena_21.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768418450/elena-scheduled/carousel-2-1768418450.jpg elena_22.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768418393/elena-scheduled/carousel-1-1768418392.jpg elena_23.jpg profile medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768394526/elena-scheduled/carousel-2-1768394525.jpg elena_24.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768332035/elena-scheduled/carousel-3-1768332034.jpg elena_25.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768331913/elena-scheduled/carousel-1-1768331913.jpg elena_26.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768307935/elena-scheduled/carousel-2-1768307935.jpg elena_27.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768245687/elena-scheduled/carousel-3-1768245686.jpg elena_28.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768245583/elena-scheduled/carousel-1-1768245582.jpg elena_29.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768234884/elena-fanvue-daily/morning_bed_stretch-1768234884.jpg elena_30.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1768158808/elena-scheduled/carousel-1-1768158807.jpg elena_31.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1767954077/elena-trending-test/bozekkek0rc8nrrotr6w.jpg elena_32.jpg front medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1767951368/elena-trending-test/ljnvpscynjz5qutszpn8.jpg elena_33.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1767554094/elena-scheduled/carousel-3-1767554094.jpg elena_34.jpg 3/4 medium"
  "https://res.cloudinary.com/dily60mr0/image/upload/v1767554047/elena-scheduled/carousel-2-1767554046.jpg elena_35.jpg profile medium"
)

# Elena base caption
TRIGGER="elena"
IDENTITY="24 year old Italian woman"
EYES="honey brown warm eyes"
HAIR="bronde hair with dark roots and golden blonde balayage, long voluminous beach waves"
FACE="small beauty mark on right cheekbone"
BODY="fit athletic toned body, natural breasts, defined slim waist"
SKIN="sun-kissed Mediterranean skin, natural skin texture"

download_and_caption() {
  local url=$1
  local filename=$2
  local angle=$3
  local shot=$4
  
  # Download image
  wget -q -O "$filename" "$url"
  
  # Generate caption based on angle
  local angle_desc=""
  local include_body=true
  
  case $angle in
    "front") angle_desc="front view, facing camera" ;;
    "3/4") angle_desc="three-quarter angle, slight turn" ;;
    "profile") angle_desc="side profile view" ;;
    "back") angle_desc="back view, from behind" ;;
    *) angle_desc="natural angle" ;;
  esac
  
  if [ "$shot" = "closeup" ]; then
    angle_desc="$angle_desc, close-up portrait"
    include_body=false
  elif [ "$shot" = "full" ]; then
    angle_desc="$angle_desc, full body shot"
  fi
  
  # Build caption
  local caption_file="${filename%.jpg}.txt"
  if [ "$include_body" = true ]; then
    echo "$TRIGGER, $IDENTITY, $EYES, $FACE, $HAIR, $BODY, $angle_desc, $SKIN, photo" > "$caption_file"
  else
    echo "$TRIGGER, $IDENTITY, $EYES, $FACE, $HAIR, $angle_desc, $SKIN, photo" > "$caption_file"
  fi
}

count=0
total=${#IMAGES[@]}
for img_data in "${IMAGES[@]}"; do
  read -r url filename angle shot <<< "$img_data"
  count=$((count + 1))
  echo "[$count/$total] Downloading $filename..."
  download_and_caption "$url" "$filename" "$angle" "$shot"
done

echo "✅ Dataset downloaded: $(ls *.jpg | wc -l) images, $(ls *.txt | wc -l) captions"
echo ""

# =============================================================
# STEP 2: Install kohya_ss
# =============================================================
echo "📦 Step 2: Installing kohya_ss..."

cd $WORKSPACE

if [ ! -d "kohya_ss" ]; then
  git clone https://github.com/bmaltais/kohya_ss.git
  cd kohya_ss
  python -m venv venv
  source venv/bin/activate
  pip install --upgrade pip
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
  pip install -r requirements.txt
  pip install xformers bitsandbytes
  echo "✅ kohya_ss installed"
else
  echo "✅ kohya_ss already installed"
  cd kohya_ss
  source venv/bin/activate
fi

# =============================================================
# STEP 3: Download SDXL model
# =============================================================
echo "📥 Step 3: Downloading SDXL base model..."

mkdir -p $WORKSPACE/models
cd $WORKSPACE/models

if [ ! -f "sd_xl_base_1.0.safetensors" ]; then
  wget -q --show-progress https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
  echo "✅ SDXL model downloaded"
else
  echo "✅ SDXL model already present"
fi

# =============================================================
# STEP 4: Run Training (OPTIMIZED PARAMS)
# =============================================================
echo ""
echo "🚀 Step 4: Starting LoRA training..."
echo ""

# Optimized training params
RESOLUTION="1024,1024"
BATCH_SIZE=1
GRAD_ACCUM=2
MAX_TRAIN_STEPS=2100
UNET_LR="2e-4"
TEXT_ENCODER_LR="5e-5"
NETWORK_DIM=32
NETWORK_ALPHA=16
MIN_SNR_GAMMA=5
OUTPUT_NAME="elena_v3_cloud"

echo "  Resolution: $RESOLUTION"
echo "  Steps: $MAX_TRAIN_STEPS"
echo "  UNet LR: $UNET_LR"
echo "  Text Encoder LR: $TEXT_ENCODER_LR"
echo "  LoRA Rank: $NETWORK_DIM"
echo "  Gradient Accumulation: $GRAD_ACCUM"
echo "  min_snr_gamma: $MIN_SNR_GAMMA"
echo ""
echo "⏱️  Estimated time: 25-40 minutes"
echo ""

cd $WORKSPACE/kohya_ss
source venv/bin/activate

mkdir -p $WORKSPACE/output
mkdir -p $WORKSPACE/logs

accelerate launch --num_cpu_threads_per_process=2 sdxl_train_network.py \
    --pretrained_model_name_or_path="$WORKSPACE/models/sd_xl_base_1.0.safetensors" \
    --train_data_dir="$WORKSPACE/dataset" \
    --output_dir="$WORKSPACE/output" \
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
echo "📁 LoRA saved to: $WORKSPACE/output/${OUTPUT_NAME}.safetensors"
echo ""
echo "📥 Download to your local machine:"
echo "   Go to RunPod console -> Click pod -> File Manager"
echo "   Download: /workspace/output/${OUTPUT_NAME}.safetensors"
echo ""
echo "💡 Don't forget to STOP the pod to save money!"
