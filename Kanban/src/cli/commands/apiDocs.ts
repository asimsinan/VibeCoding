/**
 * API Documentation CLI Command - Generate API documentation
 * FR-001: API-First Design - CLI command for API documentation
 */

import { Command } from 'commander';
import { generateApiDocs } from '../../lib/api/docs/apiDocGenerator';

export function createApiDocsCommand(): Command {
  const command = new Command('api-docs');

  command
    .description('Generate API documentation from OpenAPI specification')
    .option('-i, --input <file>', 'Input OpenAPI specification file', 'contracts/openapi.yaml')
    .option('-o, --output <dir>', 'Output directory for documentation', 'docs/api')
    .option('-f, --format <format>', 'Output format (html, markdown, json)', 'html')
    .option('-t, --theme <theme>', 'Documentation theme (default, dark, minimal)', 'default')
    .option('--no-examples', 'Exclude examples from documentation')
    .option('--no-schemas', 'Exclude schemas from documentation')
    .option('--no-endpoints', 'Exclude endpoints from documentation')
    .action(async (options) => {
      try {
        console.log('Generating API documentation...');
        console.log(`Input file: ${options.input}`);
        console.log(`Output directory: ${options.output}`);
        console.log(`Format: ${options.format}`);
        console.log(`Theme: ${options.theme}`);

        await generateApiDocs({
          inputFile: options.input,
          outputDir: options.output,
          format: options.format,
          theme: options.theme,
          includeExamples: options.examples,
          includeSchemas: options.schemas,
          includeEndpoints: options.endpoints,
        });

        console.log('✅ API documentation generated successfully!');
      } catch (error) {
        console.error('❌ Error generating API documentation:', error);
        process.exit(1);
      }
    });

  return command;
}
