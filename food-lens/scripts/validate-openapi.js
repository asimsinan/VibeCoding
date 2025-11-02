#!/usr/bin/env node

/**
 * OpenAPI Specification Validator
 * Validates the OpenAPI 3.0 specification file
 */

const fs = require('fs');
const path = require('path');

async function validateOpenAPI() {
  try {
    // Dynamic import for ES modules
    const { default: SwaggerParser } = await import('@apidevtools/swagger-parser');
    
    const specPath = path.join(__dirname, '..', 'contracts', 'openapi.yaml');
    
    if (!fs.existsSync(specPath)) {
      console.error('❌ ERROR: OpenAPI specification file not found:', specPath);
      process.exit(1);
    }
    
    console.log('📋 Validating OpenAPI specification...');
    console.log('📍 File:', specPath);
    
    // Validate and dereference the OpenAPI spec
    const api = await SwaggerParser.validate(specPath, {
      validate: {
        spec: true,
        schema: true,
      },
    });
    
    console.log('\n✅ OpenAPI specification is valid!');
    console.log('\n📊 Specification Summary:');
    console.log(`   Title: ${api.info.title}`);
    console.log(`   Version: ${api.info.version}`);
    console.log(`   Servers: ${api.servers?.length || 0}`);
    console.log(`   Paths: ${Object.keys(api.paths || {}).length}`);
    console.log(`   Components: ${Object.keys(api.components?.schemas || {}).length} schemas`);
    console.log(`   Tags: ${api.tags?.length || 0}`);
    
    // List all endpoints
    console.log('\n🔗 Endpoints:');
    Object.keys(api.paths || {}).forEach((path) => {
      Object.keys(api.paths[path]).forEach((method) => {
        const operation = api.paths[path][method];
        console.log(`   ${method.toUpperCase().padEnd(6)} ${path} - ${operation.summary || 'No summary'}`);
      });
    });
    
    console.log('\n✅ Validation passed! All requirements met.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Validation failed:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    process.exit(1);
  }
}

validateOpenAPI();

