const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

try {
  // Read the OpenAPI spec
  const specPath = path.join(__dirname, '../src/contracts/openapi.yaml');
  const specContent = fs.readFileSync(specPath, 'utf8');
  
  // Parse YAML
  const spec = yaml.load(specContent);
  
  // Validate basic structure
  if (!spec.openapi) {
    throw new Error('Missing openapi version');
  }
  
  if (!spec.info) {
    throw new Error('Missing info section');
  }
  
  if (!spec.paths) {
    throw new Error('Missing paths section');
  }
  
  // Count endpoints
  const endpointCount = Object.keys(spec.paths).length;
  
  console.log('✓ OpenAPI specification is valid');
  console.log(`✓ OpenAPI Version: ${spec.openapi}`);
  console.log(`✓ API Title: ${spec.info.title}`);
  console.log(`✓ Total Endpoints: ${endpointCount}`);
  
  // List all endpoints
  console.log('\nEndpoints:');
  Object.keys(spec.paths).forEach(path => {
    Object.keys(spec.paths[path]).forEach(method => {
      console.log(`  ${method.toUpperCase()} ${path}`);
    });
  });
  
  process.exit(0);
} catch (error) {
  console.error('❌ OpenAPI validation failed:', error.message);
  process.exit(1);
}

