/**
 * Browser Console Script to Delete All Room Photos
 * 
 * Instructions:
 * 1. Open your browser and go to your ARDecorator app
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 
 * This will delete ALL room photos for the current user!
 */

(async function deleteAllRoomPhotos() {
  try {
    console.log('🗑️  Starting bulk deletion of room photos...');
    
    // Get auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      console.error('❌ Error: No auth token found. Please log in first.');
      return;
    }

    const API_BASE_URL = 'http://localhost:3001/api/v1';
    
    // First, get the count of photos to confirm
    console.log('📊 Fetching current room photos...');
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

    // Show confirmation
    console.log('⚠️  WARNING: This will delete ALL room photos permanently!');
    console.log('📋 Photos to be deleted:');
    photos.forEach((photo, index) => {
      console.log(`   ${index + 1}. ${photo.filename} (${photo.id})`);
    });
    
    // Ask for confirmation
    const confirmed = confirm(`Are you sure you want to delete ALL ${photoCount} room photos? This action cannot be undone!`);
    
    if (!confirmed) {
      console.log('❌ Deletion cancelled by user.');
      return;
    }

    console.log('🗑️  Proceeding with deletion...');

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
    
    // Refresh the page to show updated state
    console.log('🔄 Refreshing page to show updated state...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error deleting room photos:', error.message);
    console.error('Full error:', error);
  }
})();
