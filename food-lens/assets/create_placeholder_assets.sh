#!/bin/bash
# Create placeholder PNG assets for Expo app

create_placeholder() {
    local size=$1
    local output=$2
    
    # Use sips if available (macOS)
    if command -v sips > /dev/null; then
        # Create a simple colored square
        sips -z $size $size --setProperty format png /System/Library/CoreServices/DefaultDesktop.heic --out "$output" 2>/dev/null || \
        python3 -c "
from PIL import Image, ImageDraw
img = Image.new('RGB', ($size, $size), color='#22c55e')
draw = ImageDraw.Draw(img)
draw.text(($size//2-50, $size//2), 'Food\nLens', fill='white')
img.save('$output')
" 2>/dev/null || \
        echo "Note: Install Python PIL or ImageMagick to generate proper placeholders"
    fi
}

# Create placeholders
cd assets
create_placeholder 1024 icon.png
create_placeholder 2048 splash.png  
create_placeholder 1024 adaptive-icon.png
create_placeholder 192 favicon.png

echo "Placeholder assets created in assets/ directory"
