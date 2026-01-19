#!/usr/bin/env python3
"""
Add emoji overlays to images for censoring intimate parts.
Uses actual emoji PNG images from Twemoji.

Usage: python3 add-emoji-overlay.py
"""

from PIL import Image
import os

# Folders
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EMOJI_DIR = os.path.join(SCRIPT_DIR, "emojis")
INPUT_FOLDER = os.path.expanduser("~/Desktop/link")
OUTPUT_FOLDER = os.path.expanduser("~/Desktop/link/censored")

# Emoji image files
EMOJIS = {
    "🔥": os.path.join(EMOJI_DIR, "fire.png"),
    "⭐": os.path.join(EMOJI_DIR, "star.png"),
    "💗": os.path.join(EMOJI_DIR, "heart.png"),
}

# Emoji configurations per image
# Format: { "filename": [(emoji, x_percent, y_percent, size_percent), ...] }
# x_percent, y_percent = position as % of image dimensions (0-100)
# size_percent = emoji size as % of image width

EMOJI_CONFIG = {
    "1.png": [
        ("🔥", 50, 45, 18),  # Adjust these values!
    ],
    "2.jpg": [
        ("🔥", 50, 40, 15),
        ("⭐", 50, 75, 15),
    ],
    "3.jpg": [
        ("🔥", 50, 35, 15),
        ("💗", 50, 70, 15),
    ],
    "4.jpg": [
        ("🔥", 45, 40, 15),
        ("🔥", 55, 40, 15),
    ],
    "5.jpg": [
        ("⭐", 50, 50, 18),
    ],
    "6.jpg": [
        ("🔥", 50, 35, 15),
        ("💗", 50, 70, 15),
    ],
}


def add_emoji_overlay(image_path, output_path, emoji_positions):
    """Add emoji PNG overlays to an image."""
    # Open base image
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    for emoji_char, x_pct, y_pct, size_pct in emoji_positions:
        # Load emoji PNG
        emoji_path = EMOJIS.get(emoji_char)
        if not emoji_path or not os.path.exists(emoji_path):
            print(f"   ⚠️  Emoji {emoji_char} not found, skipping")
            continue
        
        emoji_img = Image.open(emoji_path).convert("RGBA")
        
        # Calculate size
        emoji_size = int(width * size_pct / 100)
        emoji_img = emoji_img.resize((emoji_size, emoji_size), Image.LANCZOS)
        
        # Calculate position (center the emoji on the point)
        x = int(width * x_pct / 100) - emoji_size // 2
        y = int(height * y_pct / 100) - emoji_size // 2
        
        # Paste emoji with transparency
        img.paste(emoji_img, (x, y), emoji_img)
    
    # Save
    if output_path.lower().endswith(('.jpg', '.jpeg')):
        img = img.convert('RGB')
    
    img.save(output_path, quality=95)
    print(f"   ✅ Saved: {os.path.basename(output_path)}")


def main():
    # Create output folder
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    print("🎨 Adding emoji overlays to images...")
    print(f"   Input:  {INPUT_FOLDER}")
    print(f"   Output: {OUTPUT_FOLDER}")
    print()
    
    for filename, positions in EMOJI_CONFIG.items():
        input_path = os.path.join(INPUT_FOLDER, filename)
        
        if not os.path.exists(input_path):
            print(f"⚠️  Skipping {filename} - file not found")
            continue
        
        # Output as PNG
        output_filename = os.path.splitext(filename)[0] + "_censored.png"
        output_path = os.path.join(OUTPUT_FOLDER, output_filename)
        
        print(f"📸 {filename} → {output_filename}")
        add_emoji_overlay(input_path, output_path, positions)
    
    print()
    print(f"🎉 Done! Check: {OUTPUT_FOLDER}")


if __name__ == "__main__":
    main()
