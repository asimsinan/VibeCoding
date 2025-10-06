# Whiteboard CLI

Command-line interface for managing collaborative whiteboards.

## Installation

The CLI is included with the whiteboard application. No additional installation required.

## Usage

### Basic Commands

```bash
# Show help
npm run cli -- --help

# Show version
npm run cli -- --version
```

### Whiteboard Management

```bash
# Create a new whiteboard
npm run cli -- whiteboard create --name "My Whiteboard" --width 1200 --height 800

# List all whiteboards
npm run cli -- whiteboard list

# Get whiteboard details
npm run cli -- whiteboard get <whiteboard-id>

# Delete a whiteboard
npm run cli -- whiteboard delete <whiteboard-id> --force
```

### Drawing Management

```bash
# Add a drawing to whiteboard
npm run cli -- drawing add <whiteboard-id> \
  --tool pen \
  --color "#FF0000" \
  --size 3 \
  --points '[{"x":100,"y":100},{"x":200,"y":200}]' \
  --user "user-123"
```

### Sticky Note Management

```bash
# Add a sticky note to whiteboard
npm run cli -- sticky-note add <whiteboard-id> \
  --content "Important note" \
  --x 150 \
  --y 200 \
  --color "#FFE066" \
  --user "user-123"
```

### Export and Statistics

```bash
# Export whiteboard to JSON
npm run cli -- export whiteboard <whiteboard-id> --output my-whiteboard.json

# Show whiteboard statistics
npm run cli -- stats whiteboard <whiteboard-id>
```

## Environment Variables

Set these environment variables for the CLI to work:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Examples

### Create and Populate a Whiteboard

```bash
# Create whiteboard
npm run cli -- whiteboard create --name "Project Planning" --width 1000 --height 600

# Add a drawing (line)
npm run cli -- drawing add <whiteboard-id> \
  --tool pen \
  --color "#000000" \
  --size 2 \
  --points '[{"x":50,"y":50},{"x":200,"y":100}]' \
  --user "cli-user"

# Add a sticky note
npm run cli -- sticky-note add <whiteboard-id> \
  --content "Project Kickoff Meeting" \
  --x 300 \
  --y 150 \
  --color "#FFE066" \
  --user "cli-user"

# Export the whiteboard
npm run cli -- export whiteboard <whiteboard-id> --output project-planning.json
```

### Batch Operations

```bash
# Create multiple whiteboards
for i in {1..5}; do
  npm run cli -- whiteboard create --name "Whiteboard $i"
done

# List all whiteboards
npm run cli -- whiteboard list --limit 20
```

## Error Handling

The CLI provides detailed error messages and exit codes:

- `0`: Success
- `1`: General error
- `2`: Invalid arguments
- `3`: Database error
- `4`: Network error

## Development

To build the CLI for production:

```bash
npm run cli:build
```

This creates a compiled JavaScript version in `dist/cli/`.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your Supabase URL and service role key
   - Ensure your Supabase project is active

2. **Permission Denied**
   - Make sure you're using the service role key, not the anon key
   - Check your Supabase RLS policies

3. **Invalid JSON**
   - When passing points as JSON, ensure proper escaping
   - Use single quotes around the entire command

### Debug Mode

Set `DEBUG=1` to enable verbose logging:

```bash
DEBUG=1 npm run cli -- whiteboard list
```
