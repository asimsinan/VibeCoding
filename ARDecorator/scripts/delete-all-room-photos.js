#!/usr/bin/env node

/**
 * Script to delete all room photos for the authenticated user
 * Usage: node scripts/delete-all-room-photos.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

async function deleteAllRoomPhotos() {
  try {
    // Get auth token from localStorage or environment
    const authToken = process.env.AUTH_TOKEN;
    
    if (!authToken) {
      console.error('❌ Error: AUTH_TOKEN environment variable is required');
      console.log('Please set your auth token:');
      console.log('export AUTH_TOKEN="your-jwt-token-here"');
      console.log('or run: AUTH_TOKEN="your-token" node scripts/delete-all-room-photos.js');
      process.exit(1);
    }

    console.log('🗑️  Starting bulk deletion of room photos...');
    
    // First, get the count of photos to confirm
    const listResponse = await fetch(`${API_BASE_URL}/room-photos`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to fetch room photos: ${listResponse.status} ${listResponse.statusText}`);
    }

    const photos = await listResponse.json();
    const photoCount = photos.length;
    
    console.log(`📊 Found ${photoCount} room photos to delete`);
    
    if (photoCount === 0) {
      console.log('✅ No room photos found. Nothing to delete.');
      return;
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will delete ALL room photos permanently!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all photos
    const deleteResponse = await fetch(`${API_BASE_URL}/room-photos/bulk`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete room photos: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }

    const result = await deleteResponse.json();
    
    console.log('✅ Success!');
    console.log(`📊 Deleted ${result.deletedCount} room photos`);
    console.log(`💬 ${result.message}`);
    
  } catch (error) {
    console.error('❌ Error deleting room photos:', error.message);
    process.exit(1);
  }
}

// Run the script
deleteAllRoomPhotos();
