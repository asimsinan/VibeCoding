# Recipe Finder App 🍳

A modern web application that helps you find delicious recipes based on the ingredients you have available. Built with TypeScript, Express.js, and SQLite, featuring intelligent ingredient matching and comprehensive recipe search capabilities.

## 🌐 Live Demo

**Try the app live:** [https://recipe-finder-beta-three.vercel.app](https://recipe-finder-beta-three.vercel.app)

The app is deployed on Vercel and ready to use! Search for recipes using ingredients like "chicken", "pasta", "salmon", or any combination of ingredients you have available.

## ✨ Features

- **Smart Ingredient Search**: Find recipes using fuzzy matching and ingredient normalization
- **Advanced Filtering**: Filter by cooking time, difficulty level, and dietary preferences
- **Recipe Management**: Save favorites, view detailed recipes with ingredients and instructions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: Built with accessibility in mind, supporting screen readers and keyboard navigation
- **Real-time Search**: Instant search results with autocomplete suggestions
- **Recipe Scoring**: Intelligent scoring system that ranks recipes by relevance

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RecipeFinder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm run server
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with TypeScript |
| `npm run dev:server` | Start server with auto-reload (nodemon) |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run server` | Start the main server |
| `npm run lint` | Run ESLint for code quality |
| `npm run lint:fix` | Fix ESLint issues automatically |

### Testing

The project follows Test-Driven Development (TDD) methodology with comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:contract     # Contract tests

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Project Structure

```
RecipeFinder/
├── src/                    # TypeScript source code
│   ├── api/               # Express.js API layer
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # API routes
│   │   └── types/         # TypeScript type definitions
│   └── lib/               # Core business logic
│       ├── algorithms/    # Search and matching algorithms
│       ├── database/      # Database layer
│       └── entities/      # Data models
├── public/                # Static web assets
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   └── images/           # Images and icons
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── contract/          # Contract tests
├── dist/                  # Compiled JavaScript (generated)
└── data/                  # Sample data files
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
DB_PATH=./recipe-finder.db
```

### Database

The app uses SQLite for data storage. The database file (`recipe-finder.db`) will be created automatically on first run. Sample data is loaded from the `data/` directory.

## 📱 Usage

### Basic Search

1. Enter ingredients separated by commas (e.g., "chicken, tomato, onion")
2. Optionally apply filters for cooking time, difficulty, or dietary preferences
3. Click "Search Recipes" to find matching recipes
4. Browse results and click on any recipe for detailed information

### Advanced Features

- **Autocomplete**: Start typing ingredients to see suggestions
- **Favorites**: Save recipes you like for later reference
- **Sorting**: Sort results by relevance, cooking time, difficulty, or rating
- **Pagination**: Navigate through multiple pages of results

## 🏗️ Architecture

### Backend (Node.js + Express)

- **API Layer**: RESTful API with proper error handling and validation
- **Business Logic**: Ingredient normalization, fuzzy matching, and recipe scoring
- **Database Layer**: SQLite with proper schema and relationships
- **Security**: Rate limiting, CORS, and input validation

### Frontend (Vanilla JavaScript)

- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Performance**: Lazy loading, compression, and optimized assets
- **User Experience**: Smooth animations and intuitive interactions

## 🧪 Testing Strategy

The project implements comprehensive testing following TDD principles:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Contract Tests**: Ensure API contracts are maintained
- **Coverage**: Maintains 95%+ code coverage

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Set up database backups
4. Configure logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TDD methodology - write tests first
4. Make your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Maintain 95%+ test coverage
- Use ESLint for code quality
- Write comprehensive documentation
- Follow semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Database connection issues**
```bash
# Remove database file and restart
rm recipe-finder.db
npm run server
```

**Build errors**
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the test files for usage examples
- Check the API documentation in `docs/openapi.yaml`

## 🎯 Roadmap

- [ ] User authentication and profiles
- [ ] Recipe creation and editing
- [ ] Social features (sharing, reviews)
- [ ] Mobile app (React Native)
- [ ] Advanced dietary filters
- [ ] Recipe recommendations based on history
- [ ] Multi-language support

---

**Happy Cooking! 🍽️**

Built with ❤️ using TypeScript, Express.js, and modern web technologies.
