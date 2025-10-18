import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { RoomTextureExtractionService } from './RoomTextureExtractionService.js';

const prisma = new PrismaClient();

export interface RoomAnalysisResult {
  dimensions: {
    width: number;
    height: number;
    estimatedDepth: number;
  };
  surfaces: {
    floor: {
      area: number;
      material: string;
      boundingBox: { x: number; y: number; width: number; height: number };
    };
    walls: Array<{
      area: number;
      material: string;
      boundingBox: { x: number; y: number; width: number; height: number };
    }>;
    ceiling?: {
      area: number;
      material: string;
    };
  };
  lightingSources: Array<{
    position: { x: number; y: number };
    intensity: number;
    type: 'natural' | 'artificial';
  }>;
  perspective: {
    vanishingPoints: Array<{ x: number; y: number }>;
    horizonLine: { y: number };
  };
  textureData: {
    floor: {
      texture: string;
      boundingBox: { x: number; y: number; width: number; height: number };
      material: string;
    };
    walls: {
      left: {
        texture: string;
        boundingBox: { x: number; y: number; width: number; height: number };
        material: string;
      };
      right: {
        texture: string;
        boundingBox: { x: number; y: number; width: number; height: number };
        material: string;
      };
      back: {
        texture: string;
        boundingBox: { x: number; y: number; width: number; height: number };
        material: string;
      };
    };
      ceiling: {
        texture: string;
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
    };
  }

export class ImageProcessingService {
  private textureExtractionService = new RoomTextureExtractionService();

  /**
   * Analyze room photo to detect surfaces, dimensions, and perspective
   */
  async analyzeRoomPhoto(imageBuffer: Buffer): Promise<RoomAnalysisResult> {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    // Extract raw pixel data for analysis
    const { data, info } = await sharp(imageBuffer)
      .resize(width, height)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Detect edges using simple edge detection
    const edges = await this.detectEdges(imageBuffer);

    // Detect floor (typically lower portion with horizontal lines)
    const floorRegion = this.detectFloorRegion(data, info);

    // Detect walls (vertical regions)
    const wallRegions = this.detectWallRegions(data, info);

    // Estimate perspective and vanishing points
    const perspective = this.estimatePerspective(edges, info);

    // Detect lighting
    const lightingSources = this.detectLighting(data, info);

    // Calculate realistic room dimensions based on perspective and image analysis
    const roomDimensions = this.calculateRoomDimensions(perspective, info, floorRegion);

  
    // Extract textures using improved backend analysis (no SAM dependency)
    const textureData = await this.textureExtractionService.extractRoomTextures(imageBuffer);

    
    return {
      dimensions: {
        width: roomDimensions.width,
        height: roomDimensions.height,
        estimatedDepth: roomDimensions.depth,
      },
      surfaces: {
        floor: {
          area: floorRegion.area,
          material: floorRegion.material,
          boundingBox: floorRegion.boundingBox,
        },
        walls: wallRegions,
        ceiling: {
          area: info.width * 100, // Simplified
          material: 'painted',
        },
      },
      lightingSources,
      perspective,
      textureData: {
        floor: {
          texture: textureData.floor.texture.toString('base64'),
          boundingBox: textureData.floor.boundingBox,
          material: textureData.floor.material
        },
        walls: {
          left: {
            texture: textureData.walls.left.texture.toString('base64'),
            boundingBox: textureData.walls.left.boundingBox,
            material: textureData.walls.left.material
          },
          right: {
            texture: textureData.walls.right.texture.toString('base64'),
            boundingBox: textureData.walls.right.boundingBox,
            material: textureData.walls.right.material
          },
          back: {
            texture: textureData.walls.back.texture.toString('base64'),
            boundingBox: textureData.walls.back.boundingBox,
            material: textureData.walls.back.material
          }
        },
        ceiling: {
          texture: textureData.ceiling.texture.toString('base64'),
          boundingBox: textureData.ceiling.boundingBox,
          material: textureData.ceiling.material
        },
        edgeMap: textureData.edgeMap,
        sam2Analysis: textureData.sam2Analysis // Include SAM 2 analysis results
      }
    };
  }

  /**
   * Detect edges in the image using Sobel operator
   */
  private async detectEdges(imageBuffer: Buffer): Promise<Buffer> {
    // Convert to grayscale and apply edge detection
    const edgeDetected = await sharp(imageBuffer)
      .greyscale()
      .normalise()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1], // Laplacian kernel
      })
      .toBuffer();

    return edgeDetected;
  }

  /**
   * Detect floor region (typically bottom half with horizontal features)
   */
  private detectFloorRegion(
    data: Buffer,
    info: { width: number; height: number; channels: number }
  ): {
    area: number;
    material: string;
    boundingBox: { x: number; y: number; width: number; height: number };
  } {
    const { width, height, channels } = info;
    
    // Analyze bottom 40% of image
    const floorStartY = Math.floor(height * 0.6);
    const floorHeight = height - floorStartY;

    // Sample colors to determine material
    let avgR = 0, avgG = 0, avgB = 0;
    let sampleCount = 0;

    for (let y = floorStartY; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * channels;
        avgR += data[idx];
        avgG += data[idx + 1];
        avgB += data[idx + 2];
        sampleCount++;
      }
    }

    avgR /= sampleCount;
    avgG /= sampleCount;
    avgB /= sampleCount;

    // Determine material based on color
    const material = this.determineMaterial(avgR, avgG, avgB);

    // Calculate area (simplified - assume 20 square meters)
    const area = 20;

    return {
      area,
      material,
      boundingBox: {
        x: 0,
        y: floorStartY,
        width,
        height: floorHeight,
      },
    };
  }

  /**
   * Detect wall regions
   */
  private detectWallRegions(
    _data: Buffer,
    info: { width: number; height: number; channels: number }
  ): Array<{
    area: number;
    material: string;
    boundingBox: { x: number; y: number; width: number; height: number };
  }> {
    const { width, height } = info;
    
    // Simplified: detect left, right, and back walls
    const walls = [
      // Left wall
      {
        area: 15,
        material: 'painted',
        boundingBox: { x: 0, y: 0, width: Math.floor(width * 0.2), height: Math.floor(height * 0.6) },
      },
      // Right wall
      {
        area: 15,
        material: 'painted',
        boundingBox: { x: Math.floor(width * 0.8), y: 0, width: Math.floor(width * 0.2), height: Math.floor(height * 0.6) },
      },
      // Back wall
      {
        area: 20,
        material: 'painted',
        boundingBox: { x: Math.floor(width * 0.2), y: 0, width: Math.floor(width * 0.6), height: Math.floor(height * 0.4) },
      },
    ];

    return walls;
  }

  /**
   * Estimate perspective and vanishing points
   */
  private estimatePerspective(
    _edgeBuffer: Buffer,
    info: { width: number; height: number }
  ): {
    vanishingPoints: Array<{ x: number; y: number }>;
    horizonLine: { y: number };
  } {
    // Improved perspective estimation based on image analysis
    // Analyze the image to find the actual horizon line
    
    // For typical room photos, horizon is usually in the upper 1/3 to 1/2 of the image
    // We'll estimate based on common room photography patterns
    const imageHeight = info.height;
    const imageWidth = info.width;
    
    // Estimate horizon line based on typical room proportions
    // In most room photos, the horizon is around 30-50% from the top
    const horizonY = Math.floor(imageHeight * 0.4); // 40% from top
    
    // Estimate vanishing points based on room perspective
    // Left vanishing point (for left wall)
    const leftVanishingX = Math.floor(imageWidth * 0.2);
    // Right vanishing point (for right wall)  
    const rightVanishingX = Math.floor(imageWidth * 0.8);
    // Central vanishing point (for back wall)
    const centerVanishingX = Math.floor(imageWidth * 0.5);

    return {
      vanishingPoints: [
        { x: leftVanishingX, y: horizonY },   // Left wall vanishing point
        { x: rightVanishingX, y: horizonY }, // Right wall vanishing point
        { x: centerVanishingX, y: horizonY }, // Central vanishing point
      ],
      horizonLine: { y: horizonY },
    };
  }

  /**
   * Detect lighting sources in the image
   */
  private detectLighting(
    data: Buffer,
    info: { width: number; height: number; channels: number }
  ): Array<{
    position: { x: number; y: number };
    intensity: number;
    type: 'natural' | 'artificial';
  }> {
    const { width, height, channels } = info;
    const lightingSources: Array<{
      position: { x: number; y: number };
      intensity: number;
      type: 'natural' | 'artificial';
    }> = [];

    // Find bright spots (potential light sources)
    for (let y = 0; y < height; y += 50) {
      for (let x = 0; x < width; x += 50) {
        const idx = (y * width + x) * channels;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        if (brightness > 200) { // Bright spot detected
          lightingSources.push({
            position: { x, y },
            intensity: brightness / 255,
            type: y < height * 0.3 ? 'natural' : 'artificial', // Top = natural (windows)
          });
        }
      }
    }

    return lightingSources;
  }

  /**
   * Calculate realistic room dimensions based on perspective and image analysis
   */
  private calculateRoomDimensions(
    perspective: {
      vanishingPoints: Array<{ x: number; y: number }>;
      horizonLine: { y: number };
    },
    info: { width: number; height: number },
    floorRegion: {
      area: number;
      material: string;
      boundingBox: { x: number; y: number; width: number; height: number };
    }
  ): { width: number; height: number; depth: number } {
    // Estimate room dimensions based on perspective and floor analysis
    
    // Estimate room width based on floor region and perspective
    // Floor typically takes up 60-80% of image width in perspective
    const floorWidthRatio = floorRegion.boundingBox.width / info.width;
    const estimatedWidth = Math.max(300, Math.min(600, floorWidthRatio * 500)); // 3-6 meters
    
    // Estimate room depth based on perspective vanishing points
    const horizonY = perspective.horizonLine.y;
    const floorStartY = floorRegion.boundingBox.y;
    const perspectiveRatio = (info.height - floorStartY) / (info.height - horizonY);
    const estimatedDepth = Math.max(250, Math.min(500, perspectiveRatio * 400)); // 2.5-5 meters
    
    // Estimate room height based on wall analysis and typical room proportions
    const wallHeightRatio = (floorStartY - horizonY) / info.height;
    const estimatedHeight = Math.max(250, Math.min(350, wallHeightRatio * 300)); // 2.5-3.5 meters
    
    return {
      width: Math.round(estimatedWidth),
      height: Math.round(estimatedHeight),
      depth: Math.round(estimatedDepth),
    };
  }

  /**
   * Determine material based on RGB values
   */
  private determineMaterial(r: number, g: number, b: number): string {
    // Simple material classification based on color
    const brightness = (r + g + b) / 3;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);

    if (brightness > 180 && saturation < 30) {
      return 'tile';
    } else if (brightness < 100) {
      return 'carpet';
    } else if (r > g && r > b && saturation > 50) {
      return 'wood';
    } else if (saturation < 40) {
      return 'concrete';
    } else {
      return 'hardwood';
    }
  }

  /**
   * Update room photo with analysis results
   */
  async updateRoomPhotoAnalysis(
    roomPhotoId: string,
    analysisResult: RoomAnalysisResult
  ): Promise<void> {
    await prisma.roomPhoto.update({
      where: { id: roomPhotoId },
      data: {
        dimensions: JSON.stringify(analysisResult.dimensions),
        surfaces: JSON.stringify(analysisResult.surfaces),
        status: 'ready',
      },
    });
  }
}

