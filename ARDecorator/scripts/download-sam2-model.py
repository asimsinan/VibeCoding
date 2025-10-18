#!/usr/bin/env python3

"""
Manual SAM 2 Model Download Script (Python)
Downloads the SAM 2 model files manually to avoid network issues
"""

import os
import requests
import json
from pathlib import Path
from urllib.parse import urljoin

MODEL_NAME = 'Xenova/sam2-base'
BASE_URL = f'https://huggingface.co/{MODEL_NAME}/resolve/main/'

# Model files that need to be downloaded
MODEL_FILES = [
    'config.json',
    'tokenizer.json', 
    'tokenizer_config.json',
    'preprocessor_config.json',
    'model.onnx',
    'model_quantized.onnx'
]

def download_file(url, file_path):
    """Download a file from URL to local path"""
    try:
        print(f"📥 Downloading {os.path.basename(file_path)}...")
        
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"✅ Downloaded: {os.path.basename(file_path)}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download {os.path.basename(file_path)}: {e}")
        return False

def main():
    print('🚀 Starting manual SAM 2 model download...')
    
    # Set up paths
    script_dir = Path(__file__).parent
    model_dir = script_dir.parent / 'public' / 'models' / 'sam2-base'
    
    print(f"📁 Model directory: {model_dir}")
    
    # Create model directory
    model_dir.mkdir(parents=True, exist_ok=True)
    print('📁 Created model directory')
    
    # Download each model file
    success_count = 0
    for filename in MODEL_FILES:
        url = urljoin(BASE_URL, filename)
        file_path = model_dir / filename
        
        if download_file(url, str(file_path)):
            success_count += 1
    
    # Create model info file
    model_info = {
        'name': MODEL_NAME,
        'downloadedAt': str(Path().cwd()),
        'files': MODEL_FILES,
        'localPath': str(model_dir),
        'successfullyDownloaded': success_count
    }
    
    info_file = model_dir / 'model-info.json'
    with open(info_file, 'w') as f:
        json.dump(model_info, f, indent=2)
    
    print('')
    print(f'✅ Downloaded {success_count}/{len(MODEL_FILES)} files successfully!')
    print(f'📁 Model saved to: {model_dir}')
    print('')
    print('🔧 Next steps:')
    print('1. Update sam2Analyzer.ts to use local model path')
    print('2. Configure @xenova/transformers to load from local directory')
    print('3. Test the model loading')

if __name__ == '__main__':
    main()
