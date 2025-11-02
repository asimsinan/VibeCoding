/**
 * Vercel AI Gateway Provider
 * Custom provider wrapper for Vercel AI SDK to work with AI Gateway
 * Uses AI SDK pattern but with direct fetch calls for React Native compatibility
 */

export interface VercelAIGatewayProviderConfig {
  apiUrl: string;
  apiKey: string;
}

export interface AIGatewayModel {
  modelId: string;
  config: VercelAIGatewayProviderConfig;
}

/**
 * Create a custom language model wrapper for Vercel AI Gateway
 * This provides AI SDK-compatible interface while using direct fetch
 */
export function createAIGatewayModel(
  config: VercelAIGatewayProviderConfig,
  modelId: string
): AIGatewayModel {
  return {
    modelId,
    config,
  };
}

/**
 * Call AI Gateway using SDK-style interface
 */
export async function callAIGateway(
  model: AIGatewayModel,
  messages: any[],
  maxTokens: number = 1000
): Promise<string> {
  const endpointUrl = model.config.apiUrl.includes('/v1')
    ? `${model.config.apiUrl}/chat/completions`
    : `${model.config.apiUrl}/v1/chat/completions`;

  // Convert messages to OpenAI format
  const formattedMessages = messages.map((msg: any) => {
    const content = Array.isArray(msg.content) 
      ? msg.content.map((c: any) => {
          if (c.type === 'image') {
            // Convert AI SDK image format to OpenAI format
            return {
              type: 'image_url',
              image_url: {
                url: c.image,
              },
            };
          }
          return c;
        })
      : msg.content;
    
    return {
      role: msg.role,
      content,
    };
  });

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.config.apiKey}`,
    },
    body: JSON.stringify({
      model: model.modelId,
      messages: formattedMessages,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 
      errorData.message || 
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('Invalid response from AI Gateway: No content in response');
  }

  return content;
}

