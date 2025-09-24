# Invoice Generator

A full-stack invoice generation application with React frontend and Express.js API backend.

## Features

- 📝 Create and manage invoices
- 👥 Client information management
- 📊 Line items with calculations
- 💰 Tax calculations
- 📄 PDF generation and download
- 🔗 RESTful API backend
- 💾 Data persistence (in-memory)

## Quick Start

### Option 1: One Command (Recommended)
```bash
npm run dev:full
```

### Option 2: Using Start Script
```bash
./start.sh
```

### Option 3: Manual Start
```bash
# Terminal 1 - Backend API
npm run dev:api

# Terminal 2 - Frontend
npm run dev
```

## Available Commands

### Development
- `npm run dev` - Start React frontend only
- `npm run dev:api` - Start API backend only  
- `npm run dev:full` - Start both frontend and backend
- `./start.sh` - Build API and start both servers

### Building
- `npm run build` - Build React app for production
- `npm run build:api` - Compile TypeScript API server

### Testing
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
