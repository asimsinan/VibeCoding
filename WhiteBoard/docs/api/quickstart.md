# API Quick Start Guide

Get up and running with the Collaborative Whiteboard API in minutes.

## Prerequisites

- Node.js 18+ or Python 3.8+
- API key from [whiteboard.app](https://whiteboard.app)
- Basic knowledge of REST APIs

## 1. Authentication

First, get your API key and set up authentication:

```bash
# Set your API key as an environment variable
export WHITEBOARD_API_KEY="your-api-key-here"
```

## 2. Make Your First Request

### Using cURL

```bash
# List your whiteboards
curl -X GET "https://api.whiteboard.app/v1/whiteboards" \
  -H "Authorization: Bearer $WHITEBOARD_API_KEY" \
  -H "Content-Type: application/json"
```

### Using JavaScript

```javascript
const apiKey = process.env.WHITEBOARD_API_KEY;
const baseURL = 'https://api.whiteboard.app/v1';

// List whiteboards
const response = await fetch(`${baseURL}/whiteboards`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### Using Python

```python
import requests
import os

api_key = os.getenv('WHITEBOARD_API_KEY')
base_url = 'https://api.whiteboard.app/v1'

# List whiteboards
response = requests.get(
    f'{base_url}/whiteboards',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
)

data = response.json()
print(data)
```

## 3. Create Your First Whiteboard

```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards" \
  -H "Authorization: Bearer $WHITEBOARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Whiteboard",
    "settings": {
      "width": 1920,
      "height": 1080,
      "background_color": "#FFFFFF"
    }
  }'
```

## 4. Add Content to Your Whiteboard

### Add a Drawing

```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards/YOUR_WHITEBOARD_ID/drawings" \
  -H "Authorization: Bearer $WHITEBOARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "pen",
    "color": "#FF0000",
    "size": 2,
    "points": [
      { "x": 100, "y": 100 },
      { "x": 200, "y": 200 }
    ],
    "user_id": "YOUR_USER_ID"
  }'
```

### Add a Sticky Note

```bash
curl -X POST "https://api.whiteboard.app/v1/whiteboards/YOUR_WHITEBOARD_ID/sticky-notes" \
  -H "Authorization: Bearer $WHITEBOARD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, World!",
    "position": { "x": 100, "y": 100 },
    "color": "#FFE066",
    "user_id": "YOUR_USER_ID"
  }'
```

## 5. Set Up Real-time Updates

### JavaScript with WebSocket

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Subscribe to whiteboard changes
const channel = supabase
  .channel('whiteboard-YOUR_WHITEBOARD_ID')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'drawings',
    filter: 'whiteboard_id=eq.YOUR_WHITEBOARD_ID'
  }, (payload) => {
    console.log('Drawing changed:', payload)
    // Update your UI here
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sticky_notes',
    filter: 'whiteboard_id=eq.YOUR_WHITEBOARD_ID'
  }, (payload) => {
    console.log('Sticky note changed:', payload)
    // Update your UI here
  })
  .subscribe()
```

## 6. Complete Example

Here's a complete example that creates a whiteboard, adds content, and listens for real-time updates:

```javascript
class WhiteboardClient {
  constructor(apiKey, baseURL = 'https://api.whiteboard.app/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createWhiteboard(name, settings = {}) {
    return this.request('/whiteboards', {
      method: 'POST',
      body: JSON.stringify({ name, settings })
    });
  }

  async addDrawing(whiteboardId, drawing) {
    return this.request(`/whiteboards/${whiteboardId}/drawings`, {
      method: 'POST',
      body: JSON.stringify(drawing)
    });
  }

  async addStickyNote(whiteboardId, stickyNote) {
    return this.request(`/whiteboards/${whiteboardId}/sticky-notes`, {
      method: 'POST',
      body: JSON.stringify(stickyNote)
    });
  }

  async getWhiteboard(whiteboardId) {
    return this.request(`/whiteboards/${whiteboardId}`);
  }
}

// Usage
const client = new WhiteboardClient(process.env.WHITEBOARD_API_KEY);

async function main() {
  try {
    // Create a whiteboard
    const whiteboard = await client.createWhiteboard('My Whiteboard', {
      width: 1920,
      height: 1080,
      background_color: '#FFFFFF'
    });

    console.log('Created whiteboard:', whiteboard.data.id);

    // Add a drawing
    const drawing = await client.addDrawing(whiteboard.data.id, {
      tool: 'pen',
      color: '#FF0000',
      size: 2,
      points: [
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      ],
      user_id: 'user-123'
    });

    console.log('Added drawing:', drawing.data.id);

    // Add a sticky note
    const stickyNote = await client.addStickyNote(whiteboard.data.id, {
      content: 'Hello, World!',
      position: { x: 100, y: 100 },
      color: '#FFE066',
      user_id: 'user-123'
    });

    console.log('Added sticky note:', stickyNote.data.id);

    // Get the complete whiteboard
    const fullWhiteboard = await client.getWhiteboard(whiteboard.data.id);
    console.log('Whiteboard with content:', fullWhiteboard.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## 7. Next Steps

- Explore the [full API documentation](README.md)
- Check out the [SDK examples](sdk-examples.md)
- Learn about [real-time features](realtime.md)
- See [platform-specific guides](platforms.md)

## Common Issues

### Authentication Errors

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Solution**: Make sure you're including the `Authorization: Bearer YOUR_API_KEY` header in all requests.

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "name",
    "message": "Name is required"
  }
}
```

**Solution**: Check that all required fields are provided and meet the validation requirements.

### Rate Limiting

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": {
    "retry_after": 60
  }
}
```

**Solution**: Wait for the specified time before making more requests, or implement exponential backoff.

## Support

Need help? Contact us:

- 📧 Email: [support@whiteboard.app](mailto:support@whiteboard.app)
- 💬 Discord: [discord.gg/whiteboard](https://discord.gg/whiteboard)
- 📖 Docs: [whiteboard.app/docs](https://whiteboard.app/docs)
