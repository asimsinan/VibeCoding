#!/usr/bin/env node
/**
 * Test script for enhanced SAM wall detection
 * This script tests the iterative refinement and fallback mechanisms
 */

import { SAM2Analyzer } from './src/lib/sam2Analyzer.js';

async function testSAMWallDetection() {
  console.log('🧪 Testing Enhanced SAM Wall Detection');
  
  const analyzer = new SAM2Analyzer();
  
  try {
    // Create a test image file (you can replace this with an actual room photo)
    const testImageData = createTestRoomImage();
    const testFile = new File([testImageData], 'test-room.jpg', { type: 'image/jpeg' });
    
    console.log('🔍 Running SAM analysis on test image...');
    const result = await analyzer.analyzeRoom(testFile);
    
    console.log('✅ SAM Analysis Results:');
    console.log(`📊 Success: ${result.success}`);
    console.log(`📊 Surfaces Detected: ${result.analysis.surfacesDetected}`);
    console.log(`📊 Room Dimensions: ${result.analysis.roomDimensions.width}x${result.analysis.roomDimensions.height}`);
    
    if (result.analysis.surfaces) {
      console.log('🏠 Detected Surfaces:');
      result.analysis.surfaces.forEach((surface, index) => {
        console.log(`  ${index + 1}. ${surface.type} (confidence: ${surface.confidence.toFixed(2)})`);
        console.log(`     Bounds: ${surface.bounds.x},${surface.bounds.y} ${surface.bounds.width}x${surface.bounds.height}`);
      });
      
      // Check if all essential walls are detected
      const surfaceTypes = result.analysis.surfaces.map(s => s.type);
      const essentialWalls = ['left_wall', 'right_wall', 'back_wall'];
      const detectedWalls = essentialWalls.filter(wall => surfaceTypes.includes(wall));
      
      console.log('🔍 Wall Detection Summary:');
      console.log(`  Essential walls: ${essentialWalls.join(', ')}`);
      console.log(`  Detected walls: ${detectedWalls.join(', ')}`);
      console.log(`  Missing walls: ${essentialWalls.filter(wall => !detectedWalls.includes(wall)).join(', ')}`);
      
      if (detectedWalls.length === essentialWalls.length) {
        console.log('✅ All essential walls detected!');
      } else {
        console.log('⚠️ Some walls missing - fallback mechanism should have added them');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function createTestRoomImage(): ArrayBuffer {
  // Create a simple test image with room-like structure
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  canvas.width = 800;
  canvas.height = 600;
  
  // Draw a simple room
  ctx.fillStyle = '#f0f0f0'; // Background
  ctx.fillRect(0, 0, 800, 600);
  
  // Left wall (blue tint)
  ctx.fillStyle = '#e0e8ff';
  ctx.fillRect(0, 0, 200, 600);
  
  // Right wall (green tint)
  ctx.fillStyle = '#e8ffe0';
  ctx.fillRect(600, 0, 200, 600);
  
  // Back wall (red tint)
  ctx.fillStyle = '#ffe0e0';
  ctx.fillRect(200, 0, 400, 600);
  
  // Floor (brown)
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(0, 450, 800, 150);
  
  // Ceiling (light gray)
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, 800, 100);
  
  // Add some windows
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 100, 200); // Left window
  ctx.fillRect(650, 150, 100, 180); // Right window
  
  // Convert canvas to ArrayBuffer
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Remove data URL prefix
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testSAMWallDetection();
} else {
  // Node.js environment
  console.log('This test requires a browser environment to run SAM analysis');
  console.log('Please run this test in the browser console or as part of the web application');
}
