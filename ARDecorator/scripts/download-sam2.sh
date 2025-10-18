#!/bin/bash

# Manual SAM 2 Model Download Script
# Downloads SAM 2 model files to avoid network issues during runtime

echo "🚀 Manual SAM 2 Model Download"
echo "================================"
echo ""

# Set up directories
MODEL_DIR="public/models/sam2-base"
MODEL_NAME="Xenova/sam2-base"
BASE_URL="https://huggingface.co/$MODEL_NAME/resolve/main/"

# Model files to download
FILES=(
    "config.json"
    "tokenizer.json"
    "tokenizer_config.json"
    "preprocessor_config.json"
    "model.onnx"
    "model_quantized.onnx"
)

echo "📁 Creating model directory: $MODEL_DIR"
mkdir -p "$MODEL_DIR"

echo "📥 Downloading SAM 2 model files..."
echo ""

# Download each file
for file in "${FILES[@]}"; do
    echo "📥 Downloading $file..."
    url="$BASE_URL$file"
    
    if curl -L -o "$MODEL_DIR/$file" "$url"; then
        echo "✅ Downloaded: $file"
    else
        echo "❌ Failed to download: $file"
    fi
    echo ""
done

# Create model info file
cat > "$MODEL_DIR/model-info.json" << EOF
{
  "name": "$MODEL_NAME",
  "downloadedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": $(printf '%s\n' "${FILES[@]}" | jq -R . | jq -s .),
  "localPath": "$MODEL_DIR"
}
EOF

echo "✅ Download complete!"
echo ""
echo "📁 Model saved to: $MODEL_DIR"
echo ""
echo "🔧 Next steps:"
echo "1. The SAM 2 analyzer will now try to load from local directory first"
echo "2. If local model fails, it will fallback to downloading from Hugging Face"
echo "3. Test the room photo upload to see if it works!"
echo ""
echo "🎯 Benefits:"
echo "• Faster model loading (no download time)"
echo "• Works offline after initial download"
echo "• Avoids network issues during runtime"
