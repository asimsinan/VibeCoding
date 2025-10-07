/**
 * Generate OpenAPI CLI Command - Generate OpenAPI specification
 * FR-001: API-First Design - CLI command for OpenAPI generation
 */

import { Command } from 'commander';
import { openAPIGenerator } from '../../lib/api/docs/openapiGenerator';

export function createGenerateOpenAPICommand(): Command {
  const command = new Command('generate-openapi');

  command
    .description('Generate OpenAPI specification from code')
    .option('-o, --output <file>', 'Output file path', 'contracts/openapi.yaml')
    .option('-f, --format <format>', 'Output format (json, yaml)', 'yaml')
    .option('-t, --title <title>', 'API title', 'Kanban Project Management API')
    .option('-v, --version <version>', 'API version', '1.0.0')
    .option('-d, --description <description>', 'API description', 'RESTful API for Kanban project management with real-time collaboration')
    .option('--contact-name <name>', 'Contact name', 'API Support')
    .option('--contact-email <email>', 'Contact email', 'support@kanban-app.com')
    .option('--contact-url <url>', 'Contact URL', 'https://kanban-app.com/support')
    .option('--license-name <name>', 'License name', 'MIT')
    .option('--license-url <url>', 'License URL', 'https://opensource.org/licenses/MIT')
    .option('--server-prod <url>', 'Production server URL', 'https://api.kanban-app.com/v1')
    .option('--server-staging <url>', 'Staging server URL', 'https://staging-api.kanban-app.com/v1')
    .option('--server-dev <url>', 'Development server URL', 'http://localhost:3000/api/v1')
    .action(async (options) => {
      try {
        console.log('Generating OpenAPI specification...');
        console.log(`Output file: ${options.output}`);
        console.log(`Format: ${options.format}`);
        console.log(`Title: ${options.title}`);
        console.log(`Version: ${options.version}`);

        // Update generator config
        openAPIGenerator.updateConfig({
          title: options.title,
          version: options.version,
          description: options.description,
          contact: {
            name: options.contactName,
            email: options.contactEmail,
            url: options.contactUrl,
          },
          license: {
            name: options.licenseName,
            url: options.licenseUrl,
          },
          servers: [
            {
              url: options.serverProd,
              description: 'Production server',
            },
            {
              url: options.serverStaging,
              description: 'Staging server',
            },
            {
              url: options.serverDev,
              description: 'Development server',
            },
          ],
        });

        // Generate and save specification
        await openAPIGenerator.saveSpec(options.output, options.format);

        console.log('✅ OpenAPI specification generated successfully!');
        console.log(`📄 Specification saved to: ${options.output}`);
        console.log(`🔗 Format: ${options.format.toUpperCase()}`);
      } catch (error) {
        console.error('❌ Error generating OpenAPI specification:', error);
        process.exit(1);
      }
    });

  return command;
}
