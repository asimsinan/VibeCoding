/**
 * API Documentation Generator - Generate API documentation from OpenAPI specification
 * FR-001: API-First Design - API documentation implementation
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';

export interface ApiDocConfig {
  inputFile: string;
  outputDir: string;
  format: 'html' | 'markdown' | 'json';
  theme: 'default' | 'dark' | 'minimal';
  includeExamples: boolean;
  includeSchemas: boolean;
  includeEndpoints: boolean;
}

export class ApiDocGenerator {
  private config: ApiDocConfig;
  private spec: OpenAPIV3.Document | null = null;

  constructor(config: Partial<ApiDocConfig> = {}) {
    this.config = {
      inputFile: 'contracts/openapi.yaml',
      outputDir: 'docs/api',
      format: 'html',
      theme: 'default',
      includeExamples: true,
      includeSchemas: true,
      includeEndpoints: true,
      ...config,
    };
  }

  public async generate(): Promise<void> {
    try {
      // Load OpenAPI specification
      await this.loadSpec();

      // Create output directory
      await this.createOutputDir();

      // Generate documentation based on format
      switch (this.config.format) {
        case 'html':
          await this.generateHTML();
          break;
        case 'markdown':
          await this.generateMarkdown();
          break;
        case 'json':
          await this.generateJSON();
          break;
        default:
          throw new Error(`Unsupported format: ${this.config.format}`);
      }

      console.log(`API documentation generated successfully in ${this.config.outputDir}`);
    } catch (error) {
      console.error('Error generating API documentation:', error);
      throw error;
    }
  }

  private async loadSpec(): Promise<void> {
    try {
      const specPath = path.resolve(this.config.inputFile);
      const specContent = fs.readFileSync(specPath, 'utf8');
      this.spec = yaml.load(specContent) as OpenAPIV3.Document;
    } catch (error) {
      throw new Error(`Failed to load OpenAPI specification: ${error}`);
    }
  }

  private async createOutputDir(): Promise<void> {
    const outputPath = path.resolve(this.config.outputDir);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
  }

  private async generateHTML(): Promise<void> {
    if (!this.spec) throw new Error('OpenAPI specification not loaded');

    const html = this.generateHTMLContent();
    const outputPath = path.join(this.config.outputDir, 'index.html');
    fs.writeFileSync(outputPath, html);
  }

  private generateHTMLContent(): string {
    if (!this.spec) throw new Error('OpenAPI specification not loaded');

    const { info, servers, paths, components } = this.spec;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${info.title} - API Documentation</title>
    <style>
        ${this.getCSS()}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${info.title}</h1>
            <p class="version">Version ${info.version}</p>
            <p class="description">${info.description}</p>
        </header>

        <nav class="nav">
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#authentication">Authentication</a></li>
                <li><a href="#endpoints">Endpoints</a></li>
                <li><a href="#schemas">Schemas</a></li>
            </ul>
        </nav>

        <main class="main">
            <section id="overview" class="section">
                <h2>Overview</h2>
                <div class="info">
                    <h3>API Information</h3>
                    <ul>
                        <li><strong>Title:</strong> ${info.title}</li>
                        <li><strong>Version:</strong> ${info.version}</li>
                        <li><strong>Description:</strong> ${info.description}</li>
                    </ul>
                </div>

                <div class="servers">
                    <h3>Servers</h3>
                    <ul>
                        ${servers?.map(server => `
                            <li>
                                <strong>${server.description || 'Server'}:</strong> 
                                <code>${server.url}</code>
                            </li>
                        `).join('') || '<li>No servers defined</li>'}
                    </ul>
                </div>
            </section>

            <section id="authentication" class="section">
                <h2>Authentication</h2>
                <p>This API uses Bearer token authentication. Include the token in the Authorization header:</p>
                <pre><code>Authorization: Bearer &lt;your-token&gt;</code></pre>
            </section>

            <section id="endpoints" class="section">
                <h2>Endpoints</h2>
                ${this.generateEndpointsHTML(paths)}
            </section>

            <section id="schemas" class="section">
                <h2>Schemas</h2>
                ${this.generateSchemasHTML(components?.schemas)}
            </section>
        </main>
    </div>

    <script>
        ${this.getJavaScript()}
    </script>
</body>
</html>`;
  }

  private generateEndpointsHTML(paths: OpenAPIV3.PathsObject): string {
    if (!paths) return '<p>No endpoints defined</p>';

    return Object.entries(paths).map(([path, pathItem]) => {
      if (!pathItem) return '';

      const methods = Object.entries(pathItem).filter(([key]) => 
        ['get', 'post', 'put', 'delete', 'patch'].includes(key)
      );

      return `
        <div class="endpoint">
          <h3>${path}</h3>
          ${methods.map(([method, operation]) => {
            if (!operation) return '';
            
            return `
              <div class="method ${method}">
                <h4>${method.toUpperCase()} ${path}</h4>
                <p class="summary">${(operation as any).summary || 'No summary'}</p>
                <p class="description">${(operation as any).description || 'No description'}</p>
                
                ${(operation as any).parameters ? `
                  <div class="parameters">
                    <h5>Parameters</h5>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>In</th>
                          <th>Required</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(operation as any).parameters.map((param: any) => {
                          if ('$ref' in param) return '';
                          return `
                            <tr>
                              <td><code>${param.name}</code></td>
                              <td>${param.in}</td>
                              <td>${param.required ? 'Yes' : 'No'}</td>
                              <td>${this.getParameterType(param.schema)}</td>
                              <td>${param.description || 'No description'}</td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}

                ${(operation as any).requestBody ? `
                  <div class="request-body">
                    <h5>Request Body</h5>
                    <pre><code>${JSON.stringify(this.getRequestBodyExample((operation as any).requestBody), null, 2)}</code></pre>
                  </div>
                ` : ''}

                ${(operation as any).responses ? `
                  <div class="responses">
                    <h5>Responses</h5>
                    ${Object.entries((operation as any).responses).map(([status, response]) => {
                      if ('$ref' in (response as any)) return '';
                      return `
                        <div class="response">
                          <h6>${status} - ${(response as any).description || 'No description'}</h6>
                          ${(response as any).content ? `
                            <pre><code>${JSON.stringify(this.getResponseExample((response as any).content), null, 2)}</code></pre>
                          ` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  }

  private generateSchemasHTML(schemas: OpenAPIV3.ComponentsObject['schemas']): string {
    if (!schemas) return '<p>No schemas defined</p>';

    return Object.entries(schemas).map(([name, schema]) => {
      if ('$ref' in schema) return '';

      return `
        <div class="schema">
          <h3>${name}</h3>
          <p class="description">${schema.description || 'No description'}</p>
          <pre><code>${JSON.stringify(this.getSchemaExample(schema), null, 2)}</code></pre>
        </div>
      `;
    }).join('');
  }

  private getParameterType(schema: any): string {
    if (!schema) return 'unknown';
    if (schema.type) return schema.type;
    if (schema.$ref) return 'reference';
    return 'unknown';
  }

  private getRequestBodyExample(requestBody: OpenAPIV3.RequestBodyObject): any {
    const content = requestBody.content;
    if (!content) return {};

    const jsonContent = content['application/json'];
    if (!jsonContent || !jsonContent.schema) return {};

    return this.getSchemaExample(jsonContent.schema);
  }

  private getResponseExample(content: OpenAPIV3.ResponseObject['content']): any {
    if (!content) return {};

    const jsonContent = content['application/json'];
    if (!jsonContent || !jsonContent.schema) return {};

    return this.getSchemaExample(jsonContent.schema);
  }

  private getSchemaExample(schema: any): any {
    if (!schema) return {};

    if (schema.example) return schema.example;
    if (schema.default) return schema.default;

    if (schema.type === 'object' && schema.properties) {
      const example: any = {};
      Object.entries(schema.properties).forEach(([key, prop]) => {
        if ('$ref' in (prop as any)) return;
        example[key] = this.getSchemaExample(prop as any);
      });
      return example;
    }

    if (schema.type === 'array' && (schema as any).items) {
      return [this.getSchemaExample((schema as any).items)];
    }

    if (schema.type === 'string') return 'string';
    if (schema.type === 'number') return 0;
    if (schema.type === 'integer') return 0;
    if (schema.type === 'boolean') return true;
    if (schema.type === 'array') return [];

    return {};
  }

  private async generateMarkdown(): Promise<void> {
    if (!this.spec) throw new Error('OpenAPI specification not loaded');

    const markdown = this.generateMarkdownContent();
    const outputPath = path.join(this.config.outputDir, 'README.md');
    fs.writeFileSync(outputPath, markdown);
  }

  private generateMarkdownContent(): string {
    if (!this.spec) throw new Error('OpenAPI specification not loaded');

    const { info, servers, paths, components } = this.spec;

    return `# ${info.title}

**Version:** ${info.version}

${info.description}

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Schemas](#schemas)

## Overview

### API Information

- **Title:** ${info.title}
- **Version:** ${info.version}
- **Description:** ${info.description}

### Servers

${servers?.map(server => `- **${server.description || 'Server'}:** \`${server.url}\``).join('\n') || '- No servers defined'}

## Authentication

This API uses Bearer token authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Endpoints

${this.generateEndpointsMarkdown(paths)}

## Schemas

${this.generateSchemasMarkdown(components?.schemas)}
`;
  }

  private generateEndpointsMarkdown(paths: OpenAPIV3.PathsObject): string {
    if (!paths) return 'No endpoints defined';

    return Object.entries(paths).map(([path, pathItem]) => {
      if (!pathItem) return '';

      const methods = Object.entries(pathItem).filter(([key]) => 
        ['get', 'post', 'put', 'delete', 'patch'].includes(key)
      );

      return `
### ${path}

${methods.map(([method, operation]) => {
        if (!operation) return '';
        
        return `
#### ${method.toUpperCase()} ${path}

**Summary:** ${(operation as any).summary || 'No summary'}

**Description:** ${(operation as any).description || 'No description'}

${(operation as any).parameters ? `
**Parameters:**

| Name | In | Required | Type | Description |
|------|----|---------|------|-------------|
${(operation as any).parameters.map((param: any) => {
          if ('$ref' in param) return '';
          return `| ${param.name} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${this.getParameterType(param.schema)} | ${param.description || 'No description'} |`;
        }).join('\n')}
` : ''}

${(operation as any).requestBody ? `
**Request Body:**

\`\`\`json
${JSON.stringify(this.getRequestBodyExample((operation as any).requestBody), null, 2)}
\`\`\`
` : ''}

${(operation as any).responses ? `
**Responses:**

${Object.entries((operation as any).responses).map(([status, response]) => {
          if ('$ref' in (response as any)) return '';
          return `
- **${status}** - ${(response as any).description || 'No description'}
${(response as any).content ? `
\`\`\`json
${JSON.stringify(this.getResponseExample((response as any).content), null, 2)}
\`\`\`
` : ''}`;
        }).join('\n')}
` : ''}
`;
      }).join('')}
`;
    }).join('');
  }

  private generateSchemasMarkdown(schemas: OpenAPIV3.ComponentsObject['schemas']): string {
    if (!schemas) return 'No schemas defined';

    return Object.entries(schemas).map(([name, schema]) => {
      if ('$ref' in schema) return '';

      return `
### ${name}

${schema.description || 'No description'}

\`\`\`json
${JSON.stringify(this.getSchemaExample(schema), null, 2)}
\`\`\`
`;
    }).join('');
  }

  private async generateJSON(): Promise<void> {
    if (!this.spec) throw new Error('OpenAPI specification not loaded');

    const outputPath = path.join(this.config.outputDir, 'api-spec.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.spec, null, 2));
  }

  private getCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .version {
            color: #7f8c8d;
            font-size: 1.1em;
            margin-bottom: 10px;
        }

        .description {
            color: #555;
            font-size: 1.1em;
        }

        .nav {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .nav ul {
            list-style: none;
            display: flex;
            gap: 20px;
        }

        .nav a {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
        }

        .nav a:hover {
            color: #2980b9;
        }

        .main {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section {
            margin-bottom: 40px;
        }

        .section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }

        .section h3 {
            color: #34495e;
            margin-bottom: 15px;
        }

        .section h4 {
            color: #7f8c8d;
            margin-bottom: 10px;
        }

        .info, .servers {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }

        .info ul, .servers ul {
            list-style: none;
        }

        .info li, .servers li {
            margin-bottom: 8px;
        }

        .endpoint {
            border: 1px solid #ecf0f1;
            border-radius: 6px;
            margin-bottom: 20px;
            overflow: hidden;
        }

        .endpoint h3 {
            background: #f8f9fa;
            padding: 15px 20px;
            margin: 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .method {
            padding: 20px;
            border-bottom: 1px solid #ecf0f1;
        }

        .method:last-child {
            border-bottom: none;
        }

        .method.get h4 {
            color: #27ae60;
        }

        .method.post h4 {
            color: #3498db;
        }

        .method.put h4 {
            color: #f39c12;
        }

        .method.delete h4 {
            color: #e74c3c;
        }

        .method.patch h4 {
            color: #9b59b6;
        }

        .summary {
            font-weight: 500;
            margin-bottom: 10px;
        }

        .description {
            color: #7f8c8d;
            margin-bottom: 15px;
        }

        .parameters, .request-body, .responses {
            margin-bottom: 20px;
        }

        .parameters h5, .request-body h5, .responses h5 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
        }

        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid #ecf0f1;
        }

        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }

        .response {
            margin-bottom: 15px;
        }

        .response h6 {
            color: #2c3e50;
            margin-bottom: 8px;
        }

        .schema {
            border: 1px solid #ecf0f1;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .schema h3 {
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .schema .description {
            color: #7f8c8d;
            margin-bottom: 15px;
        }
    `;
  }

  private getJavaScript(): string {
    return `
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Copy code blocks to clipboard
        document.querySelectorAll('pre code').forEach(block => {
            const button = document.createElement('button');
            button.textContent = 'Copy';
            button.style.cssText = 'position: absolute; top: 5px; right: 5px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;';
            
            const container = document.createElement('div');
            container.style.cssText = 'position: relative;';
            block.parentNode.insertBefore(container, block);
            container.appendChild(block);
            container.appendChild(button);
            
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(block.textContent).then(() => {
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
            });
        });
    `;
  }
}

// CLI interface
export async function generateApiDocs(config: Partial<ApiDocConfig> = {}): Promise<void> {
  const generator = new ApiDocGenerator(config);
  await generator.generate();
}
