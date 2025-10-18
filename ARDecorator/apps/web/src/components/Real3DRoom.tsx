import { useMemo, useState, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Room3DGeometry {
  vertices: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  depthMap: {
    width: number;
    height: number;
    depthData: number[][];
  };
}

interface RoomTextureData {
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
}

interface Real3DRoomProps {
  imageUrl: string;
  geometry?: Room3DGeometry;
  textureData?: RoomTextureData;
  roomDimensions?: {
    width: number;
    height: number;
    depth?: number;
    estimatedDepth?: number; // Backend sends this field name
  };
  roomPhotoId?: string;
  onTextureDataUpdate?: (textureData: RoomTextureData) => void;
}

export function Real3DRoom({ imageUrl, geometry, textureData, roomDimensions, roomPhotoId, onTextureDataUpdate }: Real3DRoomProps) {
  const fallbackTexture = useTexture(imageUrl);

  // Debug texture data
  useEffect(() => {
    console.log('🎨 Real3DRoom: Received texture data:', {
      hasTextureData: !!textureData,
      hasFloorTexture: !!textureData?.floor?.texture,
      hasWallTextures: !!textureData?.walls,
      textureDataKeys: textureData ? Object.keys(textureData) : [],
      roomPhotoId
    });
  }, [textureData, roomPhotoId]);

  // Calculate dynamic room dimensions based on actual room size
  const roomSize = useMemo(() => {
    if (roomDimensions && 
        typeof roomDimensions.width === 'number' && 
        typeof roomDimensions.height === 'number' && 
        typeof (roomDimensions.depth || roomDimensions.estimatedDepth) === 'number' &&
        !isNaN(roomDimensions.width) && 
        !isNaN(roomDimensions.height) && 
        !isNaN(roomDimensions.depth || roomDimensions.estimatedDepth || 0) &&
        roomDimensions.width > 0 && 
        roomDimensions.height > 0 && 
        (roomDimensions.depth || roomDimensions.estimatedDepth || 0) > 0) {
      // Use actual room dimensions, scaled to reasonable 3D units
      // Keep original proportions but scale to reasonable 3D size (1 unit = 1 meter)
      const actualDepth = roomDimensions.depth || roomDimensions.estimatedDepth || 0;
      
      // Scale down large rooms but maintain proportions
      const maxDimension = Math.max(roomDimensions.width, roomDimensions.height, actualDepth);
      const scale = maxDimension > 10 ? 10 / maxDimension : 1; // Scale down if room is very large
      
      return {
        width: roomDimensions.width * scale,
        height: roomDimensions.height * scale,
        depth: actualDepth * scale,
      };
    }
    
    // Fallback to default dimensions - simple and conservative
    return { width: 4, height: 2.5, depth: 3 }; // Very conservative dimensions to match image
  }, [roomDimensions]);

  return (
    <group>
      {/* Create actual 3D room with walls, floor, and ceiling */}
      <RoomWalls3D imageUrl={imageUrl} geometry={geometry} textureData={textureData} roomSize={roomSize} />
      <RoomFloor3D textureData={textureData} roomSize={roomSize} roomPhotoId={roomPhotoId} onTextureDataUpdate={onTextureDataUpdate} />
      <RoomCeiling3D imageUrl={imageUrl} texture={fallbackTexture} geometry={geometry} textureData={textureData} roomSize={roomSize} />
    </group>
  );
}

// 3D Room Walls Component with proper texture mapping
function RoomWalls3D({ imageUrl, textureData, roomSize }: { imageUrl: string; geometry?: Room3DGeometry; textureData?: RoomTextureData; roomSize: { width: number; height: number; depth: number } }) {

  // Create wall-specific textures to avoid repetition (red crosses issue)
  const [leftWallFallback, setLeftWallFallback] = useState<string>(imageUrl);
  const [rightWallFallback, setRightWallFallback] = useState<string>(imageUrl);
  const [backWallFallback, setBackWallFallback] = useState<string>(imageUrl);

  useEffect(() => {
    if (!imageUrl) return;

    const createWallSpecificTexture = (wallType: 'left' | 'right' | 'back'): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageUrl);
            return;
          }

          // Define different regions for each wall - AVOID FLOOR AREAS COMPLETELY
          let cropRegion;
          switch (wallType) {
            case 'left':
              // Left wall: left third, UPPER section only (avoid floor completely)
              cropRegion = { x: 0, y: img.height * 0.1, width: img.width / 3, height: img.height * 0.6 };
              break;
            case 'right':
              // Right wall: right third, UPPER section only (avoid floor completely)
              cropRegion = { x: img.width * 2 / 3, y: img.height * 0.1, width: img.width / 3, height: img.height * 0.6 };
              break;
            case 'back':
              // Back wall: center region, UPPER section only (avoid floor completely)
              cropRegion = { x: img.width * 0.3, y: img.height * 0.1, width: img.width * 0.4, height: img.height * 0.6 };
              break;
            default:
              resolve(imageUrl);
              return;
          }

          // Set canvas size to the crop region
          canvas.width = cropRegion.width;
          canvas.height = cropRegion.height;

          // Draw the cropped region
          ctx.drawImage(
            img,
            cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height,
            0, 0, cropRegion.width, cropRegion.height
          );

          // Convert to base64
          const croppedImageUrl = canvas.toDataURL('image/png');
          resolve(croppedImageUrl);
        };
        img.onerror = () => resolve(imageUrl);
        img.src = imageUrl;
      });
    };

    // Create wall-specific textures
    createWallSpecificTexture('left').then(setLeftWallFallback);
    createWallSpecificTexture('right').then(setRightWallFallback);
    createWallSpecificTexture('back').then(setBackWallFallback);
  }, [imageUrl]);

  // Debug wall texture data
  useEffect(() => {
    if (textureData) {
      const leftWallSameAsFloor = textureData?.walls?.left?.texture === textureData?.floor?.texture;
      const rightWallSameAsFloor = textureData?.walls?.right?.texture === textureData?.floor?.texture;
      const backWallSameAsFloor = textureData?.walls?.back?.texture === textureData?.floor?.texture;
      
      console.log('🏠 WALL TEXTURE DEBUG:', {
        hasTextureData: !!textureData,
        hasWallTextures: !!textureData?.walls,
        leftWallTexture: textureData?.walls?.left?.texture ? 'extracted' : 'fallback',
        rightWallTexture: textureData?.walls?.right?.texture ? 'extracted' : 'fallback',
        backWallTexture: textureData?.walls?.back?.texture ? 'extracted' : 'fallback',
        floorTexture: textureData?.floor?.texture ? 'extracted' : 'fallback'
      });
      
      console.log('🔍 TEXTURE COMPARISON:', {
        leftWallSameAsFloor,
        rightWallSameAsFloor,
        backWallSameAsFloor,
        issue: leftWallSameAsFloor || rightWallSameAsFloor || backWallSameAsFloor ? 'WALLS HAVE FLOOR TEXTURE!' : 'Textures are different'
      });
    }
  }, [textureData]);

  // Use detected textures or wall-specific regions to avoid repetition
  // If wall textures are the same as floor texture, use fallback to avoid floor texture on walls
  const leftWallTextureUrl = (textureData?.walls?.left?.texture && textureData?.walls?.left?.texture !== textureData?.floor?.texture) ? 
    `data:image/png;base64,${textureData.walls.left.texture}` : leftWallFallback;
  const rightWallTextureUrl = (textureData?.walls?.right?.texture && textureData?.walls?.right?.texture !== textureData?.floor?.texture) ? 
    `data:image/png;base64,${textureData.walls.right.texture}` : rightWallFallback;
  const backWallTextureUrl = (textureData?.walls?.back?.texture && textureData?.walls?.back?.texture !== textureData?.floor?.texture) ? 
    `data:image/png;base64,${textureData.walls.back.texture}` : backWallFallback;
  
  // Debug which textures are being used
  console.log('🎨 WALL TEXTURE URLS:', {
    leftWall: leftWallTextureUrl === leftWallFallback ? 'FALLBACK' : 'EXTRACTED',
    rightWall: rightWallTextureUrl === rightWallFallback ? 'FALLBACK' : 'EXTRACTED',
    backWall: backWallTextureUrl === backWallFallback ? 'FALLBACK' : 'EXTRACTED',
    textureDataAvailable: {
      floor: !!textureData?.floor?.texture,
      leftWall: !!textureData?.walls?.left?.texture,
      rightWall: !!textureData?.walls?.right?.texture,
      backWall: !!textureData?.walls?.back?.texture
    },
    fallbackUrls: {
      left: leftWallFallback.substring(0, 50) + '...',
      right: rightWallFallback.substring(0, 50) + '...',
      back: backWallFallback.substring(0, 50) + '...'
    }
  });
  
  
  const leftWallTexture = useTexture(leftWallTextureUrl);
  const rightWallTexture = useTexture(rightWallTextureUrl);
  const backWallTexture = useTexture(backWallTextureUrl);

  // Create materials for different walls - texture on inside, white on outside
  const leftWallMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: leftWallTexture,
      side: THREE.DoubleSide, // Render both sides to avoid culling issues
    });
    if (mat.map) {
      mat.map.wrapS = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.wrapT = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.repeat.set(1, 1); // 1:1 mapping
      mat.map.flipY = true; // Fix upside down texture
      
      // Preserve color accuracy
      mat.map.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
      mat.map.generateMipmaps = false; // Disable mipmaps for pixel-perfect rendering
      mat.map.minFilter = THREE.LinearFilter; // Use linear filtering
      mat.map.magFilter = THREE.LinearFilter; // Use linear filtering
      
      // Standard texture mapping
      mat.map.offset.set(0, 0);
      mat.map.center.set(0.5, 0.5);
    }
    return mat;
  }, [leftWallTexture]);

  const rightWallMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: rightWallTexture,
      side: THREE.DoubleSide, // Render both sides to avoid culling issues
    });
    if (mat.map) {
      mat.map.wrapS = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.wrapT = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.repeat.set(1, 1); // 1:1 mapping
      mat.map.flipY = true; // Fix upside down texture
      
      // Preserve color accuracy
      mat.map.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
      mat.map.generateMipmaps = false; // Disable mipmaps for pixel-perfect rendering
      mat.map.minFilter = THREE.LinearFilter; // Use linear filtering
      mat.map.magFilter = THREE.LinearFilter; // Use linear filtering
      
      // Standard texture mapping
      mat.map.offset.set(0, 0);
      mat.map.center.set(0.5, 0.5);
    }
    return mat;
  }, [rightWallTexture]);

  const backWallMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: backWallTexture,
      side: THREE.DoubleSide, // Render both sides to avoid culling issues
    });
    if (mat.map) {
      mat.map.wrapS = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.wrapT = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.repeat.set(1, 1); // 1:1 mapping
      mat.map.flipY = true; // Fix upside down texture
      
      // Preserve color accuracy
      mat.map.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
      mat.map.generateMipmaps = false; // Disable mipmaps for pixel-perfect rendering
      mat.map.minFilter = THREE.LinearFilter; // Use linear filtering
      mat.map.magFilter = THREE.LinearFilter; // Use linear filtering
    }
    return mat;
  }, [backWallTexture]);

  // Create separate geometries for left and right walls
  const leftWallGeometry = useMemo(() => {
    const validHeight = Math.max(roomSize.height, 1);
    const validDepth = Math.max(roomSize.depth, 1);
    
    const geometry = new THREE.PlaneGeometry(validDepth, validHeight, 1, 1); // Simple plane without grid
    return geometry;
  }, [roomSize]);

  const rightWallGeometry = useMemo(() => {
    const validHeight = Math.max(roomSize.height, 1);
    const validDepth = Math.max(roomSize.depth, 1);
    
    const geometry = new THREE.PlaneGeometry(validDepth, validHeight, 1, 1); // Simple plane without grid
    return geometry;
  }, [roomSize]);

  const backWallGeometry = useMemo(() => {
    // Ensure valid dimensions
    const validHeight = Math.max(roomSize.height, 1);
    const validWidth = Math.max(roomSize.width, 1);
    
    const geometry = new THREE.PlaneGeometry(validWidth, validHeight, 1, 1); // Simple plane without grid
    return geometry;
  }, [roomSize]);

  return (
    <group>
      {/* Left Wall - normal positioning */}
      <mesh position={[-roomSize.width / 2, roomSize.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <primitive object={leftWallGeometry} />
        <primitive object={leftWallMaterial} />
      </mesh>
      
      {/* Right Wall - normal positioning */}
      <mesh position={[roomSize.width / 2, roomSize.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <primitive object={rightWallGeometry} />
        <primitive object={rightWallMaterial} />
      </mesh>
      
      {/* Back Wall - normal positioning */}
      <mesh position={[0, roomSize.height / 2, -roomSize.depth / 2]} rotation={[0, 0, 0]}>
        <primitive object={backWallGeometry} />
        <primitive object={backWallMaterial} />
      </mesh>
    </group>
  );
}

// 3D Room Floor Component with floor texture extraction
function RoomFloor3D({ textureData, roomSize, roomPhotoId, onTextureDataUpdate }: { textureData?: RoomTextureData; roomSize: { width: number; height: number; depth: number }; roomPhotoId?: string; onTextureDataUpdate?: (textureData: RoomTextureData) => void }) {
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [hasFailedReExtraction, setHasFailedReExtraction] = useState(false);
  
  // Use extracted floor texture if available, otherwise use a fallback
  const floorTextureUrl = textureData?.floor?.texture ? 
    `data:image/png;base64,${textureData.floor.texture}` : 
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent pixel

  const floorTexture = useTexture(floorTextureUrl);
  
  // Trigger texture re-extraction if no texture data available
  useEffect(() => {
    if (!textureData?.floor?.texture && roomPhotoId && !isReExtracting && !hasFailedReExtraction) {
      console.log('🔄 No floor texture found, triggering FRESH ANALYSIS for room photo:', roomPhotoId);
      console.log('🔍 Current user context:', {
        isLoggedIn: !!localStorage.getItem('authToken'),
        tokenLength: localStorage.getItem('authToken')?.length || 0
      });
      console.log('🎯 EDIT MODE: Forcing fresh texture analysis for better accuracy');
      setIsReExtracting(true);
      
      // Import roomPhotosApi dynamically to avoid circular dependencies
      import('@/lib/api/room-photos').then((module) => {
        module.roomPhotosApi.reExtractTextures(roomPhotoId)
          .then((response) => {
            console.log('✅ Texture re-extraction completed for room photo:', roomPhotoId);
            console.log('🎨 Received texture data from re-extraction:', response.textureData);
            
            // Update the texture data directly instead of refreshing
            if (response.textureData && onTextureDataUpdate) {
              console.log('🎨 Updating texture data via callback:', response.textureData);
              onTextureDataUpdate(response.textureData);
              setIsReExtracting(false);
              setHasFailedReExtraction(false);
            } else {
              // Fallback: show message to refresh manually
              console.log('🎉 Texture data updated successfully! Please refresh the page to see the changes.');
              setIsReExtracting(false);
              setHasFailedReExtraction(false);
            }
          })
          .catch((error) => {
            console.error('❌ Texture re-extraction failed:', error);
            if (error.response?.status === 403) {
              console.warn('🔒 Authentication required for texture re-extraction. Please log in.');
            } else if (error.response?.status === 404) {
              console.warn('📷 Room photo not found for texture re-extraction.');
            } else {
              console.warn('⚠️ Texture re-extraction failed. Using fallback material.');
            }
            setHasFailedReExtraction(true); // Prevent infinite retries
          })
          .finally(() => {
            setIsReExtracting(false);
          });
      });
    }
  }, [textureData, roomPhotoId, isReExtracting, hasFailedReExtraction]);
  
  // Debug texture loading
  useEffect(() => {
    if (floorTexture) {
      console.log('🔍 FLOOR DEBUG:', {
        textureUrl: floorTextureUrl.substring(0, 100) + '...',
        textureLoaded: !!floorTexture,
        textureSize: floorTexture.image ? `${floorTexture.image.width}x${floorTexture.image.height}` : 'no image',
        textureSource: floorTexture.source ? floorTexture.source.data : 'no source',
        hasTextureData: !!textureData?.floor?.texture,
        textureDataLength: textureData?.floor?.texture?.length || 0
      });
    }
  }, [floorTexture, floorTextureUrl, textureData]);
  
  const floorMaterial = useMemo(() => {
    if (textureData?.floor?.texture) {
      // Use extracted floor texture
      const mat = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0,
      });
      
      // Configure texture to match original image exactly
      if (mat.map) {
        mat.map.wrapS = THREE.ClampToEdgeWrapping;
        mat.map.wrapT = THREE.ClampToEdgeWrapping;
        mat.map.repeat.set(1, 1);
        mat.map.offset.set(0, 0);
        mat.map.flipY = false;
        mat.map.needsUpdate = true;
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.map.generateMipmaps = false;
        mat.map.minFilter = THREE.LinearFilter;
        mat.map.magFilter = THREE.LinearFilter;
      }
      
      console.log('🔍 FLOOR MATERIAL DEBUG (WITH TEXTURE):', {
        material: mat,
        hasMap: !!mat.map,
        usingExtractedTexture: true
      });
      
      return mat;
    } else if (isReExtracting) {
      // Show loading state while re-extracting textures
      const mat = new THREE.MeshBasicMaterial({
        color: 0x4A90E2, // Blue color to indicate fresh analysis
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 0.8,
      });
      
      console.log('🔄 FLOOR MATERIAL DEBUG (FRESH ANALYSIS):', {
        material: mat,
        hasMap: false,
        status: 'performing fresh texture analysis'
      });
      
      return mat;
    } else {
      // No texture and not re-extracting - show placeholder
      const mat = new THREE.MeshBasicMaterial({
        color: 0xcccccc, // Light gray placeholder
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0,
      });
      
      console.log('⚠️ FLOOR MATERIAL DEBUG (NO TEXTURE):', {
        material: mat,
        hasMap: false,
        status: 'no texture data available'
      });
      
      return mat;
    }
  }, [floorTexture, textureData?.floor?.texture, isReExtracting]);

  // Create simple flat floor geometry - texture priority
  const floorGeometry = useMemo(() => {
    // Ensure valid dimensions
    const validWidth = Math.max(roomSize.width, 1);
    const validDepth = Math.max(roomSize.depth, 1);
    
    // SIMPLE FLAT FLOOR: Prioritize texture visibility over perspective
    const geometry = new THREE.PlaneGeometry(validWidth, validDepth);
    
    console.log('🔍 SIMPLE FLAT FLOOR:', {
      width: validWidth,
      depth: validDepth,
      strategy: 'Flat floor for texture visibility'
    });
    
    return geometry;
  }, [roomSize]);

  console.log('🔍 FLOOR MESH DEBUG:', {
    position: [0, 0, 0],
    rotation: [Math.PI / 2, 0, 0],
    roomSize,
    geometrySize: `${Math.max(roomSize.width, 1)} x ${Math.max(roomSize.depth, 1)}`
  });

  return (
    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow key={`floor-${roomSize.width}-${roomSize.depth}`}>
      <primitive object={floorGeometry} />
      <primitive object={floorMaterial} />
    </mesh>
  );
}

// 3D Room Ceiling Component with ceiling texture extraction
function RoomCeiling3D({ imageUrl, textureData, roomSize }: { imageUrl: string; texture: THREE.Texture; geometry?: Room3DGeometry; textureData?: RoomTextureData; roomSize: { width: number; height: number; depth: number } }) {
  // Always load ceiling texture - use original image as fallback if textureData is not available
  const ceilingTextureUrl = textureData?.ceiling?.texture ? `data:image/png;base64,${textureData.ceiling.texture}` : imageUrl;
  const ceilingTexture = useTexture(ceilingTextureUrl);
  
  const ceilingMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: ceilingTexture,
      side: THREE.DoubleSide, // Render both sides to avoid culling issues
    });
    if (mat.map) {
      mat.map.wrapS = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.wrapT = THREE.ClampToEdgeWrapping; // Prevent texture repetition
      mat.map.repeat.set(1, 1); // 1:1 mapping
      mat.map.flipY = true; // Fix upside down texture
      
      // Preserve color accuracy
      mat.map.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
      mat.map.generateMipmaps = false; // Disable mipmaps for pixel-perfect rendering
      mat.map.minFilter = THREE.LinearFilter; // Use linear filtering
      mat.map.magFilter = THREE.LinearFilter; // Use linear filtering
    }
    return mat;
  }, [ceilingTexture]);

  return (
    <mesh position={[0, roomSize.height, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[Math.max(roomSize.width, 1), Math.max(roomSize.depth, 1)]} />
      <primitive object={ceilingMaterial} />
    </mesh>
  );
}

// Depth visualization component
export function DepthVisualization({ depthMap }: { depthMap: Room3DGeometry['depthMap'] }) {
  const { width, height, depthData } = depthMap;
  
  // Create depth visualization texture
  const depthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const depth = depthData[y][x];
        const intensity = Math.floor(depth * 255);
        
        const pixelIndex = (y * width + x) * 4;
        imageData.data[pixelIndex] = intensity;     // R
        imageData.data[pixelIndex + 1] = intensity; // G
        imageData.data[pixelIndex + 2] = intensity; // B
        imageData.data[pixelIndex + 3] = 255;       // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }, [depthMap]);

  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[2, 1.5]} />
      <meshBasicMaterial map={depthTexture} />
    </mesh>
  );
}
