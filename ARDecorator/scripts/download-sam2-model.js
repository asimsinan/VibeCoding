#!/usr/bin/env node

/**
 * Manual SAM 2 Model Download Script
 * Downloads the SAM 2 model files manually to avoid network issues
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_NAME = 'Xenova/sam2-base';
const MODEL_DIR = path.join(__dirname, '..', 'public', 'models', 'sam2-base');

// Model files that need to be downloaded
const MODEL_FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'preprocessor_config.json',
  'model.onnx',
  'model_quantized.onnx'
];

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(filePath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadSAM2Model() {
  try {
    console.log('🚀 Starting manual SAM 2 model download...');
    console.log(`📁 Model directory: ${MODEL_DIR}`);
    
    // Create model directory
    if (!fs.existsSync(MODEL_DIR)) {
      fs.mkdirSync(MODEL_DIR, { recursive: true });
      console.log('📁 Created model directory');
    }
    
    // Download each model file
    for (const fileName of MODEL_FILES) {
      const url = `https://huggingface.co/${MODEL_NAME}/resolve/main/${fileName}`;
      const filePath = path.join(MODEL_DIR, fileName);
      
      console.log(`📥 Downloading ${fileName}...`);
      await downloadFile(url, filePath);
    }
    
    // Create model info file
    const modelInfo = {
      name: MODEL_NAME,
      downloadedAt: new Date().toISOString(),
      files: MODEL_FILES,
      localPath: MODEL_DIR
    };
    
    fs.writeFileSync(
      path.join(MODEL_DIR, 'model-info.json'),
      JSON.stringify(modelInfo, null, 2)
    );
    
    console.log('');
    console.log('✅ SAM 2 model download complete!');
    console.log(`📁 Model saved to: ${MODEL_DIR}`);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Update sam2Analyzer.ts to use local model path');
    console.log('2. Configure @xenova/transformers to load from local directory');
    console.log('3. Test the model loading');
    
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run the download
downloadSAM2Model();
