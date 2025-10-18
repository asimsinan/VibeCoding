import * as THREE from 'three';
import { MATERIAL_CONFIGS } from './textures';

// Create realistic materials using actual texture images
export const createRealisticMaterial = (materialType: 'wood' | 'fabric' | 'metal' | 'leather', color?: string) => {
  const config = MATERIAL_CONFIGS[materialType];
  
  // Create texture loader
  const loader = new THREE.TextureLoader();
  
  // Load base texture
  const map = loader.load(config.texture);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.anisotropy = 16;
  
  // Load normal map for surface detail
  const normalMap = loader.load(config.normalMap);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2, 2);
  
  // Load roughness map for material variation
  const roughnessMap = loader.load(config.roughnessMap);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  
  // Create material with realistic properties
  const material = new THREE.MeshStandardMaterial({
    map: map,
    normalMap: normalMap,
    roughnessMap: roughnessMap,
    roughness: config.roughness,
    metalness: config.metalness,
    color: color || config.color,
    side: THREE.DoubleSide,
  });
  
  return material;
};

// Enhanced wood material with multiple wood types
export const createWoodMaterial = (woodType: 'oak' | 'pine' | 'mahogany' | 'walnut' = 'oak', color?: string) => {
  const woodColors = {
    oak: '#8B4513',
    pine: '#D2B48C',
    mahogany: '#C04000',
    walnut: '#5C4033',
  };
  
  // Use simple material instead of texture loading to avoid shininess
  return new THREE.MeshStandardMaterial({
    color: color || woodColors[woodType],
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
};

// Enhanced fabric material with different fabric types
export const createFabricMaterial = (fabricType: 'cotton' | 'linen' | 'velvet' | 'canvas' = 'cotton', color?: string) => {
  const fabricColors = {
    cotton: '#654321',
    linen: '#F5F5DC',
    velvet: '#4B0082',
    canvas: '#F0E68C',
  };
  
  // Special handling for velvet to create realistic velvet appearance
  if (fabricType === 'velvet') {
    return createCustomMaterial({
      color: color || fabricColors.velvet,
      roughness: 0.95, // Very high roughness for velvet's matte appearance
      metalness: 0.0,  // No metalness for fabric
    });
  }
  
  return createRealisticMaterial('fabric', color || fabricColors[fabricType]);
};

// Enhanced metal material with different metal types
export const createMetalMaterial = (metalType: 'steel' | 'brass' | 'copper' | 'aluminum' = 'steel', color?: string) => {
  const metalColors = {
    steel: '#C0C0C0',
    brass: '#B87333',
    copper: '#B87333',
    aluminum: '#D3D3D3',
  };
  
  const metalness = {
    steel: 0.5,
    brass: 0.4,
    copper: 0.4,
    aluminum: 0.6,
  };
  
  // Use simple material instead of texture loading to avoid excessive shine
  return new THREE.MeshStandardMaterial({
    color: color || metalColors[metalType],
    roughness: 0.6,
    metalness: metalness[metalType],
    side: THREE.DoubleSide,
  });
};

// Enhanced leather material with different leather types
export const createLeatherMaterial = (leatherType: 'brown' | 'black' | 'tan' | 'red' = 'brown', color?: string) => {
  const leatherColors = {
    brown: '#8B4513',
    black: '#2F2F2F',
    tan: '#D2B48C',
    red: '#8B0000',
  };
  
  // Use simple material instead of texture loading to avoid shininess
  return new THREE.MeshStandardMaterial({
    color: color || leatherColors[leatherType],
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
};

// Create a material with custom properties
export const createCustomMaterial = (options: {
  texture?: string;
  normalMap?: string;
  roughnessMap?: string;
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) => {
  const loader = new THREE.TextureLoader();
  
  const material = new THREE.MeshStandardMaterial({
    color: options.color || '#ffffff',
    roughness: options.roughness || 0.5,
    metalness: options.metalness || 0.0,
    emissive: options.emissive ? new THREE.Color(options.emissive) : undefined,
    emissiveIntensity: options.emissiveIntensity || 0,
    side: THREE.DoubleSide,
  });
  
  if (options.texture) {
    const map = loader.load(options.texture);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);
    map.anisotropy = 16;
    material.map = map;
  }
  
  if (options.normalMap) {
    const normalMap = loader.load(options.normalMap);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(2, 2);
    material.normalMap = normalMap;
  }
  
  if (options.roughnessMap) {
    const roughnessMap = loader.load(options.roughnessMap);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(2, 2);
    material.roughnessMap = roughnessMap;
  }
  
  return material;
};
