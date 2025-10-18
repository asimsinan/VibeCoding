import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { GLTFModel } from './GLTFModels';

interface FurnitureModelProps {
  furniture: {
    id: string;
    name: string;
    category: string;
    thumbnailUrl: string;
    modelUrl: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange?: (pos: { x: number; y: number; z: number }) => void;
  onRotationChange?: (rot: { x: number; y: number; z: number }) => void;
  onScaleChange?: (scale: number) => void;
}

// Main Furniture Component
export function Real3DFurniture({ furniture, isSelected, onSelect, onPositionChange: _onPositionChange, onRotationChange: _onRotationChange, onScaleChange: _onScaleChange }: FurnitureModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Get the appropriate 3D model based on category
  const getModel = () => {
    const category = furniture.category?.toLowerCase() || 'seating';
    const name = furniture.name?.toLowerCase() || '';
    
    console.log(`🔍 Real3DFurniture: Processing furniture - Category: "${category}", Name: "${name}"`);
    
    // Map categories to model types
    let modelType = 'sofa'; // default
    
    switch (category) {
      case 'seating':
        if (name.includes('modern velvet sofa')) {
          modelType = 'velvet_sofa'; // Specific model for Modern Velvet Sofa
        } else if (name.includes('sofa') || name.includes('couch')) {
          modelType = 'sofa';
        } else if (name.includes('egg chair')) {
          modelType = 'egg_chair'; // Specific model for Egg Chair
        } else if (name.includes('scandinavian armchair')) {
          modelType = 'scandinavian_chair'; // Specific model for Scandinavian Armchair
        } else if (name.includes('chair')) {
          modelType = 'chair';
        } else {
          modelType = 'sofa'; // default for seating
        }
        break;
        
      case 'tables':
        if (name.includes('glass coffee table')) {
          modelType = 'glass_table'; // Specific model for Glass Coffee Table
        } else if (name.includes('oak dining table')) {
          modelType = 'oak_table'; // Specific model for Oak Dining Table
        } else if (name.includes('marble side table')) {
          modelType = 'side_table'; // Specific model for Marble Side Table
        } else if (name.includes('dining')) {
          modelType = 'dining_table';
        } else {
          modelType = 'table';
        }
        break;
        
      case 'storage':
        if (name.includes('bookshelf')) {
          modelType = 'bookshelf'; // Specific model for Bookshelf
        } else if (name.includes('dresser')) {
          modelType = 'dresser'; // Specific model for Dresser
        } else if (name.includes('wardrobe') || name.includes('closet')) {
          modelType = 'wardrobe';
        } else if (name.includes('tv console') || name.includes('tv stand') || name.includes('entertainment center')) {
          modelType = 'tv_console';
        } else {
          modelType = 'bookshelf';
        }
        break;
        
      case 'lighting':
        if (name.includes('table lamp')) {
          modelType = 'table_lamp'; // Use dedicated table lamp model
          console.log(`💡 Real3DFurniture: Mapped "${name}" to table_lamp model`);
        } else if (name.includes('chandelier')) {
          modelType = 'chandelier'; // Use dedicated chandelier model
          console.log(`💡 Real3DFurniture: Mapped "${name}" to chandelier model`);
        } else if (name.includes('floor lamp')) {
          modelType = 'floor_lamp'; // Use dedicated floor lamp model
          console.log(`💡 Real3DFurniture: Mapped "${name}" to floor_lamp model`);
        } else {
          modelType = 'lamp'; // Default lighting item
        }
        break;
        
      case 'bedroom':
        if (name.includes('bed')) {
          modelType = 'bed';
        } else if (name.includes('desk')) {
          modelType = 'desk';
        } else {
          modelType = 'bed';
        }
        break;
        
      case 'electronics':
        if (name.includes('tv') || name.includes('television')) {
          modelType = 'tv';
        } else {
          modelType = 'tv';
        }
        break;
        
      case 'decor':
        // Check for specific decor items
        if (name.includes('wall mirror')) {
          modelType = 'wall_mirror'; // Use dedicated wall mirror model
        } else if (name.includes('mirror')) {
          modelType = 'mirror'; // Use generic mirror model
        } else if (name.includes('rug') || name.includes('carpet')) {
          modelType = 'rug'; // Use dedicated rug model
        } else if (name.includes('mona lisa')) {
          modelType = 'mona_lisa'; // Use dedicated Mona Lisa model
        } else if (name.includes('plant') || name.includes('vase')) {
          modelType = 'lamp'; // Use lamp as decorative item
        } else if (name.includes('art') || name.includes('painting') || name.includes('canvas')) {
          modelType = 'wall_art'; // Use dedicated wall art model
        } else {
          modelType = 'lamp'; // Default decor item
        }
        break;
        
      default:
        modelType = 'sofa';
    }
    
    console.log(`🎯 Real3DFurniture: Mapped to model type: "${modelType}"`);
    
    return (
      <Suspense fallback={<LoadingModel />}>
        <GLTFModel 
          category={modelType} 
          isSelected={isSelected} 
          hovered={hovered} 
        />
      </Suspense>
    );
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onSelect();
  };

  const handlePointerMove = () => {
    // Add drag functionality here
  };

  const handlePointerUp = () => {
    // Add drag end functionality here
  };

  // Debug logging for rotation
  console.log(`🔄 Real3DFurniture: ${furniture.name} rotation:`, furniture.rotation);

  return (
    <group
      ref={meshRef}
      position={[furniture.position.x, furniture.position.y, furniture.position.z]}
      rotation={[furniture.rotation.x, furniture.rotation.y, furniture.rotation.z]}
      scale={furniture.scale * 0.5}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {getModel()}
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -(furniture.scale * 0.5) / 2 - 0.1, 0]}>
          <ringGeometry args={[(furniture.scale * 0.5) * 0.6, (furniture.scale * 0.5) * 0.7, 32]} />
          <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}


// Simple loading model - just shows nothing while loading
function LoadingModel() {
  return null;
}