'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CodeBracketIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters?: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: {
      type: string;
      enum?: string[];
      minimum?: number;
      maximum?: number;
      default?: any;
    };
    description: string;
  }>;
  requestBody?: {
    required: boolean;
    content: {
      'application/json': {
        schema: {
          type: string;
          properties: Record<string, any>;
          required?: string[];
        };
      };
    };
  };
  responses: Record<string, {
    description: string;
    content?: {
      'application/json': {
        schema: {
          type: string;
          properties?: Record<string, any>;
        };
      };
    };
  }>;
}

interface ApiDocsProps {
  endpoints: ApiEndpoint[];
  baseUrl: string;
}

export default function ApiDocs({ endpoints, baseUrl }: ApiDocsProps) {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEndpoint = (endpointId: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointId)) {
      newExpanded.delete(endpointId);
    } else {
      newExpanded.add(endpointId);
    }
    setExpandedEndpoints(newExpanded);
  };

  const selectEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(`${endpoint.method}:${endpoint.path}`);
    setRequestBody('');
    setResponse('');
    setError(null);
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) {return;}

    const [method, path] = selectedEndpoint.split(':');
    if (!method || !path) {return;}
    
    setLoading(true);
    setError(null);

    try {
      const url = `${baseUrl}${path}`;
      const options: RequestInit = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (requestBody && method !== 'GET') {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCodeColor = (status: string) => {
    const code = parseInt(status);
    if (code >= 200 && code < 300) {return 'text-green-600';}
    if (code >= 400 && code < 500) {return 'text-yellow-600';}
    if (code >= 500) {return 'text-red-600';}
    return 'text-gray-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        <p className="mt-2 text-lg text-gray-600">
          Interactive documentation for the Marketplace API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Endpoints List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
          {endpoints.map((endpoint) => {
            const endpointId = `${endpoint.method}:${endpoint.path}`;
            const isExpanded = expandedEndpoints.has(endpointId);
            const isSelected = selectedEndpoint === endpointId;

            return (
              <div
                key={endpointId}
                className={`border rounded-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <button
                  onClick={() => toggleEndpoint(endpointId)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono text-sm">{endpoint.path}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="mt-3">
                      <h3 className="font-medium text-gray-900">{endpoint.summary}</h3>
                      <p className="mt-1 text-sm text-gray-600">{endpoint.description}</p>
                    </div>

                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Parameters</h4>
                        <div className="mt-2 space-y-2">
                          {endpoint.parameters.map((param) => (
                            <div key={param.name} className="text-sm">
                              <span className="font-mono text-gray-900">{param.name}</span>
                              <span className="text-gray-500"> ({param.schema.type})</span>
                              {param.required && <span className="text-red-500 ml-1">*</span>}
                              <p className="text-gray-600">{param.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.requestBody && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Request Body</h4>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm font-mono">
                          <pre>{JSON.stringify(endpoint.requestBody.content['application/json'].schema, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Responses</h4>
                      <div className="mt-2 space-y-2">
                        {Object.entries(endpoint.responses).map(([status, response]) => (
                          <div key={status} className="text-sm">
                            <span className={`font-medium ${getStatusCodeColor(status)}`}>{status}</span>
                            <span className="text-gray-600 ml-2">{response.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => selectEndpoint(endpoint)}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Try it out
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* API Testing Interface */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Try it out</h2>
          
          {selectedEndpoint ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CodeBracketIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-900">Request</span>
                </div>
                <div className="font-mono text-sm text-gray-600">
                  {selectedEndpoint.split(':')[0]?.toUpperCase()} {baseUrl}{selectedEndpoint.split(':')[1]}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Body (JSON)
                </label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter request body as JSON..."
                />
              </div>

              <button
                onClick={executeRequest}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <span className="ml-2 text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {response && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Response</span>
                  </div>
                  <pre className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm font-mono overflow-x-auto">
                    {response}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select an endpoint to try it out</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
