#!/usr/bin/env node
// Image Handling CLI
// Command-line interface for image handling operations

import { ImageManager, ImageProcessor, ImageValidator } from '../../libraries/image-handling';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

interface CLIOptions {
  json: boolean;
  help: boolean;
  version: boolean;
}

interface CLICommand {
  action: string;
  options: Record<string, any>;
}

class ImageHandlingCLI {
  private imageManager: ImageManager;
  private imageProcessor: ImageProcessor;
  private imageValidator: ImageValidator;
  private options: CLIOptions;

  constructor() {
    const prisma = new PrismaClient();
    const config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxDimensions: {
        width: 4000,
        height: 4000
      },
      thumbnailSizes: [
        { name: 'small', width: 150, height: 150 },
        { name: 'medium', width: 300, height: 300 },
        { name: 'large', width: 600, height: 600 }
      ],
      storageConfig: {
        provider: 'local' as const,
        baseUrl: 'http://localhost:3000'
      },
      processingConfig: {
        enableProcessing: true,
        defaultQuality: 80,
        enableWatermark: false
      }
    };

    this.imageManager = new ImageManager(prisma, config);
    this.imageProcessor = new ImageProcessor();
    this.imageValidator = new ImageValidator(config);
    this.options = this.parseOptions();
  }

  public async run(): Promise<void> {
    try {
      if (this.options.help) {
        this.showHelp();
        return;
      }

      if (this.options.version) {
        this.showVersion();
        return;
      }

      const command = await this.parseCommand();
      const result = await this.executeCommand(command);
      this.outputResult(result);
    } catch (error) {
      this.outputError(error);
    }
  }

  private parseOptions(): CLIOptions {
    const args = process.argv.slice(2);
    return {
      json: args.includes('--json'),
      help: args.includes('--help') || args.includes('-h'),
      version: args.includes('--version') || args.includes('-v')
    };
  }

  private async parseCommand(): Promise<CLICommand> {
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    
    if (args.length === 0) {
      throw new Error('No command specified');
    }

    const action = args[0];
    const options: Record<string, any> = {};

    // Parse remaining arguments as key-value pairs
    for (let i = 1; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        const key = args[i];
        const value = args[i + 1];
        
        // Try to parse as JSON if it looks like JSON
        try {
          if (key && value) {
            options[key] = JSON.parse(value);
          }
        } catch {
          if (key && value) {
            options[key] = value;
          }
        }
      }
    }

    return { action: action || '', options };
  }

  private async executeCommand(command: CLICommand): Promise<any> {
    const { action, options } = command;

    switch (action) {
      case 'upload':
        return await this.uploadImage(options);
      case 'get':
        return await this.getImage(options);
      case 'delete':
        return await this.deleteImage(options);
      case 'list':
        return await this.listImages(options);
      case 'stats':
        return await this.getImageStatistics(options);
      case 'resize':
        return await this.resizeImage(options);
      case 'crop':
        return await this.cropImage(options);
      case 'rotate':
        return await this.rotateImage(options);
      case 'flip':
        return await this.flipImage(options);
      case 'filter':
        return await this.applyFilter(options);
      case 'watermark':
        return await this.addWatermark(options);
      case 'thumbnail':
        return await this.generateThumbnail(options);
      case 'thumbnails':
        return await this.generateMultipleThumbnails(options);
      case 'validate':
        return await this.validateImage(options);
      case 'process':
        return await this.processImage(options);
      default:
        throw new Error(`Unknown command: ${action}`);
    }
  }

  private async uploadImage(options: Record<string, any>): Promise<any> {
    if (!options.file || !options.filename || !options.uploadedBy) {
      throw new Error('File path, filename, and uploadedBy are required for upload');
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = readFileSync(options.file);
    } catch (error) {
      throw new Error(`Failed to read file: ${options.file}`);
    }

    return await this.imageManager.uploadImage({
      file: fileBuffer,
      filename: options.filename,
      uploadedBy: options.uploadedBy,
      category: options.category,
      metadata: options.metadata ? JSON.parse(options.metadata) : {}
    });
  }

  private async getImage(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Image ID is required');
    }

    return await this.imageManager.getImage(options.id);
  }

  private async deleteImage(options: Record<string, any>): Promise<any> {
    if (!options.id) {
      throw new Error('Image ID is required for deletion');
    }

    return await this.imageManager.deleteImage(options.id);
  }

  private async listImages(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required for listing images');
    }

    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 10;

    return await this.imageManager.getImagesByUser(options.userId, page, limit);
  }

  private async getImageStatistics(options: Record<string, any>): Promise<any> {
    if (!options.userId) {
      throw new Error('User ID is required');
    }

    return await this.imageManager.getImageStatistics(options.userId);
  }

  private async resizeImage(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.width || !options.height) {
      throw new Error('Image URL, width, and height are required for resize');
    }

    return await this.imageProcessor.resizeImage(options.imageUrl, {
      width: parseInt(options.width),
      height: parseInt(options.height),
      maintainAspectRatio: options.maintainAspectRatio === 'true',
      fit: options.fit || 'cover'
    });
  }

  private async cropImage(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.x || !options.y || !options.width || !options.height) {
      throw new Error('Image URL, x, y, width, and height are required for crop');
    }

    return await this.imageProcessor.cropImage(options.imageUrl, {
      x: parseInt(options.x),
      y: parseInt(options.y),
      width: parseInt(options.width),
      height: parseInt(options.height)
    });
  }

  private async rotateImage(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.angle) {
      throw new Error('Image URL and angle are required for rotate');
    }

    return await this.imageProcessor.rotateImage(options.imageUrl, {
      angle: parseInt(options.angle),
      background: options.background
    });
  }

  private async flipImage(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.direction) {
      throw new Error('Image URL and direction are required for flip');
    }

    return await this.imageProcessor.flipImage(options.imageUrl, {
      direction: options.direction
    });
  }

  private async applyFilter(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.filter) {
      throw new Error('Image URL and filter are required');
    }

    return await this.imageProcessor.applyFilter(options.imageUrl, {
      filter: options.filter,
      intensity: options.intensity ? parseInt(options.intensity) : 1
    });
  }

  private async addWatermark(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl) {
      throw new Error('Image URL is required for watermark');
    }

    return await this.imageProcessor.addWatermark(options.imageUrl, {
      text: options.text,
      image: options.image,
      position: options.position || 'bottom-right',
      opacity: options.opacity ? parseFloat(options.opacity) : 0.5,
      fontSize: options.fontSize ? parseInt(options.fontSize) : 24,
      color: options.color || '#ffffff'
    });
  }

  private async generateThumbnail(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.width || !options.height) {
      throw new Error('Image URL, width, and height are required for thumbnail');
    }

    return await this.imageProcessor.generateThumbnail(
      options.imageUrl,
      parseInt(options.width),
      parseInt(options.height)
    );
  }

  private async generateMultipleThumbnails(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.sizes) {
      throw new Error('Image URL and sizes are required for multiple thumbnails');
    }

    const sizes = JSON.parse(options.sizes);
    return await this.imageProcessor.generateMultipleThumbnails(options.imageUrl, sizes);
  }

  private async validateImage(options: Record<string, any>): Promise<any> {
    if (!options.file || !options.filename) {
      throw new Error('File path and filename are required for validation');
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = readFileSync(options.file);
    } catch (error) {
      throw new Error(`Failed to read file: ${options.file}`);
    }

    const validation = this.imageValidator.validateFile(fileBuffer, options.filename);
    return {
      success: validation.isValid,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  private async processImage(options: Record<string, any>): Promise<any> {
    if (!options.imageUrl || !options.operations) {
      throw new Error('Image URL and operations are required for processing');
    }

    const operations = JSON.parse(options.operations);
    return await this.imageProcessor.processImage({
      imageUrl: options.imageUrl,
      operations,
      outputFormat: options.outputFormat || 'jpeg',
      quality: options.quality ? parseInt(options.quality) : 80
    });
  }

  private outputResult(result: any): void {
    if (this.options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.success) {
        console.log('✅ Success:', result.message || 'Operation completed successfully');
        if (result.data) {
          console.log('Data:', JSON.stringify(result.data, null, 2));
        }
      } else {
        console.error('❌ Error:', result.error || 'Operation failed');
        if (result.message) {
          console.error('Message:', result.message);
        }
      }
    }
  }

  private outputError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (this.options.json) {
      console.error(JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.error('❌ Error:', errorMessage);
    }
    
    process.exit(1);
  }

  private showHelp(): void {
    console.log(`
Image Handling CLI

Usage: image-cli [options] <command> [arguments]

Commands:
  upload                      Upload an image
    --file <path>             File path
    --filename <string>       Filename
    --uploadedBy <string>     User ID who uploaded
    --category <string>       Category (optional)
    --metadata <json>         Metadata (optional)

  get                         Get image details
    --id <string>             Image ID

  delete                      Delete an image
    --id <string>             Image ID

  list                        List images for a user
    --userId <string>         User ID
    --page <number>           Page number (optional)
    --limit <number>          Items per page (optional)

  stats                       Get image statistics
    --userId <string>         User ID

  resize                      Resize an image
    --imageUrl <string>       Image URL
    --width <number>          New width
    --height <number>         New height
    --maintainAspectRatio <boolean> Maintain aspect ratio (optional)
    --fit <string>            Fit mode (optional)

  crop                        Crop an image
    --imageUrl <string>       Image URL
    --x <number>              X coordinate
    --y <number>              Y coordinate
    --width <number>          Crop width
    --height <number>         Crop height

  rotate                      Rotate an image
    --imageUrl <string>       Image URL
    --angle <number>          Rotation angle
    --background <string>     Background color (optional)

  flip                        Flip an image
    --imageUrl <string>       Image URL
    --direction <string>      Direction (horizontal/vertical/both)

  filter                      Apply filter to image
    --imageUrl <string>       Image URL
    --filter <string>         Filter type (blur/sharpen/brighten/darken/grayscale/sepia)
    --intensity <number>      Filter intensity (optional)

  watermark                   Add watermark to image
    --imageUrl <string>       Image URL
    --text <string>           Watermark text (optional)
    --image <string>          Watermark image (optional)
    --position <string>       Position (optional)
    --opacity <number>        Opacity (optional)
    --fontSize <number>       Font size (optional)
    --color <string>          Color (optional)

  thumbnail                   Generate thumbnail
    --imageUrl <string>       Image URL
    --width <number>          Thumbnail width
    --height <number>         Thumbnail height

  thumbnails                  Generate multiple thumbnails
    --imageUrl <string>       Image URL
    --sizes <json>            Sizes array

  validate                    Validate image file
    --file <path>             File path
    --filename <string>       Filename

  process                     Process image with multiple operations
    --imageUrl <string>       Image URL
    --operations <json>        Operations array
    --outputFormat <string>   Output format (optional)
    --quality <number>        Quality (optional)

Options:
  --json                      Output in JSON format
  --help, -h                 Show this help message
  --version, -v              Show version information

Examples:
  image-cli upload --file "/path/to/image.jpg" --filename "product.jpg" --uploadedBy "user123"
  image-cli resize --imageUrl "https://example.com/image.jpg" --width 300 --height 300
  image-cli crop --imageUrl "https://example.com/image.jpg" --x 100 --y 100 --width 200 --height 200
  image-cli thumbnail --imageUrl "https://example.com/image.jpg" --width 150 --height 150
  image-cli --json upload --file "/path/to/image.jpg" --filename "product.jpg" --uploadedBy "user123"
`);
  }

  private showVersion(): void {
    console.log('Image Handling CLI v1.0.0');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new ImageHandlingCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export default ImageHandlingCLI;
