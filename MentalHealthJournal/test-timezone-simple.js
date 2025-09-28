// Simple timezone test
console.log('=== Timezone Test ===');
console.log('Current time:', new Date().toString());
console.log('UTC date (old way):', new Date().toISOString().split('T')[0]);

// Simulate the new local date function
function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('Local date (new way):', getTodayLocal());

// Test the difference
const utcDate = new Date().toISOString().split('T')[0];
const localDate = getTodayLocal();
console.log('Are they different?', utcDate !== localDate);
console.log('UTC date:', utcDate);
console.log('Local date:', localDate);
