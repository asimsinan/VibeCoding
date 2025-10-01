# API Documentation

This directory contains detailed API documentation and specifications.

## Files

- **OpenAPI Specification**: `openapi.yaml` - Complete API specification in OpenAPI 3.0 format
- **Schema Definitions**: JSON schemas for all data models
- **API Reference**: Detailed endpoint documentation

## Usage

### OpenAPI Specification
The OpenAPI specification can be used with tools like:
- Swagger UI for interactive documentation
- Postman for API testing
- Code generators for client SDKs

### Schema Validation
JSON schemas are used for:
- Request/response validation
- API contract testing
- Client-side validation

## Generating Documentation

```bash
# Generate HTML documentation from OpenAPI spec
npx @redocly/cli build-docs contracts/openapi.yaml --output docs/api/index.html

# Generate client SDKs
npx @openapitools/openapi-generator-cli generate -i contracts/openapi.yaml -g typescript-axios -o src/generated
```
