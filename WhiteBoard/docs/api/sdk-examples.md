# SDK Examples

Code examples for integrating with the Collaborative Whiteboard API across different platforms and languages.

## JavaScript/TypeScript

### Basic Usage

```typescript
import { WhiteboardClient } from '@whiteboard/api-client'

const client = new WhiteboardClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.whiteboard.app/v1'
})

// Create whiteboard
const whiteboard = await client.whiteboards.create({
  name: 'My Whiteboard',
  settings: { width: 1920, height: 1080 }
})

// Add drawing
const drawing = await client.drawings.create(whiteboard.id, {
  tool: 'pen',
  color: '#FF0000',
  size: 2,
  points: [{ x: 100, y: 100 }],
  user_id: 'user-123'
})
```

### React Hook

```typescript
import { useWhiteboard } from '@whiteboard/react-hooks'

function WhiteboardComponent({ whiteboardId }: { whiteboardId: string }) {
  const {
    whiteboard,
    drawings,
    stickyNotes,
    createDrawing,
    createStickyNote,
    isLoading,
    error
  } = useWhiteboard(whiteboardId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{whiteboard?.name}</h1>
      {/* Render whiteboard content */}
    </div>
  )
}
```

## Python

```python
from whiteboard import WhiteboardClient

client = WhiteboardClient(api_key='your-api-key')

# Create whiteboard
whiteboard = client.whiteboards.create(
    name='My Whiteboard',
    settings={
        'width': 1920,
        'height': 1080,
        'background_color': '#FFFFFF'
    }
)

# Add drawing
drawing = client.drawings.create(
    whiteboard_id=whiteboard.id,
    tool='pen',
    color='#FF0000',
    size=2,
    points=[{'x': 100, 'y': 100}],
    user_id='user-123'
)
```

## cURL

```bash
# Create whiteboard
curl -X POST "https://api.whiteboard.app/v1/whiteboards" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Whiteboard"}'

# Add drawing
curl -X POST "https://api.whiteboard.app/v1/whiteboards/ID/drawings" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "pen", "color": "#FF0000", "size": 2, "points": [{"x": 100, "y": 100}], "user_id": "user-123"}'
```

## Real-time Integration

```javascript
// Subscribe to real-time updates
const channel = supabase
  .channel('whiteboard-ID')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'drawings'
  }, (payload) => {
    console.log('Drawing changed:', payload)
  })
  .subscribe()
```
