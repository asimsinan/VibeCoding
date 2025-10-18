#!/usr/bin/env python3

"""
Manual SAM 2 Model Download Script using Hugging Face Hub
Downloads the SAM 2 model files using the official HF library
"""

import os
import json
from pathlib import Path
from huggingface_hub import hf_hub_download, snapshot_download

MODEL_NAME = 'Xenova/sam2-base'

def download_model():
    """Download SAM 2 model using Hugging Face Hub"""
    try:
        print('🚀 Starting SAM 2 model download using Hugging Face Hub...')
        
        # Set up local directory
        script_dir = Path(__file__).parent
        model_dir = script_dir.parent / 'public' / 'models' / 'sam2-base'
        model_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"📁 Model directory: {model_dir}")
        
        # Download the entire model repository
        print("📥 Downloading model files...")
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=str(model_dir),
            local_dir_use_symlinks=False
        )
        
        print("✅ Model download complete!")
        print(f"📁 Model saved to: {model_dir}")
        
        # List downloaded files
        files = list(model_dir.glob('*'))
        print(f"\n📋 Downloaded {len(files)} files:")
        for file in files:
            if file.is_file():
                size = file.stat().st_size
                print(f"  • {file.name} ({size:,} bytes)")
        
        return True
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False

def main():
    print('🔍 Manual SAM 2 Model Download')
    print('==============================')
    print('')
    
    # Check if huggingface_hub is installed
    try:
        import huggingface_hub
        print(f"✅ Hugging Face Hub version: {huggingface_hub.__version__}")
    except ImportError:
        print("❌ Hugging Face Hub not installed!")
        print("📦 Install it with: pip install huggingface_hub")
        return
    
    success = download_model()
    
    if success:
        print('')
        print('🎯 Next steps:')
        print('1. The SAM 2 analyzer will now try to load from local directory')
        print('2. Test room photo upload to see if it works!')
        print('3. No more network issues during runtime')
    else:
        print('')
        print('💡 Alternative solutions:')
        print('1. Check your internet connection')
        print('2. Try using a VPN if Hugging Face is blocked')
        print('3. Use the Python backend SAM 2 implementation instead')

if __name__ == '__main__':
    main()
