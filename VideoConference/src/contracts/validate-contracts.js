#!/usr/bin/env node

/**
 * API Contract Validation Script
 * Validates OpenAPI specification against functional requirements
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Functional Requirements Mapping
const FUNCTIONAL_REQUIREMENTS = {
  'FR-001': {
    description: 'Create and manage video conference rooms',
    endpoints: ['POST /rooms', 'GET /rooms/{roomId}', 'DELETE /rooms/{roomId}'],
    schemas: ['CreateRoomRequest', 'CreateRoomResponse', 'RoomInfo']
  },
  'FR-002': {
    description: 'Join existing rooms with room ID',
    endpoints: ['POST /rooms/{roomId}/join'],
    schemas: ['JoinRoomRequest', 'JoinRoomResponse']
  },
  'FR-003': {
    description: 'WebRTC peer-to-peer video and audio communication',
    endpoints: ['GET /ws/rooms/{roomId}'],
    schemas: ['WebSocketMessage', 'MediaStateChangedMessage']
  },
  'FR-004': {
    description: 'Screen sharing functionality',
    endpoints: ['GET /ws/rooms/{roomId}'],
    schemas: ['MediaPermissions', 'MediaStateChangedMessage']
  },
  'FR-005': {
    description: 'Real-time text chat',
    endpoints: ['GET /rooms/{roomId}/messages', 'POST /rooms/{roomId}/messages'],
    schemas: ['SendMessageRequest', 'SendMessageResponse', 'Message']
  },
  'FR-006': {
    description: 'Responsive UI for mobile and desktop',
    endpoints: [], // UI requirement, not API
    schemas: []
  },
  'FR-007': {
    description: 'Media controls (camera, microphone, screen share)',
    endpoints: ['GET /ws/rooms/{roomId}'],
    schemas: ['MediaPermissions', 'MediaStateChangedMessage']
  },
  'FR-008': {
    description: 'Participant management and tracking',
    endpoints: ['GET /rooms/{roomId}'],
    schemas: ['Participant', 'RoomInfo']
  },
  'FR-009': {
    description: 'WebSocket for real-time signaling',
    endpoints: ['GET /ws/rooms/{roomId}'],
    schemas: ['WebSocketMessage', 'ParticipantJoinedMessage', 'ParticipantLeftMessage']
  },
  'FR-010': {
    description: 'Input validation and error handling',
    endpoints: ['ALL'],
    schemas: ['ErrorResponse', 'ValidationError']
  },
  'FR-011': {
    description: 'Network reconnection and error handling',
    endpoints: ['GET /ws/rooms/{roomId}'],
    schemas: ['WebSocketErrorMessage', 'ErrorResponse']
  },
  'FR-012': {
    description: 'Browser compatibility and fallbacks',
    endpoints: ['ALL'],
    schemas: ['ErrorResponse']
  }
};

// Validation rules
const VALIDATION_RULES = {
  endpoints: {
    required: [
      'POST /rooms',
      'GET /rooms/{roomId}',
      'POST /rooms/{roomId}/join',
      'POST /rooms/{roomId}/leave',
      'GET /rooms/{roomId}/messages',
      'POST /rooms/{roomId}/messages',
      'GET /ws/rooms/{roomId}'
    ],
    patterns: {
      'roomId': /^\/api\/v1\/rooms\/\{roomId\}/,
      'websocket': /^\/ws\/rooms\/\{roomId\}/
    }
  },
  schemas: {
    required: [
      'CreateRoomRequest',
      'CreateRoomResponse',
      'JoinRoomRequest',
      'JoinRoomResponse',
      'RoomInfo',
      'Participant',
      'Message',
      'MediaPermissions',
      'ErrorResponse',
      'WebSocketMessage'
    ]
  },
  security: {
    required: ['BearerAuth'],
    methods: ['JWT']
  }
};

function validateOpenAPISpec(spec) {
  const errors = [];
  const warnings = [];

  // Check required endpoints
  const definedEndpoints = Object.keys(spec.paths || {});
  const requiredEndpoints = VALIDATION_RULES.endpoints.required;
  
  for (const endpoint of requiredEndpoints) {
    const [method, path] = endpoint.split(' ');
    const definedPath = spec.paths?.[path];
    const definedMethod = definedPath?.[method.toLowerCase()];
    
    if (!definedMethod) {
      errors.push(`Missing required endpoint: ${endpoint}`);
    }
  }

  // Check required schemas
  const definedSchemas = Object.keys(spec.components?.schemas || {});
  const requiredSchemas = VALIDATION_RULES.schemas.required;
  
  for (const schema of requiredSchemas) {
    if (!definedSchemas.includes(schema)) {
      errors.push(`Missing required schema: ${schema}`);
    }
  }

  // Check security schemes
  const securitySchemes = Object.keys(spec.components?.securitySchemes || {});
  if (!securitySchemes.includes('BearerAuth')) {
    errors.push('Missing required security scheme: BearerAuth');
  }

  // Validate endpoint patterns
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation === 'object' && operation.operationId) {
        // Check if roomId parameter is properly defined
        if (path.includes('{roomId}')) {
          const parameters = operation.parameters || [];
          const roomIdParam = parameters.find(p => p.name === 'roomId' && p.in === 'path');
          if (!roomIdParam) {
            errors.push(`Missing roomId path parameter in ${method.toUpperCase()} ${path}`);
          } else if (roomIdParam.schema?.format !== 'uuid') {
            warnings.push(`roomId parameter in ${method.toUpperCase()} ${path} should use UUID format`);
          }
        }
      }
    }
  }

  // Validate response schemas
  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation === 'object' && operation.responses) {
        const responses = operation.responses;
        
        // Check for proper error responses
        if (!responses['400'] && !responses['500']) {
          warnings.push(`Missing error responses in ${method.toUpperCase()} ${path}`);
        }

        // Check for success responses
        const successCodes = ['200', '201', '101']; // Include 101 for WebSocket
        const hasSuccessResponse = successCodes.some(code => responses[code]);
        if (!hasSuccessResponse) {
          errors.push(`Missing success response in ${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  return { errors, warnings };
}

function validateAgainstRequirements(spec) {
  const errors = [];
  const warnings = [];

  // Check each functional requirement
  for (const [frId, fr] of Object.entries(FUNCTIONAL_REQUIREMENTS)) {
    console.log(`\nValidating ${frId}: ${fr.description}`);
    
    // Check required endpoints
    for (const endpoint of fr.endpoints) {
      if (endpoint === 'ALL') {
        // For ALL endpoints, just verify that we have some endpoints defined
        const totalEndpoints = Object.values(spec.paths || {}).reduce((count, methods) => {
          return count + Object.keys(methods).filter(method => typeof methods[method] === 'object').length;
        }, 0);
        if (totalEndpoints > 0) {
          console.log(`  ✓ Found ${totalEndpoints} endpoints (ALL requirement satisfied)`);
        } else {
          errors.push(`${frId}: No endpoints found (ALL requirement not satisfied)`);
        }
      } else {
        const [method, path] = endpoint.split(' ');
        const definedPath = spec.paths?.[path];
        const definedMethod = definedPath?.[method.toLowerCase()];
        
        if (!definedMethod) {
          errors.push(`${frId}: Missing endpoint ${endpoint}`);
        } else {
          console.log(`  ✓ Found endpoint: ${endpoint}`);
        }
      }
    }

    // Check required schemas
    for (const schema of fr.schemas) {
      const definedSchema = spec.components?.schemas?.[schema];
      
      if (!definedSchema) {
        errors.push(`${frId}: Missing schema ${schema}`);
      } else {
        console.log(`  ✓ Found schema: ${schema}`);
      }
    }
  }

  return { errors, warnings };
}

function main() {
  try {
    console.log('🔍 Validating API Contracts...\n');
    
    // Load OpenAPI specification
    const specPath = path.join(__dirname, 'openapi.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(specContent);

    console.log('📋 OpenAPI Specification loaded successfully\n');

    // Validate OpenAPI structure
    console.log('🔧 Validating OpenAPI structure...');
    const structureValidation = validateOpenAPISpec(spec);
    
    if (structureValidation.errors.length > 0) {
      console.log('❌ Structure validation errors:');
      structureValidation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (structureValidation.warnings.length > 0) {
      console.log('⚠️  Structure validation warnings:');
      structureValidation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Validate against functional requirements
    console.log('\n📝 Validating against functional requirements...');
    const requirementsValidation = validateAgainstRequirements(spec);
    
    if (requirementsValidation.errors.length > 0) {
      console.log('❌ Requirements validation errors:');
      requirementsValidation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (requirementsValidation.warnings.length > 0) {
      console.log('⚠️  Requirements validation warnings:');
      requirementsValidation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Summary
    const totalErrors = structureValidation.errors.length + requirementsValidation.errors.length;
    const totalWarnings = structureValidation.warnings.length + requirementsValidation.warnings.length;

    console.log('\n📊 Validation Summary:');
    console.log(`  - Errors: ${totalErrors}`);
    console.log(`  - Warnings: ${totalWarnings}`);

    if (totalErrors === 0) {
      console.log('\n✅ API Contracts validation PASSED');
      console.log('All functional requirements are covered by the API specification');
    } else {
      console.log('\n❌ API Contracts validation FAILED');
      console.log('Please fix the errors above before proceeding');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  validateOpenAPISpec,
  validateAgainstRequirements,
  FUNCTIONAL_REQUIREMENTS,
  VALIDATION_RULES
};
