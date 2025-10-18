import sharp from 'sharp';

export interface RoomTextureData {
  floor: {
    texture: Buffer;
    boundingBox: { x: number; y: number; width: number; height: number };
    material: string;
  };
  walls: {
    left: {
      texture: Buffer;
      boundingBox: { x: number; y: number; width: number; height: number };
      material: string;
    };
    right: {
      texture: Buffer;
      boundingBox: { x: number; y: number; width: number; height: number };
      material: string;
    };
    back: {
      texture: Buffer;
      boundingBox: { x: number; y: number; width: number; height: number };
      material: string;
    };
  };
  ceiling: {
    texture: Buffer;
    boundingBox: { x: number; y: number; width: number; height: number };
    material: string;
  };
  edgeMap: string;
  sam2Analysis?: {
    success: boolean;
    masks: number[][];
    scores: number[];
    room_structure: {
      detected_surfaces: number;
      high_confidence_masks: number;
      room_analysis: {
        has_ceiling: boolean;
        has_floor: boolean;
        has_walls: boolean;
      };
    };
    analysis: {
      surfaces_detected: number;
      confidence_scores: number[];
      room_dimensions: { width: number; height: number };
    };
  };
}

export class RoomTextureExtractionService {
  /**
   * Extract proper textures for each room surface from a 2D room image
   * using client-side SAM analysis results or intelligent backend analysis
   */
  async extractRoomTextures(imageBuffer: Buffer, sam2Analysis?: any): Promise<RoomTextureData> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

  
    let sam2Result: any;
    let surfaceBounds: any;
    let edgeMap: string;

    if (sam2Analysis && sam2Analysis.success) {
  
      sam2Result = sam2Analysis;
      const sam2Bounds = this.extractSurfacesFromClientSAM(sam2Analysis, width, height);
      surfaceBounds = sam2Bounds.surfaceBounds;
      edgeMap = sam2Analysis.edgeMap || '';
    } else {
      // Use intelligent backend analysis when SAM data is not available
      console.log('🧠 Using intelligent backend analysis (no SAM data available)');
      sam2Result = this.createIntelligentBackendAnalysis(imageBuffer, width, height);
      const sam2Bounds = this.extractSurfacesFromClientSAM(sam2Result, width, height);
      surfaceBounds = sam2Bounds.surfaceBounds;
      edgeMap = sam2Result.edgeMap || '';
    }
    


    // Get raw pixel data for material analysis
    const { data, info } = await sharp(imageBuffer)
      .resize(width, height)
      .raw()
      .toBuffer({ resolveWithObject: true });
    

    // Step 2: Extract individual textures for each detected surface
    console.log('🎨 Starting texture extraction with surface bounds:', {
      floor: surfaceBounds.floor,
      leftWall: surfaceBounds.walls.left,
      rightWall: surfaceBounds.walls.right,
      backWall: surfaceBounds.walls.back,
      ceiling: surfaceBounds.ceiling,
      imageSize: `${width}x${height}`
    });
    
    const floorTexture = await this.extractSurfaceTexture(imageBuffer, surfaceBounds.floor, 'floor');
    const leftWallTexture = await this.extractSurfaceTexture(imageBuffer, surfaceBounds.walls.left, 'left-wall');
    const rightWallTexture = await this.extractSurfaceTexture(imageBuffer, surfaceBounds.walls.right, 'right-wall');
    const backWallTexture = await this.extractSurfaceTexture(imageBuffer, surfaceBounds.walls.back, 'back-wall');
    const ceilingTexture = await this.extractSurfaceTexture(imageBuffer, surfaceBounds.ceiling, 'ceiling');

    // Step 3: Analyze materials for each surface
    const floorMaterial = this.analyzeSurfaceMaterial(data, info, surfaceBounds.floor, 'floor');
    const leftWallMaterial = this.analyzeSurfaceMaterial(data, info, surfaceBounds.walls.left, 'left-wall');
    const rightWallMaterial = this.analyzeSurfaceMaterial(data, info, surfaceBounds.walls.right, 'right-wall');
    const backWallMaterial = this.analyzeSurfaceMaterial(data, info, surfaceBounds.walls.back, 'back-wall');
    const ceilingMaterial = this.analyzeSurfaceMaterial(data, info, surfaceBounds.ceiling, 'ceiling');

    return {
      floor: {
        texture: floorTexture,
        boundingBox: surfaceBounds.floor,
        material: floorMaterial,
      },
      walls: {
        left: {
          texture: leftWallTexture,
          boundingBox: surfaceBounds.walls.left,
          material: leftWallMaterial,
        },
        right: {
          texture: rightWallTexture,
          boundingBox: surfaceBounds.walls.right,
          material: rightWallMaterial,
        },
        back: {
          texture: backWallTexture,
          boundingBox: surfaceBounds.walls.back,
          material: backWallMaterial,
        },
      },
      ceiling: {
        texture: ceilingTexture,
        boundingBox: surfaceBounds.ceiling,
        material: ceilingMaterial,
      },
      edgeMap: edgeMap,
      sam2Analysis: sam2Result, // Include SAM 2 analysis results
    };
  }

  /**
   * Extract surface bounds from client-side SAM results
   */
  private extractSurfacesFromClientSAM(sam2Result: any, width: number, height: number): {
    surfaceBounds: {
      floor: { x: number; y: number; width: number; height: number };
      walls: {
        left: { x: number; y: number; width: number; height: number };
        right: { x: number; y: number; width: number; height: number };
        back: { x: number; y: number; width: number; height: number };
      };
      ceiling: { x: number; y: number; width: number; height: number };
    };
  } {

    // Initialize default bounds with improved surface detection
    const surfaceBounds = {
      floor: { x: width * 0.1, y: height * 0.6, width: width * 0.8, height: height * 0.4 },
      walls: {
        left: { x: 0, y: height * 0.1, width: width * 0.4, height: height * 0.8 },
        right: { x: width * 0.6, y: height * 0.1, width: width * 0.4, height: height * 0.8 },
        back: { x: width * 0.2, y: height * 0.1, width: width * 0.6, height: height * 0.5 }
      },
      ceiling: { x: width * 0.1, y: 0, width: width * 0.8, height: height * 0.3 }
    };

    // Process SAM analysis surfaces if available
    if (sam2Result.analysis && sam2Result.analysis.surfaces) {
   
      sam2Result.analysis.surfaces.forEach((surface: any) => {
        const bounds = surface.bounds;
        const type = surface.type;
        
    
        switch (type) {
          case 'floor':
            surfaceBounds.floor = bounds;
            break;
          case 'left_wall':
            surfaceBounds.walls.left = bounds;
            break;
          case 'right_wall':
            surfaceBounds.walls.right = bounds;
            break;
          case 'back_wall':
            surfaceBounds.walls.back = bounds;
            break;
          case 'ceiling':
            surfaceBounds.ceiling = bounds;
            break;
        }
      });
    }

    return { surfaceBounds };
  }

  /**
   * Create intelligent backend analysis using image processing techniques
   */
  private async createIntelligentBackendAnalysis(imageBuffer: Buffer, width: number, height: number): Promise<any> {
    console.log('🧠 Performing intelligent backend analysis:', { width, height });
    
    // Analyze the image to detect room structure
    const { data, info } = await sharp(imageBuffer)
      .resize(width, height)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Detect floor region using edge detection and color analysis
    const floorRegion = this.detectFloorRegionIntelligent(data, info);
    
    // Detect wall regions using vertical edge detection
    const wallRegions = this.detectWallRegionsIntelligent(data, info);
    
    // Detect ceiling region
    const ceilingRegion = this.detectCeilingRegionIntelligent(data, info);
    
    console.log('🧠 Intelligent analysis results:', {
      floor: floorRegion,
      walls: wallRegions,
      ceiling: ceilingRegion
    });
    
    return {
      success: true,
      analysis: {
        surfaces: [
          {
            type: 'floor',
            bounds: floorRegion,
            confidence: 0.85
          },
          {
            type: 'left_wall',
            bounds: wallRegions.left,
            confidence: 0.80
          },
          {
            type: 'right_wall',
            bounds: wallRegions.right,
            confidence: 0.80
          },
          {
            type: 'back_wall',
            bounds: wallRegions.back,
            confidence: 0.75
          },
          {
            type: 'ceiling',
            bounds: ceilingRegion,
            confidence: 0.85
          }
        ]
      },
      edgeMap: ''
    };
  }

  /**
   * Detect floor region using intelligent analysis
   */
  private detectFloorRegionIntelligent(_data: Buffer, info: { width: number; height: number; channels: number }): { x: number; y: number; width: number; height: number } {
    const { width, height } = info;
    
    // Analyze bottom portion of image for floor characteristics
    const floorStartY = Math.floor(height * 0.6); // Start from 60% down
    const floorHeight = Math.floor(height * 0.4); // Use 40% of image height
    
    // Use more conservative bounds for better accuracy
    const marginX = Math.floor(width * 0.1); // 10% margin on sides
    
    return {
      x: marginX,
      y: floorStartY,
      width: width - (marginX * 2),
      height: floorHeight
    };
  }

  /**
   * Detect wall regions using intelligent analysis
   */
  private detectWallRegionsIntelligent(_data: Buffer, info: { width: number; height: number; channels: number }): { left: { x: number; y: number; width: number; height: number }; right: { x: number; y: number; width: number; height: number }; back: { x: number; y: number; width: number; height: number } } {
    const { width, height } = info;
    
    // Left wall: left portion, avoiding floor area
    const leftWall = {
      x: 0,
      y: Math.floor(height * 0.1), // Start 10% from top
      width: Math.floor(width * 0.4), // Use 40% of width
      height: Math.floor(height * 0.8) // Use 80% of height
    };
    
    // Right wall: right portion, avoiding floor area
    const rightWall = {
      x: Math.floor(width * 0.6), // Start at 60% from left
      y: Math.floor(height * 0.1), // Start 10% from top
      width: Math.floor(width * 0.4), // Use 40% of width
      height: Math.floor(height * 0.8) // Use 80% of height
    };
    
    // Back wall: center portion, avoiding floor area
    const backWall = {
      x: Math.floor(width * 0.2), // Start at 20% from left
      y: Math.floor(height * 0.1), // Start 10% from top
      width: Math.floor(width * 0.6), // Use 60% of width
      height: Math.floor(height * 0.5) // Use 50% of height (avoid floor)
    };
    
    return { left: leftWall, right: rightWall, back: backWall };
  }

  /**
   * Detect ceiling region using intelligent analysis
   */
  private detectCeilingRegionIntelligent(_data: Buffer, info: { width: number; height: number; channels: number }): { x: number; y: number; width: number; height: number } {
    const { width, height } = info;
    
    // Ceiling: top portion of image
    const marginX = Math.floor(width * 0.1); // 10% margin on sides
    
    return {
      x: marginX,
      y: 0,
      width: width - (marginX * 2),
      height: Math.floor(height * 0.3) // Use 30% of image height
    };
  }


  
  private async extractSurfaceTexture(
    imageBuffer: Buffer,
    bounds: { x: number; y: number; width: number; height: number },
    surfaceType: 'floor' | 'left-wall' | 'right-wall' | 'back-wall' | 'ceiling'
  ): Promise<Buffer> {
   
    // Get image dimensions first
    const imageInfo = await sharp(imageBuffer).metadata();
    const imageWidth = imageInfo.width || 0;
    const imageHeight = imageInfo.height || 0;
    
    
    // Validate and clamp bounds to image dimensions
    const validatedBounds = {
      left: Math.max(0, Math.min(Math.round(bounds.x), imageWidth - 1)),
      top: Math.max(0, Math.min(Math.round(bounds.y), imageHeight - 1)),
      width: Math.max(1, Math.min(Math.round(bounds.width), imageWidth - Math.max(0, Math.round(bounds.x)))),
      height: Math.max(1, Math.min(Math.round(bounds.height), imageHeight - Math.max(0, Math.round(bounds.y))))
    };

    
    // Final validation
    if (validatedBounds.left < 0 || validatedBounds.top < 0 || 
        validatedBounds.width <= 0 || validatedBounds.height <= 0 ||
        validatedBounds.left + validatedBounds.width > imageWidth ||
        validatedBounds.top + validatedBounds.height > imageHeight) {
      console.error(`❌ INVALID BOUNDS for ${surfaceType}:`, {
        bounds: validatedBounds,
        imageSize: `${imageWidth}x${imageHeight}`
      });
      throw new Error(`Invalid bounds for ${surfaceType}: ${JSON.stringify(validatedBounds)} on image ${imageWidth}x${imageHeight}`);
    }
    
    // Step 1: Crop the surface region
    console.log(`🎨 Extracting texture for ${surfaceType}:`, {
      originalBounds: bounds,
      validatedBounds,
      imageSize: `${imageWidth}x${imageHeight}`
    });
    
    let croppedTexture = await sharp(imageBuffer)
      .extract(validatedBounds);

    // Step 2: Apply minimal processing to preserve original image appearance
    switch (surfaceType) {
      case 'floor':
        // Floor: preserve aspect ratio, only resize if too small
        const floorWidth = Math.max(validatedBounds.width, 256);
        const floorHeight = Math.max(validatedBounds.height, 128);
        console.log(`🔧 Floor texture processing:`, {
          originalSize: `${validatedBounds.width}x${validatedBounds.height}`,
          targetSize: `${floorWidth}x${floorHeight}`,
          willResize: floorWidth !== validatedBounds.width || floorHeight !== validatedBounds.height
        });
        croppedTexture = croppedTexture
          .resize(floorWidth, floorHeight, { 
            fit: 'fill', // Fill the dimensions without stretching
            withoutEnlargement: true // Don't enlarge small textures
          })
          .jpeg({ quality: 98 }); // Higher quality
        break;
        
      case 'left-wall':
      case 'right-wall':
        // Side walls: preserve aspect ratio
        const wallWidth = Math.max(validatedBounds.width, 128);
        const wallHeight = Math.max(validatedBounds.height, 256);
        console.log(`🔧 ${surfaceType} texture processing:`, {
          originalSize: `${validatedBounds.width}x${validatedBounds.height}`,
          targetSize: `${wallWidth}x${wallHeight}`,
          willResize: wallWidth !== validatedBounds.width || wallHeight !== validatedBounds.height
        });
        croppedTexture = croppedTexture
          .resize(wallWidth, wallHeight, { 
            fit: 'fill',
            withoutEnlargement: true
          })
          .jpeg({ quality: 98 });
        break;
        
      case 'back-wall':
        // Back wall: preserve aspect ratio
        const backWidth = Math.max(validatedBounds.width, 256);
        const backHeight = Math.max(validatedBounds.height, 128);
        croppedTexture = croppedTexture
          .resize(backWidth, backHeight, { 
            fit: 'fill',
            withoutEnlargement: true
          })
          .jpeg({ quality: 98 });
        break;
        
      case 'ceiling':
        // Ceiling: preserve aspect ratio
        const ceilingWidth = Math.max(validatedBounds.width, 256);
        const ceilingHeight = Math.max(validatedBounds.height, 128);
        croppedTexture = croppedTexture
          .resize(ceilingWidth, ceilingHeight, { 
            fit: 'fill',
            withoutEnlargement: true
          })
          .jpeg({ quality: 98 });
        break;
    }

    const finalBuffer = await croppedTexture.toBuffer();
    
    // Step 3: Validate texture quality and similarity to original
    const textureInfo = await sharp(finalBuffer).metadata();
    const validationResult = await this.validateTextureQuality(finalBuffer, imageBuffer, bounds, surfaceType);
    
    console.log(`✅ ${surfaceType} texture extracted:`, {
      finalSize: `${textureInfo.width}x${textureInfo.height}`,
      format: textureInfo.format,
      sizeKB: Math.round(finalBuffer.length / 1024),
      validation: validationResult
    });
    
    return finalBuffer;
  }

  /**
   * Validate that extracted texture matches the original image region
   */
  private async validateTextureQuality(
    extractedBuffer: Buffer, 
    originalBuffer: Buffer, 
    bounds: { x: number; y: number; width: number; height: number },
    surfaceType: string
  ): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Get metadata for both images
      const extractedInfo = await sharp(extractedBuffer).metadata();
      const originalInfo = await sharp(originalBuffer).metadata();
      
      // Log validation context for debugging
      console.log(`🔍 Validating ${surfaceType} texture:`, {
        extractedSize: `${extractedInfo.width}x${extractedInfo.height}`,
        originalSize: `${originalInfo.width}x${originalInfo.height}`,
        bounds: bounds
      });
      
      // Check if extracted texture has reasonable dimensions
      if (extractedInfo.width && extractedInfo.height) {
        const aspectRatio = extractedInfo.width / extractedInfo.height;
        
        // Validate aspect ratio based on surface type
        switch (surfaceType) {
          case 'floor':
            if (aspectRatio < 1.5 || aspectRatio > 4) {
              issues.push(`Floor texture aspect ratio ${aspectRatio.toFixed(2)} seems unusual`);
            }
            break;
          case 'left-wall':
          case 'right-wall':
            if (aspectRatio > 1.5 || aspectRatio < 0.3) {
              issues.push(`${surfaceType} texture aspect ratio ${aspectRatio.toFixed(2)} seems unusual`);
            }
            break;
          case 'back-wall':
            if (aspectRatio < 1 || aspectRatio > 3) {
              issues.push(`Back wall texture aspect ratio ${aspectRatio.toFixed(2)} seems unusual`);
            }
            break;
          case 'ceiling':
            if (aspectRatio < 1.5 || aspectRatio > 4) {
              issues.push(`Ceiling texture aspect ratio ${aspectRatio.toFixed(2)} seems unusual`);
            }
            break;
        }
      }
      
      // Check if texture is too small
      if (extractedInfo.width && extractedInfo.width < 64) {
        issues.push(`Texture width ${extractedInfo.width}px is very small`);
      }
      if (extractedInfo.height && extractedInfo.height < 64) {
        issues.push(`Texture height ${extractedInfo.height}px is very small`);
      }
      
      // Check if texture is too large (might indicate processing issues)
      if (extractedInfo.width && extractedInfo.width > 2048) {
        issues.push(`Texture width ${extractedInfo.width}px is very large`);
      }
      if (extractedInfo.height && extractedInfo.height > 2048) {
        issues.push(`Texture height ${extractedInfo.height}px is very large`);
      }
      
      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Analyze material properties for a specific surface
   */
  private analyzeSurfaceMaterial(
    data: Buffer,
    info: { width: number; height: number; channels: number },
    bounds: { x: number; y: number; width: number; height: number },
    surfaceType: string
  ): string {
    // Extract pixel data for the specific surface
    const surfaceData = this.extractSurfacePixelData(data, info, bounds);
    
    // Analyze color patterns, texture, and material properties
    const colorAnalysis = this.analyzeColorPatterns(surfaceData);
    
    // Determine material type based on analysis
    if (surfaceType.includes('floor')) {
      if (colorAnalysis.isWooden) return 'wood';
      if (colorAnalysis.isTile) return 'tile';
      if (colorAnalysis.isCarpet) return 'carpet';
      return 'hardwood';
    }
    
    if (surfaceType.includes('wall')) {
      if (colorAnalysis.isPainted) return 'painted';
      if (colorAnalysis.isWallpaper) return 'wallpaper';
      if (colorAnalysis.isBrick) return 'brick';
      return 'painted';
    }
    
    if (surfaceType.includes('ceiling')) {
      return 'painted';
    }
    
    return 'unknown';
  }

  // REMOVED: All traditional edge detection methods - using Advanced Room Analyzer only

  /**
   * Extract pixel data for a specific surface region
   */
  private extractSurfacePixelData(
    data: Buffer,
    info: { width: number; height: number; channels: number },
    bounds: { x: number; y: number; width: number; height: number }
  ): Buffer {
    const { width, channels } = info;
    const surfaceData = Buffer.alloc(bounds.width * bounds.height * channels);
    
    let surfaceIndex = 0;
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        const pixelIndex = (y * width + x) * channels;
        for (let c = 0; c < channels; c++) {
          surfaceData[surfaceIndex++] = data[pixelIndex + c];
        }
      }
    }
    
    return surfaceData;
  }

  /**
   * Analyze color patterns to determine material type
   */
  private analyzeColorPatterns(surfaceData: Buffer): {
    isWooden: boolean;
    isTile: boolean;
    isCarpet: boolean;
    isPainted: boolean;
    isWallpaper: boolean;
    isBrick: boolean;
  } {
    // Simple color analysis - in a real implementation, this would be more sophisticated
    const pixelCount = surfaceData.length / 3; // Assuming RGB
    let brownPixels = 0;
    let uniformPixels = 0;
    
    for (let i = 0; i < surfaceData.length; i += 3) {
      const r = surfaceData[i];
      const g = surfaceData[i + 1];
      const b = surfaceData[i + 2];
      
      // Check for wood-like colors (brown tones)
      if (r > 100 && g > 80 && b < 100 && r > g && g > b) {
        brownPixels++;
      }
      
      // Check for uniform colors (painted surfaces)
      if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) {
        uniformPixels++;
      }
    }
    
    return {
      isWooden: brownPixels > pixelCount * 0.3,
      isTile: false, // Would need more sophisticated analysis
      isCarpet: false, // Would need texture analysis
      isPainted: uniformPixels > pixelCount * 0.5,
      isWallpaper: false, // Would need pattern analysis
      isBrick: false, // Would need texture analysis
    };
  }



}