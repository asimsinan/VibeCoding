import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Loading } from './Loading';
import { sam2Analyzer } from '../lib/sam2Analyzer';



const cropFloorFromWall = (bounds: { x: number; y: number; width: number; height: number }, wallType: string, _imgWidth: number, imgHeight: number, floorBounds?: { x: number; y: number; width: number; height: number }, ceilingBounds?: { x: number; y: number; width: number; height: number }) => {
  // SAM-AWARE SURFACE CROPPING: Use actual SAM detection for all surfaces
  console.log('🔍 SAM-AWARE SURFACE CROPPING: Cropping from', wallType);
  
  let surfaceOnlyBounds = { ...bounds };
  
  // Use SAM's actual floor detection if available, otherwise fallback to percentage
  const floorStartY = floorBounds ? floorBounds.y : imgHeight * 0.7;
  const ceilingEndY = ceilingBounds ? ceilingBounds.y + ceilingBounds.height : imgHeight * 0.3;
  
  console.log('🔍 SAM-AWARE CROPPING:', {
    wallType,
    samFloorStartY: floorBounds?.y,
    samCeilingEndY: ceilingBounds ? ceilingBounds.y + ceilingBounds.height : undefined,
    fallbackFloorStartY: imgHeight * 0.7,
    fallbackCeilingEndY: imgHeight * 0.3,
    actualFloorStartY: floorStartY,
    actualCeilingEndY: ceilingEndY,
    surfaceBounds: bounds
  });
  
  // For walls, crop out the bottom portion that contains floor
  if (wallType.includes('wall')) {
    // Calculate how much of the wall bounds overlaps with SAM-detected floor area
    const wallBottomY = bounds.y + bounds.height;
    const floorOverlap = Math.max(0, wallBottomY - floorStartY);
    
    if (floorOverlap > 0) {
      // Reduce height to exclude floor area
      surfaceOnlyBounds.height = Math.max(50, bounds.height - floorOverlap);
      console.log('🔍 SAM-AWARE WALL CROPPING:', {
        wallType,
        originalHeight: bounds.height,
        floorOverlap,
        newHeight: surfaceOnlyBounds.height,
        samFloorStartY: floorStartY,
        wallBottomY
      });
    }
  }
  
  // For ceiling, crop out any floor area that might have bled in
  if (wallType === 'ceiling') {
    // Ceiling should be in top portion, crop out any bottom area
    const ceilingMaxHeight = floorStartY * 0.8; // Ceiling shouldn't go below 80% of floor start
    if (bounds.y + bounds.height > ceilingMaxHeight) {
      surfaceOnlyBounds.height = Math.max(50, ceilingMaxHeight - bounds.y);
      console.log('🔍 SAM-AWARE CEILING CROPPING:', {
        originalHeight: bounds.height,
        ceilingMaxHeight,
        newHeight: surfaceOnlyBounds.height,
        samFloorStartY: floorStartY
      });
    }
  }
  
  // For windows and doors, crop out floor and ceiling areas more conservatively
  if (wallType.includes('window') || wallType.includes('door')) {
    // Crop out floor area more conservatively
    const wallBottomY = bounds.y + bounds.height;
    const floorOverlap = Math.max(0, wallBottomY - floorStartY);
    
    if (floorOverlap > 0) {
      // Only crop if there's significant overlap (more than 20% of window height)
      const overlapRatio = floorOverlap / bounds.height;
      if (overlapRatio > 0.2) {
        surfaceOnlyBounds.height = Math.max(bounds.height * 0.6, bounds.height - floorOverlap);
      }
    }
    
    // Crop out ceiling area more conservatively
    const ceilingOverlap = Math.max(0, ceilingEndY - bounds.y);
    if (ceilingOverlap > 0) {
      // Only crop if there's significant overlap (more than 20% of window height)
      const overlapRatio = ceilingOverlap / bounds.height;
      if (overlapRatio > 0.2) {
        surfaceOnlyBounds.y = ceilingEndY;
        surfaceOnlyBounds.height = Math.max(bounds.height * 0.6, surfaceOnlyBounds.height - ceilingOverlap);
      }
    }
    
    console.log('🔍 CONSERVATIVE WINDOW/DOOR CROPPING:', {
      wallType,
      originalBounds: bounds,
      croppedBounds: surfaceOnlyBounds,
      floorOverlap,
      ceilingOverlap,
      floorOverlapRatio: floorOverlap / bounds.height,
      ceilingOverlapRatio: ceilingOverlap / bounds.height,
      strategy: 'Conservative cropping to preserve window visibility'
    });
  }
  
  return surfaceOnlyBounds;
};


interface RoomPhotoUploadProps {
  onPhotoUploaded: (photoUrl: string, photoId: string | null, analysis?: any) => void;
  initialPhotoUrl?: string | null;
}

export function RoomPhotoUploadWithProcessing({ onPhotoUploaded, initialPhotoUrl }: RoomPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const hasAnalyzedRef = useRef(false); // Track if analysis has been completed

  // Auto-start analysis when in edit mode (initialPhotoUrl provided)
  useEffect(() => {
    if (initialPhotoUrl && !analyzing && !uploading && !hasAnalyzedRef.current) {
      console.log('🎯 EDIT MODE: Auto-starting analysis for existing photo');
      setAnalyzing(true);
      hasAnalyzedRef.current = true; // Mark as started
      startAnalysisFromUrl(initialPhotoUrl);
    }
    
    // Cleanup function to reset analysis flag when component unmounts
    return () => {
      hasAnalyzedRef.current = false;
    };
  }, [initialPhotoUrl]); // Only depend on initialPhotoUrl to prevent infinite loop

  // Function to start analysis from existing photo URL (edit mode)
  const startAnalysisFromUrl = async (photoUrl: string) => {
    try {
      console.log('🎯 Starting analysis from existing photo URL');
      
      // Convert data URL to File object for SAM analysis
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'existing-photo.jpg', { type: blob.type });
      
      // Perform SAM analysis on the existing photo
      const sam2Result = await sam2Analyzer.analyzeRoom(file);
      const textureData = await extractTexturesFromSAM(file, sam2Result);
      
      const analysisData = {
        analysis: {
          dimensions: {
            width: 4.0,
            height: 2.5,
            depth: 3.0
          },
          textureData: textureData,
          sam2Analysis: sam2Result
        }
      };
      
      console.log('✅ EDIT MODE: Analysis completed for existing photo');
      
      // Call the callback with analysis results
      onPhotoUploaded(photoUrl, null, {
        textureData: analysisData.analysis.textureData,
        dimensions: analysisData.analysis.dimensions,
        sam2Analysis: sam2Result
      });
      
      setAnalyzing(false);
    } catch (error) {
      console.error('❌ EDIT MODE: Analysis failed:', error);
      setError('Failed to analyze existing photo: ' + (error as Error).message);
      setAnalyzing(false);
    }
  };

  const extractTexturesFromSAM = async (file: File, sam2Result: any) => {
    let imageUrl: string;
    try {
    
      
      // Create image element
      imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const width = img.width;
      const height = img.height;
      
      // Create canvas for texture extraction
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Preserve color accuracy in original canvas
      ctx.imageSmoothingEnabled = false; // Disable smoothing to preserve pixel-perfect colors
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0);
      
      // Initialize texture data structure
      const textureData = {
        floor: { texture: '', boundingBox: { x: 0, y: height * 0.7, width: width, height: height * 0.3 }, material: 'wood' },
        walls: {
          left: { texture: '', boundingBox: { x: 0, y: 0, width: width * 0.3, height: height }, material: 'painted' },
          right: { texture: '', boundingBox: { x: width * 0.7, y: 0, width: width * 0.3, height: height }, material: 'painted' },
          back: { texture: '', boundingBox: { x: width * 0.3, y: 0, width: width * 0.4, height: height }, material: 'painted' }
        },
        ceiling: { texture: '', boundingBox: { x: 0, y: 0, width: width, height: height * 0.3 }, material: 'painted' },
        edgeMap: sam2Result.edgeMap,
        sam2Analysis: sam2Result
      };

      // Extract textures for each detected surface
      if (sam2Result.analysis && sam2Result.analysis.surfaces) {
      
        // Use SAM detection with artificial wall creation
        const surfaces = sam2Result.analysis.surfaces;
   
    
  
        
     
        
        // Check for overlapping bounds
        const wallSurfaces = surfaces.filter((s: any) => s.type.includes('wall'));
        for (let i = 0; i < wallSurfaces.length; i++) {
          for (let j = i + 1; j < wallSurfaces.length; j++) {
            const wall1 = wallSurfaces[i];
            const wall2 = wallSurfaces[j];
            const overlap = !(wall1.bounds.x + wall1.bounds.width <= wall2.bounds.x || 
                            wall2.bounds.x + wall2.bounds.width <= wall1.bounds.x);
            if (overlap) {
              console.warn(`⚠️ Overlapping wall bounds detected: ${wall1.type} and ${wall2.type}`);
            }
          }
        }

        
        // First pass: Find floor and ceiling bounds for SAM-aware cropping
        let floorBounds: { x: number; y: number; width: number; height: number } | undefined;
        let ceilingBounds: { x: number; y: number; width: number; height: number } | undefined;
        
        for (const surface of surfaces) {
          if (surface.type === 'floor') {
            floorBounds = surface.bounds;
            console.log('🔍 FOUND FLOOR BOUNDS FOR SAM-AWARE CROPPING:', floorBounds);
          } else if (surface.type === 'ceiling') {
            ceilingBounds = surface.bounds;
            console.log('🔍 FOUND CEILING BOUNDS FOR SAM-AWARE CROPPING:', ceilingBounds);
          }
        }
        
        // Second pass: Extract textures using SAM-aware cropping
        for (const surface of surfaces) {
          const bounds = surface.bounds;
          const type = surface.type;
          
      
          
          // Validate bounds
          if (bounds.x < 0 || bounds.y < 0 || bounds.width <= 0 || bounds.height <= 0) {
            console.warn(`⚠️ Invalid bounds for ${type}:`, bounds);
            return;
          }
          
          // WEIGHTED FLOOR CROPPING: Intelligent analysis to find cleanest floor areas
          let textureString = '';
          if (type === 'floor') {
            console.log('🔍 WEIGHTED FLOOR CROPPING: Using intelligent weighted analysis to find cleanest floor areas');
            
            // Create a temporary canvas to analyze the floor texture
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = bounds.width;
            tempCanvas.height = bounds.height;
            
            if (tempCtx) {
              // Draw the SAM-detected floor area
              tempCtx.drawImage(
                canvas,
                bounds.x, bounds.y, bounds.width, bounds.height,
                0, 0, bounds.width, bounds.height
              );
              
              // Analyze the floor texture using weighted approach
              const imageData = tempCtx.getImageData(0, 0, bounds.width, bounds.height);
              const data = imageData.data;
              
              // Find the cleanest horizontal strip using weighted analysis
              const stripHeight = Math.floor(bounds.height / 3); // Analyze in thirds
              let bestStripY = 0;
              let bestScore = 0;
              
              for (let stripY = 0; stripY <= bounds.height - stripHeight; stripY += Math.floor(stripHeight / 3)) {
                let totalScore = 0;
                let pixelCount = 0;
                
                // Analyze pixels in this strip with weighted scoring
                for (let y = stripY; y < stripY + stripHeight && y < bounds.height; y++) {
                  for (let x = 0; x < bounds.width; x++) {
                    const pixelIndex = (y * bounds.width + x) * 4;
                    const r = data[pixelIndex];
                    const g = data[pixelIndex + 1];
                    const b = data[pixelIndex + 2];
                    
                    // Weighted scoring system for floor quality
                    let pixelScore = 0;
                    
                    // Score based on brightness (avoid too dark or too light)
                    const brightness = (r + g + b) / 3;
                    if (brightness > 60 && brightness < 220) {
                      pixelScore += 1;
                    }
                    
                    // Score based on color variation (floor should have some variation)
                    const colorVariation = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
                    if (colorVariation > 20) {
                      pixelScore += 1;
                    }
                    
                    // Score based on edge detection (avoid sharp edges that indicate wall boundaries)
                    if (x > 0 && x < bounds.width - 1 && y > 0 && y < bounds.height - 1) {
                      const leftPixel = data[((y * bounds.width + (x - 1)) * 4)];
                      const rightPixel = data[((y * bounds.width + (x + 1)) * 4)];
                      const edgeStrength = Math.abs(r - leftPixel) + Math.abs(r - rightPixel);
                      if (edgeStrength < 50) { // Low edge strength = good floor pixel
                        pixelScore += 1;
                      }
                    }
                    
                    totalScore += pixelScore;
                    pixelCount++;
                  }
                }
                
                const avgScore = totalScore / pixelCount;
                console.log(`🔍 WEIGHTED STRIP ANALYSIS: Y=${stripY}-${stripY + stripHeight}, avgScore=${avgScore.toFixed(3)}`);
                
                if (avgScore > bestScore) {
                  bestScore = avgScore;
                  bestStripY = stripY;
                }
              }
              
              // Use the best strip, but add some margin for safety
              const safetyMargin = Math.floor(stripHeight * 0.1); // 10% safety margin
              const finalStartY = Math.max(0, bestStripY - safetyMargin);
              const finalHeight = Math.min(bounds.height - finalStartY, stripHeight + (safetyMargin * 2));
              
              console.log(`🔍 WEIGHTED FLOOR CROP: Using best strip Y=${bestStripY}, finalY=${finalStartY}, height=${finalHeight}, score=${bestScore.toFixed(3)}`);
              
              // Create final texture canvas with optimal dimensions
              const textureCanvas = document.createElement('canvas');
              const textureCtx = textureCanvas.getContext('2d');
              textureCanvas.width = bounds.width;
              textureCanvas.height = finalHeight;
              
              if (textureCtx) {
                // Draw the optimal floor area
                textureCtx.drawImage(
                  tempCanvas,
                  0, finalStartY, bounds.width, finalHeight,
                  0, 0, bounds.width, finalHeight
                );
                
                const textureBase64 = textureCanvas.toDataURL('image/png');
                textureString = textureBase64.split(',')[1];
                
                console.log('🔍 WEIGHTED FLOOR CROPPED:', {
                  originalBounds: bounds,
                  bestStripY: bestStripY,
                  finalBounds: { x: bounds.x, y: bounds.y + finalStartY, width: bounds.width, height: finalHeight },
                  textureSize: `${bounds.width}x${finalHeight}`,
                  weightedScore: bestScore,
                  strategy: 'Weighted floor cropping to find cleanest areas'
                });
              }
            }
          } else {
            // SAM-AWARE SURFACE CROPPING: Use actual floor and ceiling bounds for precise cropping
            const surfaceOnlyBounds = cropFloorFromWall(bounds, type, canvas.width, canvas.height, floorBounds, ceilingBounds);
            console.log('🔍 SAM-AWARE SURFACE EXTRACTION:', { type, originalBounds: bounds, surfaceOnlyBounds, floorBounds, ceilingBounds });
            
            const textureCanvas = document.createElement('canvas');
            const textureCtx = textureCanvas.getContext('2d');
            textureCanvas.width = surfaceOnlyBounds.width;
            textureCanvas.height = surfaceOnlyBounds.height;
            
            if (textureCtx) {
              // Preserve color space and quality
              textureCtx.imageSmoothingEnabled = false; // Disable smoothing to preserve pixel-perfect colors
              textureCtx.imageSmoothingQuality = 'high';
              
              textureCtx.drawImage(
                canvas,
                surfaceOnlyBounds.x, surfaceOnlyBounds.y, surfaceOnlyBounds.width, surfaceOnlyBounds.height,
                0, 0, surfaceOnlyBounds.width, surfaceOnlyBounds.height
              );
              
              // Use PNG format to preserve colors better, with maximum quality
              const textureBase64 = textureCanvas.toDataURL('image/png');
              textureString = textureBase64.split(',')[1]; // Remove data:image/png;base64, prefix
            }
          }
    
            
          switch (type) {
            case 'floor':
              textureData.floor.texture = textureString;
              textureData.floor.boundingBox = bounds;
              break;
            case 'left_wall':
              textureData.walls.left.texture = textureString;
              textureData.walls.left.boundingBox = bounds;
        
              break;
            case 'right_wall':
              textureData.walls.right.texture = textureString;
              textureData.walls.right.boundingBox = bounds;
     
              break;
            case 'back_wall':
              textureData.walls.back.texture = textureString;
              textureData.walls.back.boundingBox = bounds;
            
              break;
            case 'ceiling':
              textureData.ceiling.texture = textureString;
              textureData.ceiling.boundingBox = bounds;
              break;
            case 'left_window':
            case 'right_window':
            case 'back_window':
            case 'corner_window':
    
              break;
            case 'left_door':
            case 'right_door':
            case 'back_door':
         
              break;
            case 'wall':
              // Handle generic wall - classify by position
              const centerX = bounds.x + bounds.width / 2;
              const normX = centerX / width;
              if (normX < 0.3) {
                textureData.walls.left.texture = textureString;
                textureData.walls.left.boundingBox = bounds;
              } else if (normX > 0.7) {
                textureData.walls.right.texture = textureString;
                textureData.walls.right.boundingBox = bounds;
              } else {
                textureData.walls.back.texture = textureString;
                textureData.walls.back.boundingBox = bounds;
              }
              break;
          }
        }
      }
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      

      return textureData;
      
    } catch (error) {
      console.error('❌ Texture extraction failed:', error);
      // Return fallback texture data
      return {
        floor: { texture: '', boundingBox: { x: 0, y: 0, width: 0, height: 0 }, material: 'wood' },
        walls: {
          left: { texture: '', boundingBox: { x: 0, y: 0, width: 0, height: 0 }, material: 'painted' },
          right: { texture: '', boundingBox: { x: 0, y: 0, width: 0, height: 0 }, material: 'painted' },
          back: { texture: '', boundingBox: { x: 0, y: 0, width: 0, height: 0 }, material: 'painted' }
        },
        ceiling: { texture: '', boundingBox: { x: 0, y: 0, width: 0, height: 0 }, material: 'painted' },
        edgeMap: sam2Result.edgeMap,
        sam2Analysis: sam2Result
      };
    }
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError('');
    setUploading(true);
    setAnalyzing(true);
    hasAnalyzedRef.current = false; // Reset analysis flag for new upload

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for upload
      const base64 = await fileToBase64(file);

      // Try reconstruction based on selected method
      let analysisData: any;
      
  
      
      const sam2Result = await sam2Analyzer.analyzeRoom(file);
      const textureData = await extractTexturesFromSAM(file, sam2Result);
      
        analysisData = {
          analysis: {
            dimensions: {
              width: 4.0,  // Convert image width to reasonable room width in meters
              height: 2.5,  // Convert image height to reasonable room height in meters  
              depth: 3.0   // Reasonable room depth in meters
            },
            textureData: textureData,
            sam2Analysis: sam2Result
          }
        };
      
   
      setAnalyzing(false);

        // Depth estimation respecting red line limit - don't go beyond visible room area
        const depthGeometry = {
          width: analysisData.analysis.dimensions.width,
          height: analysisData.analysis.dimensions.height,
          depth: analysisData.analysis.dimensions.width * 0.4 // Respect red line - only 40% of width for depth
        };
        
       
        // Use texture data from SAM 2 analysis
        const extractedTextureData = analysisData.analysis.textureData;


      // Don't save to database yet - just pass the data to parent component
      // The parent will handle saving when "Save Design" is clicked
      onPhotoUploaded(base64, null, { 
        ...analysisData.analysis, 
        textureData: extractedTextureData,
        dimensions: analysisData.analysis.dimensions,
        // Store the data that would be saved to database
        pendingRoomPhotoData: {
          filename: file.name,
          url: base64,
          dimensions: analysisData.analysis.dimensions,
          depthGeometry: depthGeometry,
          textureData: extractedTextureData,
        }
      });
    } catch (err: any) {
      let errorMessage = 'Failed to upload photo: ' + err.message;
      
      // Handle SAM 2 specific errors
      if (err.message.includes('SAM 2 model failed to initialize')) {
        errorMessage = 'AI analysis failed: Unable to load SAM 2 model. Please check your internet connection and try again.';
      } else if (err.message.includes('Unexpected token')) {
        errorMessage = 'AI analysis failed: Network error while downloading AI model. Please try again.';
      }
      
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
      <h2 className="text-xl font-bold mb-4 text-white">Room Photo with AI Analysis</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded text-sm backdrop-blur-sm">
          {error}
          {error.includes('SAM 2 model') && (
            <div className="mt-2 text-xs">
              <p><strong className="text-red-200">Possible solutions:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-red-300">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>The AI model may be temporarily unavailable</li>
              </ul>
              <button
                onClick={() => {
                  setError('');
                  setPreview(null);
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Room preview"
              className="w-full h-[400px] object-cover rounded-xl shadow-2xl border border-white/20"
            />
            {!uploading && (
              <Button
                variant="danger"
                size="sm"
                className="absolute top-3 right-3 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 backdrop-blur-sm"
                onClick={() => {
                  setPreview(null);
                }}
              >
                Remove
              </Button>
            )}
            {analyzing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl backdrop-blur-sm">
                <div className="text-center text-white">
                  <Loading size="lg" />
                  <p className="mt-2 text-lg font-medium">Analyzing room with AI...</p>
                  <p className="text-sm text-slate-300 mt-1">Detecting surfaces and dimensions</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/30 rounded-xl p-12 text-center hover:border-blue-400/50 transition-colors bg-white/5 backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="mt-2 text-lg font-medium text-white">
              Upload a photo of your room
            </p>
            <p className="text-sm text-slate-400 mt-2">
              PNG, JPG up to 10MB • AI will analyze surfaces and dimensions
            </p>
          </div>
        )}


        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="room-photo-input"
          disabled={uploading}
        />
        
        <label htmlFor="room-photo-input" className="block">
          <div className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 hover:shadow-lg focus:ring-blue-500 w-full cursor-pointer px-6 py-3 text-base backdrop-blur-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? 'Uploading & Analyzing...' : preview ? 'Change Photo' : 'Select Photo'}
          </div>
        </label>

      </div>
    </Card>
  );
}

