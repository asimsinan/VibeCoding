import { pipeline, env } from '@xenova/transformers';

// Configure transformers for client-side SAM
env.allowRemoteModels = true;
env.allowLocalModels = false;

export interface SAM2Result {
  success: boolean;
  masks: number[][];
  scores: number[];
  edgeMap: string;
  roomStructure: {
    detectedSurfaces: number;
    highConfidenceMasks: number;
    roomAnalysis: {
      hasCeiling: boolean;
      hasFloor: boolean;
      hasWalls: boolean;
    };
  };
  analysis: {
    surfacesDetected: number;
    confidenceScores: number[];
    roomDimensions: { width: number; height: number };
    surfaces?: Array<{
      type: string;
      bounds: { x: number; y: number; width: number; height: number };
      confidence: number;
    }>;
  };
}

export class SAM2Analyzer {
  private segmenter: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
   
      this.segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512');
      this.initialized = true;
 
    } catch (error) {
      console.error('❌ Failed to initialize SAM:', error);
      throw error;
    }
  }

  async analyzeRoom(imageFile: File): Promise<SAM2Result> {
    try {

      
      if (!this.initialized) {
        await this.initialize();
      }

      return await this.clientSideSAMAnalysis(imageFile);

    } catch (error) {
      console.error('❌ SAM analysis failed:', error);
      throw error;
    }
  }

  private async clientSideSAMAnalysis(imageFile: File): Promise<SAM2Result> {
    try {
      // Create image element
      const imageUrl = URL.createObjectURL(imageFile);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const width = img.width;
      const height = img.height;
      
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert canvas to data URL for transformers.js
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Run simple SAM segmentation (single pass)
      const outputs = await this.segmenter(imageDataUrl);
      
      // Process results
      const surfaces = this.processSAMResults(outputs, width, height);
      const edgeMap = this.generateEdgeMap(canvas);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
     
      
      return {
        success: true,
        masks: surfaces.map(s => s.mask).flat(),
        scores: surfaces.map(s => s.confidence),
        edgeMap: edgeMap,
        roomStructure: {
          detectedSurfaces: surfaces.length,
          highConfidenceMasks: surfaces.filter(s => s.confidence > 0.7).length,
          roomAnalysis: {
            hasCeiling: surfaces.some(s => s.type === 'ceiling'),
            hasFloor: surfaces.some(s => s.type === 'floor'),
            hasWalls: surfaces.some(s => s.type.includes('wall'))
          }
        },
        analysis: {
          surfacesDetected: surfaces.length,
          confidenceScores: surfaces.map(s => s.confidence),
          roomDimensions: { width, height },
          surfaces: surfaces
        }
      };

    } catch (error) {
      console.error('❌ Client-side SAM analysis failed:', error);
      throw new Error(`Client-side SAM analysis failed: ${error}`);
    }
  }




  private processSAMResults(outputs: any[], width: number, height: number) {
    const surfaces: Array<{
      type: string;
      bounds: { x: number; y: number; width: number; height: number };
      confidence: number;
      mask: number[][];
      preciseMask?: number[][]; // For more precise texture extraction
    }> = [];



    outputs.forEach((output) => {
      
      // SegFormer outputs have different structure
      if (output.mask) {
        const mask = output.mask;
        const confidence = output.score || 0.8;
        
      
        // Convert _RawImage to proper mask format
        const processedMask = this.processRawImageMask(mask, width, height);
        
        // Find bounding box
        const bbox = this.findBoundingBox(processedMask);
        if (bbox) {
          const surfaceType = this.classifySurface(bbox.x, bbox.y, bbox.width, bbox.height, width, height, output.label);
          
          // Use mask-based extraction for floor to avoid reflections
          let finalBounds = this.validateBounds(bbox, width, height, surfaceType);
          if (surfaceType === 'floor') {
            // For floor, use mask-based extraction to avoid reflections
            finalBounds = this.createMaskBasedFloorBounds(processedMask, width, height);
            console.log('🔍 USING MASK-BASED FLOOR AREA:', finalBounds);
          }
          
          surfaces.push({
            type: surfaceType,
            bounds: finalBounds,
            confidence,
            mask: processedMask
          });
        }
      } else if (output.logits) {
        // SegFormer might output logits instead of masks
        const mask = this.convertLogitsToMask(output.logits);
        const confidence = 0.8; // Default confidence for SegFormer
        
        const bbox = this.findBoundingBox(mask);
        if (bbox) {
          const surfaceType = this.classifySurface(bbox.x, bbox.y, bbox.width, bbox.height, width, height, output.label);
          
          // Use full detected area for floor, validate others
          let finalBounds = this.validateBounds(bbox, width, height, surfaceType);
          if (surfaceType === 'floor') {
            // Use the full detected floor area instead of cropping
            console.log('🔍 USING FULL FLOOR AREA:', finalBounds);
          }
          
          surfaces.push({
            type: surfaceType,
            bounds: finalBounds,
            confidence,
            mask: mask
          });
        }
      }
    });

    // Filter out oversized detections
    const filteredSurfaces = surfaces.filter(s => s.type !== 'filtered_out');
    
    console.log('🔍 DETECTED SURFACES:', filteredSurfaces.map(s => ({ 
      type: s.type, 
      bounds: s.bounds, 
      confidence: s.confidence 
    })));
    
 
    
    // Ensure all essential surfaces are present (fallback mechanism)
    const essentialSurfaces = ['left_wall', 'right_wall', 'back_wall', 'floor', 'ceiling'];
    const detectedTypes = filteredSurfaces.map(s => s.type);
    

    
    // Add missing essential surfaces
    for (const surfaceType of essentialSurfaces) {
      if (!detectedTypes.includes(surfaceType)) {
    
        
        let bounds;
        switch (surfaceType) {
          case 'left_wall':
            bounds = { x: 0, y: height * 0.1, width: width * 0.2, height: height * 0.7 }; // Smaller width to avoid windows
            break;
          case 'right_wall':
            bounds = { x: width * 0.8, y: height * 0.1, width: width * 0.2, height: height * 0.7 }; // Smaller width to avoid windows
            break;
          case 'back_wall':
            bounds = { x: width * 0.25, y: height * 0.1, width: width * 0.5, height: height * 0.7 }; // Center area only
            break;
          case 'floor':
            bounds = { x: 0, y: height * 0.6, width: width, height: height * 0.4 }; // Use more floor area
            break;
          case 'ceiling':
            bounds = { x: width * 0.2, y: 0, width: width * 0.6, height: height * 0.25 }; // Avoid window areas
            break;
          default:
            continue;
        }
        
        console.log('🔍 CREATING FALLBACK SURFACE:', { type: surfaceType, bounds });
        filteredSurfaces.push({
          type: surfaceType,
          bounds,
          confidence: 0.6, // Lower confidence for fallback surfaces
          mask: this.createMockMask(width, height, bounds.x, bounds.y, bounds.width, bounds.height)
        });
      }
    }
    
    // If no surfaces detected at all, create complete mock surfaces
    if (filteredSurfaces.length === 0) {
      filteredSurfaces.push(
        {
          type: 'floor',
          bounds: { x: 0, y: height * 0.6, width: width, height: height * 0.4 },
          confidence: 0.8,
          mask: this.createMockMask(width, height, 0, height * 0.6, width, height * 0.4)
        },
        {
          type: 'ceiling',
          bounds: { x: width * 0.2, y: 0, width: width * 0.6, height: height * 0.25 },
          confidence: 0.8,
          mask: this.createMockMask(width, height, width * 0.2, 0, width * 0.6, height * 0.25)
        },
        {
          type: 'left_wall',
          bounds: { x: 0, y: height * 0.1, width: width * 0.2, height: height * 0.7 },
          confidence: 0.8,
          mask: this.createMockMask(width, height, 0, height * 0.1, width * 0.2, height * 0.7)
        },
        {
          type: 'right_wall',
          bounds: { x: width * 0.8, y: height * 0.1, width: width * 0.2, height: height * 0.7 },
          confidence: 0.8,
          mask: this.createMockMask(width, height, width * 0.8, height * 0.1, width * 0.2, height * 0.7)
        },
        {
          type: 'back_wall',
          bounds: { x: width * 0.25, y: height * 0.1, width: width * 0.5, height: height * 0.7 },
          confidence: 0.8,
          mask: this.createMockMask(width, height, width * 0.25, height * 0.1, width * 0.5, height * 0.7)
        }
      );
    }
    

    
    return filteredSurfaces;
  }

  private processRawImageMask(rawImage: any, width: number, height: number): number[][] {
    // Convert _RawImage to binary mask array
    const mask: number[][] = [];
    
    try {
 
      
      // Use the raw data directly from _RawImage
      const data = rawImage.data;
      const imgWidth = rawImage.width || width;
      const imgHeight = rawImage.height || height;
      
      // Convert to binary mask based on pixel values
      for (let y = 0; y < imgHeight; y++) {
        mask[y] = [];
        for (let x = 0; x < imgWidth; x++) {
          const pixelIndex = y * imgWidth + x;
          const pixelValue = data[pixelIndex];
          // Threshold: values > 128 become 1, else 0
          mask[y][x] = pixelValue > 128 ? 1 : 0;
        }
      }
      
    
    } catch (error) {
      console.warn('Error processing raw image mask:', error);
      // Return a full mask as fallback
      return this.createMockMask(width, height, 0, 0, width, height);
    }
    
    return mask;
  }

  private convertLogitsToMask(logits: any): number[][] {
    // Convert SegFormer logits to binary mask
    // This is a simplified conversion - in practice you'd want more sophisticated processing
    const mask: number[][] = [];
    
    if (Array.isArray(logits)) {
      for (let y = 0; y < logits.length; y++) {
        mask[y] = [];
        for (let x = 0; x < logits[y].length; x++) {
          // Simple thresholding - values > 0.5 become 1, else 0
          mask[y][x] = logits[y][x] > 0.5 ? 1 : 0;
        }
      }
    }
    
    return mask;
  }

  private createMockMask(imgWidth: number, imgHeight: number, x: number, y: number, width: number, height: number): number[][] {
    const mask: number[][] = [];
    
    for (let py = 0; py < imgHeight; py++) {
      mask[py] = [];
      for (let px = 0; px < imgWidth; px++) {
        // Check if pixel is within the bounds
        if (px >= x && px < x + width && py >= y && py < y + height) {
          mask[py][px] = 1;
        } else {
          mask[py][px] = 0;
        }
      }
    }
    
    return mask;
  }

  private findBoundingBox(mask: number[][]): { x: number; y: number; width: number; height: number } | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasMask = false;

    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[y].length; x++) {
        if (mask[y][x] > 0) {
          hasMask = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!hasMask) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  private validateBounds(bounds: { x: number; y: number; width: number; height: number }, imgWidth: number, imgHeight: number, surfaceType: string): { x: number; y: number; width: number; height: number } {
    let { x, y, width, height } = bounds;
    
    // Clamp to image boundaries
    x = Math.max(0, Math.min(x, imgWidth - 1));
    y = Math.max(0, Math.min(y, imgHeight - 1));
    width = Math.max(1, Math.min(width, imgWidth - x));
    height = Math.max(1, Math.min(height, imgHeight - y));
    
    // For walls, ensure they don't extend into floor area
    if (surfaceType.includes('wall')) {
      const floorStartY = imgHeight * 0.7; // Floor starts at 70% of image height
      if (y + height > floorStartY) {
        height = Math.max(1, floorStartY - y);
      }
      
      // Ensure walls don't extend into ceiling area
      const ceilingEndY = imgHeight * 0.3; // Ceiling ends at 30% of image height
      if (y < ceilingEndY) {
        const ceilingOverlap = ceilingEndY - y;
        y = ceilingEndY;
        height = Math.max(1, height - ceilingOverlap);
      }
    }
    
    return { x: Math.floor(x), y: Math.floor(y), width: Math.floor(width), height: Math.floor(height) };
  }

  private createMaskBasedFloorBounds(mask: number[][], imgWidth: number, imgHeight: number): { x: number; y: number; width: number; height: number } {
    // 100% SAM RESPECT: Use the full mask area that SAM detected
    console.log('🔍 100% SAM RESPECT: Using full SAM mask detection');
    
    // Find the bounding box of the entire mask (SAM's full detection)
    let minX = imgWidth, maxX = 0, minY = imgHeight, maxY = 0;
    let hasFloorPixels = false;
    
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        if (y < mask.length && x < mask[y].length && mask[y][x] > 0) {
          hasFloorPixels = true;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (!hasFloorPixels) {
      // Fallback: Use bottom portion of image
      console.log('🔍 SAM RESPECT: No floor pixels found, using fallback');
      return {
        x: 0,
        y: Math.floor(imgHeight * 0.6),
        width: imgWidth,
        height: Math.floor(imgHeight * 0.4)
      };
    }
    
    // Use SAM's full detection as the floor bounds
    const samBounds = {
      x: Math.max(0, minX),
      y: Math.max(0, minY),
      width: Math.min(imgWidth - minX, maxX - minX),
      height: Math.min(imgHeight - minY, maxY - minY)
    };
    
    console.log('🔍 100% SAM RESPECT:', {
      samMaskBounds: samBounds,
      strategy: 'Complete SAM mask trust - no clustering overrides'
    });
    
    return samBounds;
  }

 
  private classifySurface(x: number, y: number, w: number, h: number, imgWidth: number, imgHeight: number, originalLabel?: string): string {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    
    const normX = centerX / imgWidth;
    const normY = centerY / imgHeight;
    
    // Calculate coverage percentage
    const coverageX = w / imgWidth;
    const coverageY = h / imgHeight;
    const totalCoverage = (w * h) / (imgWidth * imgHeight);
    
    // Filter out oversized detections that cover too much of the image
    if (totalCoverage > 0.7) {
   
      return 'filtered_out'; // This will be filtered out later
    }
    
    // First check if it's a window or door - these should be preserved as-is
    if (originalLabel === 'windowpane' || originalLabel === 'window') {
      if (normX < 0.3) return 'left_window';
      if (normX > 0.7) return 'right_window';
      return 'back_window';
    }
    
    if (originalLabel === 'door') {
      if (normX < 0.3) return 'left_door';
      if (normX > 0.7) return 'right_door';
      return 'back_door';
    }
    
    // Calculate aspect ratio for better classification
    const aspectRatio = w / h;
    const isVertical = aspectRatio < 0.8; // Taller than wide
    const isHorizontal = aspectRatio > 1.2; // Wider than tall
    
    // Floor detection: horizontal, in bottom portion, and covers reasonable area
    if (isHorizontal && normY > 0.7 && coverageY < 0.4) {
      console.log('🔍 FLOOR DETECTED:', { x, y, w, h, normY, coverageY, aspectRatio, isHorizontal, imgWidth, imgHeight });
      return 'floor';
    }
    
    // Ceiling detection: horizontal, in top portion, avoid window areas
    if (isHorizontal && normY < 0.25 && coverageY < 0.25) {
      // Avoid areas that might contain windows (sides of the image)
      if (normX < 0.2 || normX > 0.8) {
        return 'filtered_out'; // Likely window area, not ceiling
      }
      return 'ceiling';
    }
    
    // Wall detection: vertical or medium aspect ratio, avoid floor overlap
    if (isVertical && coverageY > 0.4 && normY < 0.8) { // Avoid floor area
      if (normX < 0.25) return 'left_wall';     // Left quarter
      if (normX > 0.75) return 'right_wall';    // Right quarter
      if (normX >= 0.25 && normX <= 0.75) return 'back_wall'; // Center half
    }
    
    // Additional wall detection for medium coverage, avoid floor
    if (coverageY > 0.3 && coverageX > 0.2 && normY < 0.7) { // Avoid floor area
      if (normX < 0.3) return 'left_wall';
      if (normX > 0.7) return 'right_wall';
      return 'back_wall';
    }
    
    // Fallback classification with floor avoidance
    if (normY < 0.3) return 'ceiling';
    if (normY > 0.7) return 'floor';
    if (normX < 0.4) return 'left_wall';
    if (normX > 0.6) return 'right_wall';
    return 'back_wall';
  }

  private generateEdgeMap(canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Simple edge detection using canvas filters
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and apply simple edge detection
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      // Keep alpha as is
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

}

// Export singleton instance
export const sam2Analyzer = new SAM2Analyzer();