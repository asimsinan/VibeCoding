# Personal Shopping Assistant

## 🚀 Project Overview
A virtual personal shopping assistant that provides AI-powered product recommendations based on user preferences, shopping history, and behavior patterns. Built with React, TypeScript, and Node.js, this application offers intelligent product discovery and personalized shopping experiences.

## 🌐 Live Demo

**Try it now**: [https://personal-shopping-assistant-fronten.vercel.app](https://personal-shopping-assistant-fronten.vercel.app)

The application is deployed on Vercel and ready to use immediately!

## ✨ Features

### Intelligent Product Recommendations
- AI-powered recommendation engine based on user preferences
- Machine learning algorithms for personalized suggestions
- Real-time product discovery and filtering
- Smart categorization and tagging system

### User Experience
- Intuitive and responsive user interface
- Advanced search and filtering capabilities
- Shopping cart and wishlist management
- User preference learning and adaptation

### Analytics & Insights
- Shopping pattern analysis
- Recommendation accuracy tracking
- User behavior insights
- Performance monitoring and optimization

### Security & Performance
- Secure authentication and authorization
- Rate limiting and security headers
- Database optimization and caching
- Comprehensive testing suite

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Jest & Testing Library** for testing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **JWT** authentication
- **Swagger** API documentation

### DevOps & Testing
- **Vercel** for deployment
- **Playwright** for E2E testing
- **Jest** for unit/integration testing
- **Docker** for containerization
- **Performance & Security** testing suites

## 📋 Prerequisites

- Node.js (v18+ recommended)
- npm (v8+ recommended)
- PostgreSQL database
- Git

## 🔧 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/personal-shopping-assistant.git
cd personal-shopping-assistant
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd src/frontend
npm install
cd ../..
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/personal_shopping_assistant

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# API Configuration
API_BASE_URL=http://localhost:3001/api/v1
```

### 4. Database Setup
```bash
# Create database
npm run db:create:test

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Running the Application

#### Development Mode (Full Stack)
```bash
# Start both backend and frontend
npm run dev
```

#### Individual Services
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

Visit [http://localhost:3000](http://localhost:3000) for the frontend and [http://localhost:3001](http://localhost:3001) for the API.

## 🧪 Testing

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:contract

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

### Performance Testing
```bash
# Run performance benchmarks
npm run perf:benchmark

# Run load tests
npm run perf:load

# Monitor performance
npm run perf:monitor

# Analyze performance
npm run perf:analyze
```

### Security Testing
```bash
# Run security tests
npm run security:test

# Test SQL injection protection
npm run security:sql

# Test security headers
npm run security:headers

# Run all security tests
npm run security:all
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to Vercel
npm run vercel-deploy

# Check deployment logs
npm run vercel-logs
```

### Docker Deployment
```bash
# Build Docker image
docker build -t personal-shopping-assistant .

# Run with Docker Compose
docker-compose up -d
```

## 📱 Usage

### Getting Started
1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Set Preferences**: Configure your shopping preferences and interests
3. **Browse Products**: Explore recommended products based on your preferences
4. **Add to Cart**: Add interesting products to your shopping cart
5. **View Recommendations**: Get personalized product suggestions

### Features
- **Smart Search**: Use advanced search filters to find specific products
- **Wishlist**: Save products for later consideration
- **Recommendations**: View AI-powered product suggestions
- **Analytics**: Track your shopping patterns and preferences

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Security headers with Helmet
- SQL injection prevention
- Rate limiting
- Input validation and sanitization

## 📊 Performance Features

- Database query optimization
- Caching strategies
- Lazy loading
- Code splitting
- Bundle optimization
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📄 API Documentation

The API documentation is available at `/api-docs` when running the application locally, or check the [API Documentation](docs/API_DOCUMENTATION.md) file.

## 🐛 Troubleshooting

### Common Issues
- **Database Connection**: Ensure PostgreSQL is running and credentials are correct
- **Port Conflicts**: Make sure ports 3000 and 3001 are available
- **Dependencies**: Run `npm install` in both root and frontend directories
- **Environment Variables**: Verify all required environment variables are set

### Getting Help
- Check the [Issues](https://github.com/yourusername/personal-shopping-assistant/issues) page
- Review the [User Guide](docs/USER_GUIDE.md)
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for personalized shopping experiences
- Community feedback and contributions
- Open source libraries and tools

---

**Built with ❤️ for smarter shopping experiences**
