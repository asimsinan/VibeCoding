import { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Real3DFurniture } from './Real3DFurniture';
import { Real3DRoom } from './Real3DRoom';
import * as THREE from 'three';


interface FurnitureObject {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  modelUrl: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

interface Real3DSceneProps {
  roomPhotoUrl: string | null;
  roomGeometry?: any; // 3D geometry from depth estimation
  roomTextureData?: any; // Extracted texture data for walls, floor, ceiling
  roomDimensions?: { width: number; height: number; depth?: number; estimatedDepth?: number }; // Actual room dimensions
  roomPhotoId?: string; // Room photo ID for texture re-extraction
  furniture: FurnitureObject[];
  onFurnitureMove: (id: string, position: { x: number; y: number; z: number }) => void;
  onFurnitureRotate?: (id: string, rotation: { x: number; y: number; z: number }) => void;
  onFurnitureScale?: (id: string, scale: number) => void;
  onFurnitureDelete?: (id: string) => void;
  onTextureDataUpdate?: (textureData: any) => void;
}

// Room background with real 3D depth
function RoomBackground({ imageUrl, geometry, textureData, roomDimensions, roomPhotoId, onTextureDataUpdate }: { imageUrl: string | null; geometry?: any; textureData?: any; roomDimensions?: { width: number; height: number; depth?: number; estimatedDepth?: number }; roomPhotoId?: string; onTextureDataUpdate?: (textureData: any) => void }) {
  if (!imageUrl) {
    return (
      <mesh position={[0, 0, -5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 15]} />
        <meshBasicMaterial color="#f0f0f0" />
      </mesh>
    );
  }

  return <Real3DRoom imageUrl={imageUrl} geometry={geometry} textureData={textureData} roomDimensions={roomDimensions} roomPhotoId={roomPhotoId} onTextureDataUpdate={onTextureDataUpdate} />;
}


// Drag handler for furniture
function DragHandler({
  furniture,
  isSelected,
  onSelect,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}: {
  furniture: FurnitureObject;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (pos: { x: number; y: number; z: number }) => void;
  onRotationChange?: (rot: { x: number; y: number; z: number }) => void;
  onScaleChange?: (scale: number) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  useFrame(() => {
    if (isDragging && meshRef.current) {
      // Update position based on mouse movement
      const mouse = new THREE.Vector2();
      mouse.x = ((gl.domElement.offsetLeft + gl.domElement.offsetWidth / 2) / window.innerWidth) * 2 - 1;
      mouse.y = -((gl.domElement.offsetTop + gl.domElement.offsetHeight / 2) / window.innerHeight) * 2 + 1;
      
      // Convert screen coordinates to world coordinates
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      // Create a plane at the furniture's height
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -furniture.position.y);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      
      if (intersection) {
        const newPosition = {
          x: intersection.x,
          y: furniture.position.y,
          z: intersection.z
        };
        onPositionChange(newPosition);
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.shiftKey) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      onSelect();
    }
  };

  const handlePointerUp = (e: any) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
    setDragStart(null);
  };

  const handlePointerMove = (e: any) => {
    if (isDragging && dragStart && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate movement
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Convert screen movement to world movement
      const sensitivity = 0.01;
      const newPosition = {
        x: furniture.position.x + deltaX * sensitivity,
        y: furniture.position.y,
        z: furniture.position.z + deltaY * sensitivity
      };
      
      onPositionChange(newPosition);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  return (
    <group
      ref={meshRef}
      position={[furniture.position.x, furniture.position.y, furniture.position.z]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      <Real3DFurniture
        furniture={furniture}
        isSelected={isSelected}
        onSelect={onSelect}
        onPositionChange={onPositionChange}
        onRotationChange={onRotationChange || (() => {})}
        onScaleChange={onScaleChange || (() => {})}
      />
    </group>
  );
}

// Real 3D Furniture Item with actual 3D models
function FurnitureItem({
  furniture,
  isSelected,
  onSelect,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}: {
  furniture: FurnitureObject;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (pos: { x: number; y: number; z: number }) => void;
  onRotationChange?: (rot: { x: number; y: number; z: number }) => void;
  onScaleChange?: (scale: number) => void;
}) {
  return (
    <DragHandler
      furniture={furniture}
      isSelected={isSelected}
      onSelect={onSelect}
      onPositionChange={onPositionChange}
      onRotationChange={onRotationChange}
      onScaleChange={onScaleChange}
    />
  );
}

// Main Scene Component
export function Real3DScene({ roomPhotoUrl, roomGeometry, roomTextureData, roomDimensions, roomPhotoId, furniture, onFurnitureMove, onFurnitureRotate, onFurnitureScale, onFurnitureDelete, onTextureDataUpdate }: Real3DSceneProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragMode, setDragMode] = useState<'horizontal' | 'vertical' | 'scale'>('horizontal');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSKeyPressed, setIsSKeyPressed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Ensure the canvas div gets focus when a furniture item is selected
  useEffect(() => {
    if (selectedId && canvasRef.current) {
      canvasRef.current.focus();
    }
  }, [selectedId]);

  // Cleanup effect to prevent WebGL context issues
  useEffect(() => {
    return () => {
      // Clear any pending operations when component unmounts
      setSelectedId(null);
      setIsDragging(false);
      setDragStart(null);
    };
  }, []);

  const handleFurnitureSelect = (id: string) => {
    setSelectedId(id);
  };

  const handlePositionChange = (id: string, position: { x: number; y: number; z: number }) => {
    onFurnitureMove(id, position);
  };

  const handleRotationChange = (id: string, rotation: { x: number; y: number; z: number }) => {
    if (onFurnitureRotate) {
      onFurnitureRotate(id, rotation);
    }
  };

  const handleScaleChange = (id: string, scale: number) => {
    if (onFurnitureScale) {
      onFurnitureScale(id, scale);
    }
  };

  // Function to constrain furniture position within room boundaries
  const constrainPositionToRoom = (position: { x: number; y: number; z: number }, furnitureScale: number = 1, furnitureName?: string) => {
    if (!roomDimensions) {
      // If no room dimensions, use default constraints - much smaller room to be safe
      return {
        x: Math.max(-1.2, Math.min(1.2, position.x)),
        y: Math.max(0, Math.min(2, position.y)),
        z: Math.max(-1.2, Math.min(1.2, position.z))
      };
    }

    const { width, height, depth } = roomDimensions;
    const roomWidth = width || 4; // Default room width
    const roomHeight = height || 3; // Default room height  
    const roomDepth = depth || 4; // Default room depth
    
    // Use more aggressive margin calculation based on furniture scale
    const baseMargin = 0.3; // Base margin
    const scaleMargin = furnitureScale * 0.4; // Additional margin based on scale
    const totalMargin = baseMargin + scaleMargin;
    
    // Check if this is a floor item (rug, carpet, etc.)
    const isFloorItem = furnitureName && (
      furnitureName.toLowerCase().includes('rug') || 
      furnitureName.toLowerCase().includes('carpet') ||
      furnitureName.toLowerCase().includes('mat')
    );
    
    // Use more aggressive constraints to ensure furniture stays inside room
    const maxX = roomWidth/2 - totalMargin;
    const minX = -roomWidth/2 + totalMargin;
    const maxZ = roomDepth/2 - totalMargin;
    const minZ = -roomDepth/2 + totalMargin;
    
    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: isFloorItem ? 0 : Math.max(0, Math.min(roomHeight - totalMargin, position.y)), // Floor items always at Y=0
      z: Math.max(minZ, Math.min(maxZ, position.z))
    };
  };

  // Global mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedId && (e.shiftKey || (e.ctrlKey && e.shiftKey) || isSKeyPressed)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      
      // Set drag mode based on key combination
      if (isSKeyPressed) {
        setDragMode('scale');
      } else if (e.ctrlKey && e.shiftKey) {
        setDragMode('vertical');
      } else if (e.shiftKey) {
        setDragMode('horizontal');
      }
      
      e.preventDefault(); // Prevent camera rotation
      e.stopPropagation(); // Stop event bubbling
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
    setDragStart(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedId && dragStart && (e.shiftKey || (e.ctrlKey && e.shiftKey) || isSKeyPressed)) {
      e.preventDefault(); // Prevent camera rotation
      e.stopPropagation(); // Stop event bubbling
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Find the selected furniture
      const selectedFurniture = furniture.find(f => f.id === selectedId);
      if (selectedFurniture) {
        const sensitivity = 0.01;
        
        // Check for S+drag for scaling
        if (isSKeyPressed) {
          // Use vertical movement (deltaY) for scaling
          const scaleSensitivity = 0.005;
          const scaleChange = -deltaY * scaleSensitivity; // Negative because up should increase scale
          const newScale = Math.max(0.1, Math.min(3.0, selectedFurniture.scale + scaleChange));
          handleScaleChange(selectedId, newScale);
        } else {
          let newPosition = { ...selectedFurniture.position };
          
          // Check for Ctrl+Shift+drag for vertical movement
          if (e.ctrlKey && e.shiftKey) {
            // Vertical movement only (Y axis) - use deltaY for up/down, but prevent going below floor
            newPosition.y = Math.max(0, selectedFurniture.position.y - deltaY * sensitivity);
          } else if (e.shiftKey) {
            // Horizontal movement (X/Z plane)
            newPosition.x = selectedFurniture.position.x + deltaX * sensitivity;
            newPosition.z = selectedFurniture.position.z + deltaY * sensitivity;
          }
          
          // Apply room boundary constraints
          const constrainedPosition = constrainPositionToRoom(newPosition, selectedFurniture.scale, selectedFurniture.name);
          onFurnitureMove(selectedId, constrainedPosition);
        }
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  // Keyboard controls for rotation, movement, and scaling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log(`⌨️ Key pressed: ${e.key}, selectedId: ${selectedId}`);
    
    // Handle Delete key for removing furniture
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId && onFurnitureDelete) {
        e.preventDefault();
        onFurnitureDelete(selectedId);
        setSelectedId(null);
        return;
      }
    }

    // Handle S key for scaling mode
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      setIsSKeyPressed(true);
      return;
    }

    if (selectedId) {
      const selectedFurniture = furniture.find(f => f.id === selectedId);
      if (selectedFurniture) {
        const rotationStep = 0.1;
        const movementStep = 0.1;
        const scaleStep = 0.1;
        let newRotation = { ...selectedFurniture.rotation };
        let newPosition = { ...selectedFurniture.position };
        let newScale = selectedFurniture.scale;
        
        // Check for Command key (Mac) or Ctrl key (Windows/Linux)
        const isCommandKey = e.metaKey || e.ctrlKey;
        
        if (isCommandKey) {
          // Command + Arrow keys for vertical movement
          switch (e.key) {
            case 'ArrowUp':
              newPosition.y += movementStep;
              break;
            case 'ArrowDown':
              newPosition.y = Math.max(0, newPosition.y - movementStep);
              break;
            case 'ArrowLeft':
              newPosition.x -= movementStep;
              break;
            case 'ArrowRight':
              newPosition.x += movementStep;
              break;
            default:
              return;
          }
          // Apply room boundary constraints
          const constrainedPosition = constrainPositionToRoom(newPosition, selectedFurniture.scale, selectedFurniture.name);
          onFurnitureMove(selectedId, constrainedPosition);
        } else {
          // Regular arrow keys for rotation
          switch (e.key) {
            case 'ArrowLeft':
              newRotation.y += rotationStep;
              break;
            case 'ArrowRight':
              newRotation.y -= rotationStep;
              break;
            case 'ArrowUp':
              newRotation.x += rotationStep;
              break;
            case 'ArrowDown':
              newRotation.x -= rotationStep;
              break;
            case 'r':
            case 'R':
              newRotation.z += rotationStep;
              break;
            case '+':
            case '=':
              newScale = Math.min(newScale + scaleStep, 3.0); // Max scale 3x
              handleScaleChange(selectedId, newScale);
              break;
            case '-':
              newScale = Math.max(newScale - scaleStep, 0.1); // Min scale 0.1x
              handleScaleChange(selectedId, newScale);
              break;
            default:
              return;
          }
          
          if (onFurnitureRotate) {
            console.log(`🔄 Real3DScene: Rotating ${selectedId} to:`, newRotation);
            onFurnitureRotate(selectedId, newRotation);
          }
        }
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Handle S key release
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      setIsSKeyPressed(false);
    }
  };

  // Handle clicking on empty space to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas background, not on furniture
    if (e.target === e.currentTarget) {
      setSelectedId(null);
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full relative focus:outline-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={handleCanvasClick}
      tabIndex={0}
      autoFocus
    >
      {/* Render Three.js Canvas */}
      <Canvas
          shadows
          camera={{ position: [0, 3, 6], fov: 60 }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            {/* Lighting - Reduced intensity to minimize reflections */}
            {/* SIMPLE LIGHTING FOR BASIC MATERIALS */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={0.8}
              castShadow={true}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight
              position={[-10, 10, 5]}
              intensity={0.4}
              castShadow={false}
            />
            <pointLight position={[0, 8, 0]} intensity={0.6} distance={20} />
            <pointLight position={[-5, 6, 5]} intensity={0.3} distance={15} />
            <pointLight position={[5, 6, 5]} intensity={0.3} distance={15} />
            <spotLight
              position={[0, 10, 0]}
              angle={0.4}
              penumbra={0.5}
              intensity={0.5}
              castShadow={true}
              target-position={[0, 0, 0]}
            />

            {/* Room Background with 3D Depth */}
            {roomPhotoUrl && (
              <RoomBackground imageUrl={roomPhotoUrl} geometry={roomGeometry} textureData={roomTextureData} roomDimensions={roomDimensions} roomPhotoId={roomPhotoId} onTextureDataUpdate={onTextureDataUpdate} />
            )}

            {/* Contact Shadows for realism */}
            <ContactShadows
              position={[0, 0.01, 0]}
              opacity={0.4}
              scale={100}
              blur={2}
              far={50}
            />

            {/* Furniture Items */}
            {furniture.map((item) => (
              <FurnitureItem
                key={item.id}
                furniture={item}
                isSelected={selectedId === item.id}
                onSelect={() => handleFurnitureSelect(item.id)}
                onPositionChange={(pos) => handlePositionChange(item.id, pos)}
                onRotationChange={(rot) => handleRotationChange(item.id, rot)}
                onScaleChange={(scale) => handleScaleChange(item.id, scale)}
              />
            ))}

            {/* Environment for reflections */}
            <Environment preset="apartment" />

            {/* Camera Controls */}
            <OrbitControls
              enablePan={!isDragging}
              enableZoom={!isDragging}
              enableRotate={!isDragging}
              minDistance={3}
              maxDistance={15}
              maxPolarAngle={Math.PI / 2}
              target={[0, 1, 0]}
            />
          </Suspense>
        </Canvas>


      {/* Info Icon */}
      <div 
        className="absolute top-4 left-4 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors"
        onClick={() => setShowInstructions(true)}
        title="Show Controls"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* Delete Button - Only show when furniture is selected */}
      {selectedId && onFurnitureDelete && (
        <div 
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
          onClick={() => {
            onFurnitureDelete(selectedId);
            setSelectedId(null);
          }}
          title="Delete Selected Furniture (Delete key)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Delete</span>
        </div>
      )}
      
      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-pulse bg-blue-500/20"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 text-xs font-bold">
              {dragMode === 'scale' 
                ? "S + DRAGGING (SCALING)" 
                : dragMode === 'vertical' 
                ? "CTRL + SHIFT + DRAGGING (Y AXIS)" 
                : "SHIFT + DRAGGING (X/Z PLANE)"}
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowInstructions(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🎮 Controls</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Furniture Selection & Movement:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Click furniture</strong> to select</li>
                  <li>• <strong>Shift + drag</strong> to move furniture (X/Z plane)</li>
                  <li>• <strong>Ctrl + Shift + drag</strong> to move up/down (Y axis)</li>
                  <li>• <strong>Delete key</strong> to remove selected furniture</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Furniture Rotation:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Arrow keys</strong> to rotate (X/Y axis)</li>
                  <li>• <strong>R key</strong> to rotate (Z axis)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Furniture Scaling:</h4>
                <ul className="space-y-1">
                  <li>• <strong>S + drag up/down</strong> to scale furniture</li>
                  <li>• <strong>+ / -</strong> keys to scale up/down</li>
                  <li>• <strong>Drag handles</strong> in scaling mode to resize</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Keyboard Movement:</h4>
                <ul className="space-y-1">
                  <li>• <strong>⌘ + ↑/↓</strong> to move up/down</li>
                  <li>• <strong>⌘ + ←/→</strong> to move left/right</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Camera Controls:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Right-click + drag</strong> to rotate camera</li>
                  <li>• <strong>Scroll</strong> to zoom in/out</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

