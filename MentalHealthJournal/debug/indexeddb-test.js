// Load fake-indexeddb
require('fake-indexeddb/auto');

// Test IndexedDB availability
console.log('Testing IndexedDB...');
console.log('typeof indexedDB:', typeof indexedDB);
console.log('indexedDB available:', typeof indexedDB !== 'undefined');

if (typeof indexedDB !== 'undefined') {
  console.log('indexedDB.open function:', typeof indexedDB.open);
  
  try {
    const request = indexedDB.open('test-db', 1);
    console.log('Request object:', request);
    console.log('Request type:', typeof request);
    
    if (request) {
      console.log('Request.onerror type:', typeof request.onerror);
      console.log('Request.onsuccess type:', typeof request.onsuccess);
    }
  } catch (error) {
    console.error('Error opening IndexedDB:', error);
  }
} else {
  console.log('IndexedDB is not available');
}
