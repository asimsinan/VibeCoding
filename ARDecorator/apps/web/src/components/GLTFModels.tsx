import { Box, Cylinder, Sphere, useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

// Local GLTF model URLs with cache busting
const CACHE_VERSION = '6.6'; // Increment this when models are updated
const TIMESTAMP = Date.now(); // Force reload on every page load
const MODEL_URLS = {
  chair: `/models/Iskandinav.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  egg_chair: `/models/Egg.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  scandinavian_chair: `/models/Iskandinav.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  glass_table: `/models/GlassTable.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  oak_table: `/models/OakTable.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  velvet_sofa: `/models/VelvetSofa.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  bookshelf: `/models/Bookshelf.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  side_table: `/models/SideTable.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  rug: `/models/Rug.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  mona_lisa: `/models/Monalisa.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  table_lamp: `/models/TableLamp.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  wall_mirror: `/models/WallMirror.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  floor_lamp: `/models/FloorLamp.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  tv_console: `/models/TvConsole.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  tv: `/models/Tv.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  dresser: `/models/Dresser.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
  chandelier: `/models/Chandelier.glb?v=${CACHE_VERSION}&t=${TIMESTAMP}`,
};

// Preload all models
Object.values(MODEL_URLS).forEach(url => {
  useGLTF.preload(url);
});

interface GLTFModelProps {
  category: string;
  isSelected: boolean;
  hovered: boolean;
}

export function GLTFModel({ category, isSelected, hovered }: GLTFModelProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Debug logging
  console.log(`🎨 GLTFModel: Rendering ${category} (selected: ${isSelected}, hovered: ${hovered})`);

  // Try to load local GLTF model first
  const modelUrl = MODEL_URLS[category as keyof typeof MODEL_URLS];
  
  console.log(`🔍 GLTFModel: Looking for ${category} in MODEL_URLS:`, { modelUrl, availableKeys: Object.keys(MODEL_URLS) });

  if (modelUrl) {
    try {
      console.log(`🔄 GLTFModel: Attempting to load ${category} from ${modelUrl}`);
      const { scene } = useGLTF(modelUrl);
      console.log(`✅ GLTFModel: Successfully loaded ${category} GLTF model`);

      // Define specific scales for different models to fit room dimensions
      const getModelScale = (category: string) => {
        switch (category) {
          case 'oak_table':
            return [0.01, 0.01, 0.01];
            case 'chandelier':
            return [0.2, 0.2, 0.2];
          case 'table_lamp':
            return [0.02, 0.02, 0.02];
          case 'wall_mirror':
            return [1.0, 1.0, 1.0]; // Default scale for Wall Mirror
          case 'chandelier':
            return [0.5, 0.3, 0.5]; // Scale for Chandelier - shorter height
          case 'floor_lamp':
            return [1.0, 1.0, 1.0]; // Scale for Floor Lamp
          case 'tv_console':
            return [1.0, 1.0, 1.0]; // Scale for TV Console
          case 'tv':
            return [1.0, 1.0, 1.0]; // Scale down TV for better movement
          case 'dresser':
            return [1.0, 1.0, 1.0]; // Scale for Dresser
          case 'bookshelf':
            return [0.8, 0.8, 0.8]; // Scale down bookshelf to fit in room
          case 'side_table':
            return [2, 2, 2];
          case 'velvet_sofa':
            return [0.3, 0.3, 0.3];// Scale down oak table to 3% - much smaller
          case 'glass_table':
            return [1.0, 1.0, 1.0]; // Scale up glass table to 15% - more visible
          case 'egg_chair':
            return [1.0, 1.0, 1.0]; // Scale up egg chair to 12% - more visible
          case 'scandinavian_chair':
            return [1.50, 1.50, 1.50]; 
          case 'rug':
            return [1.2, 1.2, 1.2]; 
          case 'mona_lisa':
            return [0.02, 0.02, 0.02]; // Default scale for Mona Lisa   
          case 'table_lamp':
            return [1.0, 1.0, 1.0]; // Default scale for Table Lamp
          default:
            return [0.5, 0.5, 0.5]; // Default scale for other models - room appropriate
        }
      };

      const scale = getModelScale(category);

      // Clone the scene and reset its rotation to ensure parent rotation works
      const clonedScene = scene.clone();
      clonedScene.rotation.set(0, 0, 0); // Reset rotation to ensure parent rotation is applied
      
      // Basic floor positioning for floor items only
      const floorItems = ['floor_lamp', 'rug', 'carpet', 'mat'];
      const isFloorItem = floorItems.some(item => category.includes(item));
      
      if (isFloorItem) {
        // Calculate bounding box to find the bottom of the model
        const box = new THREE.Box3().setFromObject(clonedScene);
        const bottomY = box.min.y;
        const topY = box.max.y;
        const height = topY - bottomY;
        
        console.log(`📏 GLTFModel ${category}: Bounding box - bottomY: ${bottomY}, topY: ${topY}, height: ${height}`);
        
        // For rugs specifically, force them to be flat on the floor
        if (category.includes('rug')) {
          clonedScene.position.y = 0;
          console.log(`🪞 GLTFModel ${category}: Rug forced to Y=0 (floor level)`);
        } else {
          // Adjust position so the bottom sits at Y=0 (floor level)
          if (bottomY < 0) {
            clonedScene.position.y = -bottomY;
            console.log(`🏠 GLTFModel ${category}: Floor item positioned at Y=${clonedScene.position.y} (bottomY: ${bottomY})`);
          }
        }
      }
      
      console.log(`🎯 GLTFModel ${category}: Model loaded - parent handles positioning`);

      return (
        <group ref={meshRef}>
          <primitive
            object={clonedScene}
            scale={scale}
            castShadow
            receiveShadow
          />
        </group>
      );
    } catch (error) {
      console.error(`❌ GLTFModel: Failed to load ${category} from ${modelUrl}:`, error);
    }
  }

  // If no model URL, show fallback
  console.log(`⚠️ GLTFModel: No model URL for ${category}, showing fallback`);
  return <FallbackModel category={category} isSelected={isSelected} hovered={hovered} />;
}

// Realistic procedural models as fallbacks
function FallbackModel({ category, isSelected, hovered }: GLTFModelProps) {

  console.log(`🏠 FallbackModel: Creating ${category} model`);

  switch (category) {
    case 'sofa':
    case 'velvet_sofa':
      return <RealisticSofa isSelected={isSelected} hovered={hovered} />;
    case 'chair':
    case 'egg_chair':
    case 'scandinavian_chair':
      return <RealisticChair isSelected={isSelected} hovered={hovered} />;
    case 'table':
    case 'glass_table':
    case 'oak_table':
    case 'side_table':
      return <RealisticTable isSelected={isSelected} hovered={hovered} />;
    case 'bookshelf':
      return <RealisticBookshelf isSelected={isSelected} hovered={hovered} />;
    case 'lamp':
      return <RealisticLamp isSelected={isSelected} hovered={hovered} />;
    case 'tv':
      return <RealisticTV isSelected={isSelected} hovered={hovered} />;
    case 'bed':
      return <RealisticBed isSelected={isSelected} hovered={hovered} />;
    case 'desk':
      return <RealisticDesk isSelected={isSelected} hovered={hovered} />;
    case 'wardrobe':
      return <RealisticWardrobe isSelected={isSelected} hovered={hovered} />;
    case 'dining_table':
      return <RealisticDiningTable isSelected={isSelected} hovered={hovered} />;
    case 'mirror':
      return <RealisticMirror isSelected={isSelected} hovered={hovered} />;
    case 'wall_art':
      return <RealisticWallArt isSelected={isSelected} hovered={hovered} />;
    case 'tv_console':
      return <RealisticTVConsole isSelected={isSelected} hovered={hovered} />;
    case 'rug':
      return <RealisticRug isSelected={isSelected} hovered={hovered} />;
    case 'mona_lisa':
      return <RealisticMonaLisa isSelected={isSelected} hovered={hovered} />;
    case 'table_lamp':
      return <RealisticTableLamp isSelected={isSelected} hovered={hovered} />;
    case 'wall_mirror':
      return <RealisticWallMirror isSelected={isSelected} hovered={hovered} />;
    case 'chandelier':
      return <RealisticChandelier isSelected={isSelected} hovered={hovered} />;
    case 'floor_lamp':
      return <RealisticFloorLamp isSelected={isSelected} hovered={hovered} />;
    case 'tv_console':
      return <RealisticTVConsole isSelected={isSelected} hovered={hovered} />;
    case 'tv':
      return <RealisticTV isSelected={isSelected} hovered={hovered} />;
    case 'dresser':
      return <RealisticDresser isSelected={isSelected} hovered={hovered} />;
    default:
      console.log(`⚠️ Unknown category: ${category}, using sofa as default`);
      return <RealisticSofa isSelected={isSelected} hovered={hovered} />;
  }
}

// Import materials for realistic fallback models
import { createWoodMaterial, createFabricMaterial, createMetalMaterial, createLeatherMaterial } from '../lib/materials';

// Fallback realistic models
function RealisticSofa({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic wood and fabric materials
  const woodMaterial = createWoodMaterial('mahogany');
  const fabricMaterial = createFabricMaterial('velvet', '#8B4513');
  const legMaterial = createWoodMaterial('walnut');

  return (
    <group ref={meshRef}>
      {/* Main seat base */}
      <Box args={[2.2, 0.5, 1]} position={[0, 0.25, 0]} castShadow receiveShadow material={woodMaterial} />

      {/* Seat cushions */}
      <Box args={[0.65, 0.2, 0.9]} position={[-0.75, 0.6, 0]} castShadow material={fabricMaterial} />
      <Box args={[0.65, 0.2, 0.9]} position={[0, 0.6, 0]} castShadow material={fabricMaterial} />
      <Box args={[0.65, 0.2, 0.9]} position={[0.75, 0.6, 0]} castShadow material={fabricMaterial} />

      {/* Back cushions */}
      <Box args={[0.65, 0.4, 0.1]} position={[-0.75, 0.9, -0.4]} castShadow material={fabricMaterial} />
      <Box args={[0.65, 0.4, 0.1]} position={[0, 0.9, -0.4]} castShadow material={fabricMaterial} />
      <Box args={[0.65, 0.4, 0.1]} position={[0.75, 0.9, -0.4]} castShadow material={fabricMaterial} />

      {/* Sofa legs */}
      <Cylinder args={[0.05, 0.05, 0.25]} position={[-0.9, 0.125, -0.4]} castShadow material={legMaterial} />
      <Cylinder args={[0.05, 0.05, 0.25]} position={[0.9, 0.125, -0.4]} castShadow material={legMaterial} />
      <Cylinder args={[0.05, 0.05, 0.25]} position={[-0.9, 0.125, 0.4]} castShadow material={legMaterial} />
      <Cylinder args={[0.05, 0.05, 0.25]} position={[0.9, 0.125, 0.4]} castShadow material={legMaterial} />
    </group>
  );
}

function RealisticChair({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const woodMaterial = createWoodMaterial('oak');
  const leatherMaterial = createLeatherMaterial('brown', '#8B4513');

  return (
    <group ref={meshRef}>
      {/* Seat */}
      <Box args={[0.6, 0.05, 0.6]} position={[0, 0.3, 0]} castShadow material={leatherMaterial} />

      {/* Back rest */}
      <Box args={[0.6, 0.8, 0.05]} position={[0, 0.7, -0.275]} castShadow material={leatherMaterial} />

      {/* Chair legs */}
      <Cylinder args={[0.03, 0.03, 0.3]} position={[-0.25, 0.15, -0.25]} castShadow material={woodMaterial} />
      <Cylinder args={[0.03, 0.03, 0.3]} position={[0.25, 0.15, -0.25]} castShadow material={woodMaterial} />
      <Cylinder args={[0.03, 0.03, 0.3]} position={[-0.25, 0.15, 0.25]} castShadow material={woodMaterial} />
      <Cylinder args={[0.03, 0.03, 0.3]} position={[0.25, 0.15, 0.25]} castShadow material={woodMaterial} />

      {/* Armrests */}
      <Box args={[0.05, 0.3, 0.4]} position={[-0.3, 0.5, 0]} castShadow material={woodMaterial} />
      <Box args={[0.05, 0.3, 0.4]} position={[0.3, 0.5, 0]} castShadow material={woodMaterial} />
    </group>
  );
}

function RealisticTable({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const topMaterial = createWoodMaterial('pine');
  const legMaterial = createWoodMaterial('oak');

  return (
    <group ref={meshRef}>
      {/* Table top */}
      <Box args={[1.2, 0.08, 0.6]} position={[0, 0.75, 0]} castShadow receiveShadow material={topMaterial} />

      {/* Table legs */}
      <Cylinder args={[0.05, 0.05, 0.7]} position={[-0.5, 0.35, -0.2]} castShadow material={legMaterial} />
      <Cylinder args={[0.05, 0.05, 0.7]} position={[0.5, 0.35, -0.2]} castShadow material={legMaterial} />
      <Cylinder args={[0.05, 0.05, 0.7]} position={[-0.5, 0.35, 0.2]} castShadow material={legMaterial} />
      <Cylinder args={[0.05, 0.05, 0.7]} position={[0.5, 0.35, 0.2]} castShadow material={legMaterial} />

      {/* Table apron */}
      <Box args={[1.0, 0.05, 0.05]} position={[0, 0.4, -0.25]} castShadow material={legMaterial} />
      <Box args={[1.0, 0.05, 0.05]} position={[0, 0.4, 0.25]} castShadow material={legMaterial} />
      <Box args={[0.05, 0.05, 0.4]} position={[-0.45, 0.4, 0]} castShadow material={legMaterial} />
      <Box args={[0.05, 0.05, 0.4]} position={[0.45, 0.4, 0]} castShadow material={legMaterial} />
    </group>
  );
}

function RealisticBookshelf({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const woodMaterial = createWoodMaterial('walnut');

  return (
    <group ref={meshRef}>
      {/* Main frame */}
      <Box args={[0.8, 1.8, 0.3]} position={[0, 0.9, 0]} castShadow material={woodMaterial} />

      {/* Shelves */}
      <Box args={[0.7, 0.02, 0.25]} position={[0, 0.3, 0]} castShadow material={woodMaterial} />
      <Box args={[0.7, 0.02, 0.25]} position={[0, 0.9, 0]} castShadow material={woodMaterial} />
      <Box args={[0.7, 0.02, 0.25]} position={[0, 1.5, 0]} castShadow material={woodMaterial} />

      {/* Books */}
      <Box args={[0.05, 0.25, 0.2]} position={[-0.25, 0.4, 0]} castShadow material={createWoodMaterial('mahogany')} />
      <Box args={[0.05, 0.25, 0.2]} position={[-0.15, 0.4, 0]} castShadow material={createWoodMaterial('oak')} />
      <Box args={[0.05, 0.25, 0.2]} position={[-0.05, 0.4, 0]} castShadow material={createWoodMaterial('pine')} />
      <Box args={[0.05, 0.25, 0.2]} position={[0.05, 0.4, 0]} castShadow material={createWoodMaterial('walnut')} />
      <Box args={[0.05, 0.25, 0.2]} position={[0.15, 0.4, 0]} castShadow material={createWoodMaterial('mahogany')} />
      <Box args={[0.05, 0.25, 0.2]} position={[0.25, 0.4, 0]} castShadow material={createWoodMaterial('oak')} />
    </group>
  );
}

function RealisticLamp({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const metalMaterial = createMetalMaterial('brass');
  const fabricMaterial = createFabricMaterial('linen', '#f5f5f5');

  return (
    <group ref={meshRef}>
      {/* Lamp base */}
      <Cylinder args={[0.15, 0.2, 0.1]} position={[0, 0.05, 0]} castShadow material={metalMaterial} />

      {/* Lamp pole */}
      <Cylinder args={[0.02, 0.02, 1.2]} position={[0, 0.7, 0]} castShadow material={metalMaterial} />

      {/* Lamp shade */}
      <Cylinder args={[0.3, 0.25, 0.4]} position={[0, 1.1, 0]} castShadow material={fabricMaterial} />

      {/* Light bulb (glowing) */}
      <Sphere args={[0.05]} position={[0, 1.0, 0]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />
    </group>
  );
}

function RealisticTV({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const frameMaterial = createMetalMaterial('steel');
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: '#ffffff',
    emissiveIntensity: 1.0,
    metalness: 0.0,
    roughness: 0.1
  });

  return (
    <group ref={meshRef}>
      {/* TV Frame */}
      <Box args={[1.2, 0.8, 0.1]} position={[0, 0.6, 0]} castShadow material={frameMaterial} />

      {/* TV Screen */}
      <Box args={[1.0, 0.6, 0.02]} position={[0, 0.6, 0.04]} castShadow material={screenMaterial} />

      {/* TV Screen Content Layer */}
      <Box args={[0.95, 0.55, 0.01]} position={[0, 0.6, 0.05]} material={new THREE.MeshBasicMaterial({ color: '#ffffff' })} />

      {/* TV Stand */}
      <Box args={[1.4, 0.1, 0.3]} position={[0, 0.1, 0]} castShadow material={frameMaterial} />

      {/* Screen glow */}
      <Box args={[1.05, 0.65, 0.01]} position={[0, 0.6, 0.06]} material={new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3 })} />
    </group>
  );
}

function RealisticBed({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const woodMaterial = createWoodMaterial('oak');
  const fabricMaterial = createFabricMaterial('cotton', '#f0f0f0');

  return (
    <group ref={meshRef}>
      {/* Bed frame */}
      <Box args={[2.0, 0.1, 1.5]} position={[0, 0.05, 0]} castShadow material={woodMaterial} />

      {/* Mattress */}
      <Box args={[1.8, 0.3, 1.3]} position={[0, 0.25, 0]} castShadow material={fabricMaterial} />

      {/* Pillows */}
      <Box args={[0.6, 0.2, 0.4]} position={[-0.4, 0.5, 0.3]} castShadow material={fabricMaterial} />
      <Box args={[0.6, 0.2, 0.4]} position={[0.4, 0.5, 0.3]} castShadow material={fabricMaterial} />

      {/* Headboard */}
      <Box args={[2.0, 0.8, 0.1]} position={[0, 0.6, -0.7]} castShadow material={woodMaterial} />
    </group>
  );
}

function RealisticDesk({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const topMaterial = createWoodMaterial('walnut');
  const legMaterial = createWoodMaterial('oak');

  return (
    <group ref={meshRef}>
      {/* Desk top */}
      <Box args={[1.6, 0.05, 0.8]} position={[0, 0.8, 0]} castShadow receiveShadow material={topMaterial} />

      {/* Desk legs */}
      <Cylinder args={[0.04, 0.04, 0.8]} position={[-0.7, 0.4, -0.3]} castShadow material={legMaterial} />
      <Cylinder args={[0.04, 0.04, 0.8]} position={[0.7, 0.4, -0.3]} castShadow material={legMaterial} />
      <Cylinder args={[0.04, 0.04, 0.8]} position={[-0.7, 0.4, 0.3]} castShadow material={legMaterial} />
      <Cylinder args={[0.04, 0.04, 0.8]} position={[0.7, 0.4, 0.3]} castShadow material={legMaterial} />

      {/* Drawers */}
      <Box args={[0.3, 0.4, 0.6]} position={[-0.5, 0.4, 0]} castShadow material={legMaterial} />
      <Box args={[0.3, 0.4, 0.6]} position={[0.5, 0.4, 0]} castShadow material={legMaterial} />
    </group>
  );
}

function RealisticWardrobe({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const woodMaterial = createWoodMaterial('mahogany');
  const handleMaterial = createMetalMaterial('brass');

  return (
    <group ref={meshRef}>
      {/* Main wardrobe body */}
      <Box args={[1.2, 2.0, 0.6]} position={[0, 1.0, 0]} castShadow material={woodMaterial} />

      {/* Doors */}
      <Box args={[0.55, 1.8, 0.05]} position={[-0.3, 1.0, 0.3]} castShadow material={woodMaterial} />
      <Box args={[0.55, 1.8, 0.05]} position={[0.3, 1.0, 0.3]} castShadow material={woodMaterial} />

      {/* Door handles */}
      <Cylinder args={[0.02, 0.02, 0.1]} position={[-0.1, 1.0, 0.35]} castShadow material={handleMaterial} />
      <Cylinder args={[0.02, 0.02, 0.1]} position={[0.1, 1.0, 0.35]} castShadow material={handleMaterial} />

      {/* Shelves */}
      <Box args={[1.0, 0.02, 0.4]} position={[0, 0.5, 0]} castShadow material={woodMaterial} />
      <Box args={[1.0, 0.02, 0.4]} position={[0, 1.5, 0]} castShadow material={woodMaterial} />
    </group>
  );
}

function RealisticDiningTable({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const topMaterial = createWoodMaterial('pine');
  const legMaterial = createWoodMaterial('oak');

  return (
    <group ref={meshRef}>
      {/* Table top */}
      <Box args={[1.8, 0.08, 1.0]} position={[0, 0.8, 0]} castShadow receiveShadow material={topMaterial} />

      {/* Table legs */}
      <Cylinder args={[0.06, 0.06, 0.8]} position={[-0.7, 0.4, -0.4]} castShadow material={legMaterial} />
      <Cylinder args={[0.06, 0.06, 0.8]} position={[0.7, 0.4, -0.4]} castShadow material={legMaterial} />
      <Cylinder args={[0.06, 0.06, 0.8]} position={[-0.7, 0.4, 0.4]} castShadow material={legMaterial} />
      <Cylinder args={[0.06, 0.06, 0.8]} position={[0.7, 0.4, 0.4]} castShadow material={legMaterial} />

      {/* Table apron */}
      <Box args={[1.6, 0.05, 0.05]} position={[0, 0.5, -0.45]} castShadow material={legMaterial} />
      <Box args={[1.6, 0.05, 0.05]} position={[0, 0.5, 0.45]} castShadow material={legMaterial} />
      <Box args={[0.05, 0.05, 0.8]} position={[-0.75, 0.5, 0]} castShadow material={legMaterial} />
      <Box args={[0.05, 0.05, 0.8]} position={[0.75, 0.5, 0]} castShadow material={legMaterial} />
    </group>
  );
}

function RealisticMirror({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const frameMaterial = createWoodMaterial('mahogany');
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: '#c0c0c0',
    metalness: 0.8,
    roughness: 0.1
  });

  return (
    <group ref={meshRef}>
      {/* Mirror frame */}
      <Box args={[0.8, 1.2, 0.1]} position={[0, 0.8, 0]} castShadow material={frameMaterial} />

      {/* Mirror surface */}
      <Box args={[0.6, 0.8, 0.02]} position={[0, 0.8, 0.04]} castShadow material={mirrorMaterial} />
    </group>
  );
}

function RealisticWallArt({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const frameMaterial = createWoodMaterial('oak');
  const canvasMaterial = createFabricMaterial('canvas', '#f5f5f0');

  return (
    <group ref={meshRef}>
      {/* Picture frame */}
      <Box args={[0.6, 0.8, 0.05]} position={[0, 0.8, 0]} castShadow material={frameMaterial} />

      {/* Canvas */}
      <Box args={[0.5, 0.6, 0.01]} position={[0, 0.8, 0.02]} castShadow material={canvasMaterial} />
    </group>
  );
}

function RealisticTVConsole({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const woodMaterial = createWoodMaterial('walnut');
  const metalMaterial = createMetalMaterial('steel');

  return (
    <group ref={meshRef}>
      {/* Main console body */}
      <Box args={[1.6, 0.6, 0.4]} position={[0, 0.3, 0]} castShadow material={woodMaterial} />

      {/* Top surface */}
      <Box args={[1.6, 0.05, 0.4]} position={[0, 0.625, 0]} castShadow material={woodMaterial} />

      {/* Drawers */}
      <Box args={[0.4, 0.3, 0.35]} position={[-0.4, 0.3, 0]} castShadow material={woodMaterial} />
      <Box args={[0.4, 0.3, 0.35]} position={[0, 0.3, 0]} castShadow material={woodMaterial} />
      <Box args={[0.4, 0.3, 0.35]} position={[0.4, 0.3, 0]} castShadow material={woodMaterial} />

      {/* Drawer handles */}
      <Cylinder args={[0.02, 0.02, 0.1]} position={[-0.4, 0.3, 0.2]} castShadow material={metalMaterial} />
      <Cylinder args={[0.02, 0.02, 0.1]} position={[0, 0.3, 0.2]} castShadow material={metalMaterial} />
      <Cylinder args={[0.02, 0.02, 0.1]} position={[0.4, 0.3, 0.2]} castShadow material={metalMaterial} />
    </group>
  );
}

function RealisticRug({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const rugMaterial = createFabricMaterial('cotton', '#8B4513');

  return (
    <group ref={meshRef}>
      {/* Rug */}
      <Box args={[2.0, 0.02, 1.5]} position={[0, 0.01, 0]} castShadow receiveShadow material={rugMaterial} />
    </group>
  );
}

function RealisticMonaLisa({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const frameMaterial = createWoodMaterial('mahogany');
  const canvasMaterial = createFabricMaterial('canvas', '#8B4513');
  const brassMaterial = createMetalMaterial('brass');

  return (
    <group ref={meshRef}>
      {/* Picture frame */}
      <Box args={[0.8, 1.0, 0.08]} position={[0, 0.8, 0]} castShadow material={frameMaterial} />

      {/* Canvas */}
      <Box args={[0.6, 0.7, 0.01]} position={[0, 0.8, 0.035]} castShadow material={canvasMaterial} />

      {/* Brass corner details */}
      <Box args={[0.05, 0.05, 0.02]} position={[-0.35, 0.45, 0.04]} castShadow material={brassMaterial} />
      <Box args={[0.05, 0.05, 0.02]} position={[0.35, 0.45, 0.04]} castShadow material={brassMaterial} />
      <Box args={[0.05, 0.05, 0.02]} position={[-0.35, 1.15, 0.04]} castShadow material={brassMaterial} />
      <Box args={[0.05, 0.05, 0.02]} position={[0.35, 1.15, 0.04]} castShadow material={brassMaterial} />
    </group>
  );
}

function RealisticTableLamp({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const baseMaterial = createWoodMaterial('walnut');
  const poleMaterial = createMetalMaterial('brass');
  const shadeMaterial = createFabricMaterial('linen', '#f5f5f5');
  const switchMaterial = createMetalMaterial('steel');

  return (
    <group ref={meshRef}>
      {/* Lamp base */}
      <Cylinder args={[0.12, 0.15, 0.08]} position={[0, 0.04, 0]} castShadow material={baseMaterial} />

      {/* Lamp pole */}
      <Cylinder args={[0.015, 0.015, 0.6]} position={[0, 0.35, 0]} castShadow material={poleMaterial} />

      {/* Lamp shade */}
      <Cylinder args={[0.25, 0.2, 0.3]} position={[0, 0.7, 0]} castShadow material={shadeMaterial} />

      {/* Light switch */}
      <Box args={[0.02, 0.03, 0.01]} position={[0.08, 0.3, 0]} castShadow material={switchMaterial} />

      {/* Light bulb (glowing) */}
      <Sphere args={[0.03]} position={[0, 0.6, 0]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />
    </group>
  );
}

function RealisticWallMirror({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const frameMaterial = createWoodMaterial('walnut');
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: '#c0c0c0',
    metalness: 0.8,
    roughness: 0.1
  });

  return (
    <group ref={meshRef}>
      {/* Mirror frame */}
      <Box args={[0.8, 1.0, 0.08]} position={[0, 0.8, 0]} castShadow material={frameMaterial} />

      {/* Mirror surface */}
      <Box args={[0.6, 0.7, 0.01]} position={[0, 0.8, 0.04]} castShadow material={mirrorMaterial} />
    </group>
  );
}

function RealisticChandelier({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const metalMaterial = createMetalMaterial('brass');
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#f0f0f0',
    transparent: true,
    opacity: 0.8,
    metalness: 0.1,
    roughness: 0.1
  });

  return (
    <group ref={meshRef}>
      {/* Main chandelier body */}
      <Cylinder args={[0.15, 0.2, 0.3]} position={[0, 2.2, 0]} castShadow material={metalMaterial} />

      {/* Chandelier arms */}
      <Cylinder args={[0.02, 0.02, 0.4]} position={[-0.2, 2.0, 0]} castShadow material={metalMaterial} />
      <Cylinder args={[0.02, 0.02, 0.4]} position={[0.2, 2.0, 0]} castShadow material={metalMaterial} />
      <Cylinder args={[0.02, 0.02, 0.4]} position={[0, 2.0, -0.2]} castShadow material={metalMaterial} />
      <Cylinder args={[0.02, 0.02, 0.4]} position={[0, 2.0, 0.2]} castShadow material={metalMaterial} />

      {/* Light bulbs */}
      <Sphere args={[0.05]} position={[-0.2, 1.8, 0]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />
      <Sphere args={[0.05]} position={[0.2, 1.8, 0]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />
      <Sphere args={[0.05]} position={[0, 1.8, -0.2]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />
      <Sphere args={[0.05]} position={[0, 1.8, 0.2]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />

      {/* Glass shades */}
      <Sphere args={[0.08]} position={[-0.2, 1.8, 0]} material={glassMaterial} />
      <Sphere args={[0.08]} position={[0.2, 1.8, 0]} material={glassMaterial} />
      <Sphere args={[0.08]} position={[0, 1.8, -0.2]} material={glassMaterial} />
      <Sphere args={[0.08]} position={[0, 1.8, 0.2]} material={glassMaterial} />
    </group>
  );
}

function RealisticFloorLamp({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const baseMaterial = createMetalMaterial('steel');
  const poleMaterial = createMetalMaterial('brass');
  const shadeMaterial = createFabricMaterial('linen', '#f5f5f5');

  return (
    <group ref={meshRef}>
      {/* Lamp base */}
      <Cylinder args={[0.2, 0.25, 0.1]} position={[0, 0.05, 0]} castShadow material={baseMaterial} />

      {/* Lamp pole */}
      <Cylinder args={[0.02, 0.02, 1.8]} position={[0, 1.0, 0]} castShadow material={poleMaterial} />

      {/* Lamp shade */}
      <Cylinder args={[0.4, 0.3, 0.5]} position={[0, 1.6, 0]} castShadow material={shadeMaterial} />

      {/* Light bulb (glowing) */}
      <Sphere args={[0.08]} position={[0, 1.4, 0]} material={new THREE.MeshBasicMaterial({ color: '#ffff88' })} />
    </group>
  );
}

function RealisticDresser({ }: { isSelected: boolean; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Use realistic materials
  const woodMaterial = createWoodMaterial('oak');
  const handleMaterial = createMetalMaterial('brass');

  return (
    <group ref={meshRef}>
      {/* Main dresser body */}
      <Box args={[1.4, 0.8, 0.5]} position={[0, 0.4, 0]} castShadow material={woodMaterial} />

      {/* Drawers */}
      <Box args={[0.6, 0.15, 0.45]} position={[-0.3, 0.2, 0]} castShadow material={woodMaterial} />
      <Box args={[0.6, 0.15, 0.45]} position={[0.3, 0.2, 0]} castShadow material={woodMaterial} />
      <Box args={[0.6, 0.15, 0.45]} position={[-0.3, 0.5, 0]} castShadow material={woodMaterial} />
      <Box args={[0.6, 0.15, 0.45]} position={[0.3, 0.5, 0]} castShadow material={woodMaterial} />

      {/* Drawer handles */}
      <Cylinder args={[0.02, 0.02, 0.1]} position={[-0.1, 0.2, 0.25]} castShadow material={handleMaterial} />
      <Cylinder args={[0.02, 0.02, 0.1]} position={[0.1, 0.2, 0.25]} castShadow material={handleMaterial} />
      <Cylinder args={[0.02, 0.02, 0.1]} position={[-0.1, 0.5, 0.25]} castShadow material={handleMaterial} />
      <Cylinder args={[0.02, 0.02, 0.1]} position={[0.1, 0.5, 0.25]} castShadow material={handleMaterial} />

      {/* Top surface */}
      <Box args={[1.4, 0.05, 0.5]} position={[0, 0.825, 0]} castShadow material={woodMaterial} />
    </group>
  );
}