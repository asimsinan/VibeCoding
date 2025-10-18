# 🏠 AR Decorator App

A cutting-edge Augmented Reality (AR) application that revolutionizes interior design and home decoration. Experience the future of home design by visualizing furniture, decor, and design elements in your actual space using advanced AR technology.

## 🌐 Live Demo

**Try it now**: [https://web-dun-ten-40.vercel.app](https://web-dun-ten-40.vercel.app)

The application is deployed on Vercel and ready to use immediately! Experience AR-powered interior design right in your browser.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with WebXR/WebGL support
- Camera access for AR functionality
- Stable internet connection
- Git

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ArDecorator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="your_database_connection_string"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AR Configuration
NEXT_PUBLIC_AR_ENABLED="true"
NEXT_PUBLIC_WEBXR_ENABLED="true"
NEXT_PUBLIC_CAMERA_PERMISSIONS="required"

# 3D Model Storage
NEXT_PUBLIC_MODEL_BASE_URL="https://your-cdn.com/models"
MODEL_STORAGE_BUCKET="your-model-storage-bucket"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="/api"

# Optional: Payment Integration
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret"
```

## 🎯 Features

### Core AR Functionality
- ✅ **Real-time AR Visualization**: Place and view furniture in your actual space
- ✅ **3D Model Rendering**: High-quality 3D models with realistic textures
- ✅ **Room Scanning**: Automatic room detection and surface mapping
- ✅ **Object Placement**: Intuitive drag-and-drop furniture placement
- ✅ **Scale Adjustment**: Resize objects to match your space perfectly
- ✅ **Rotation Controls**: Rotate objects in 3D space
- ✅ **Lighting Simulation**: Realistic lighting effects and shadows

### Furniture & Decor Catalog
- ✅ **Extensive Catalog**: Thousands of furniture and decor items
- ✅ **Categories**: Living room, bedroom, kitchen, office, and outdoor furniture
- ✅ **Brand Partnerships**: Items from top furniture brands and retailers
- ✅ **Price Integration**: Real-time pricing and availability
- ✅ **Product Details**: Detailed specifications, materials, and dimensions
- ✅ **Customer Reviews**: User reviews and ratings for each item
- ✅ **Wishlist**: Save favorite items for later

### Design Tools
- ✅ **Room Templates**: Pre-designed room layouts and themes
- ✅ **Color Matching**: Match furniture colors with your existing decor
- ✅ **Style Filters**: Filter by design styles (modern, traditional, minimalist)
- ✅ **Budget Planning**: Set budget limits and find items within range
- ✅ **Measurement Tools**: Precise measurement tools for accurate placement
- ✅ **Screenshot Capture**: Save and share your AR designs
- ✅ **Design History**: Save and revisit previous designs

### User Experience
- ✅ **Mobile-First**: Optimized for mobile devices with AR capabilities
- ✅ **Desktop Support**: Full functionality on desktop with webcam
- ✅ **Touch Controls**: Intuitive touch gestures for object manipulation
- ✅ **Voice Commands**: Voice-activated controls for hands-free operation
- ✅ **Accessibility**: Screen reader support and accessibility features
- ✅ **Offline Mode**: Basic functionality without internet connection
- ✅ **Multi-language**: Support for multiple languages

### Social Features
- ✅ **Design Sharing**: Share your AR designs with friends and family
- ✅ **Community Gallery**: Browse designs created by other users
- ✅ **Design Challenges**: Participate in weekly design challenges
- ✅ **Expert Reviews**: Get feedback from interior design professionals
- ✅ **Collaboration**: Work together on designs with family members
- ✅ **Social Login**: Sign in with Google, Facebook, or Apple

### Advanced Features
- ✅ **AI Recommendations**: AI-powered furniture and decor suggestions
- ✅ **Virtual Stylist**: Get personalized design advice
- ✅ **Room Analysis**: AI analysis of your space and design potential
- ✅ **Shopping Integration**: Direct links to purchase items
- ✅ **Delivery Tracking**: Track furniture delivery and setup
- ✅ **AR Measurements**: Measure spaces using AR technology
- ✅ **Virtual Tours**: Create virtual tours of your designed spaces

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Three.js**: 3D graphics and WebGL rendering
- **AR.js**: Augmented Reality framework
- **WebXR**: Extended Reality API for immersive experiences
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling and validation
- **Zustand**: Lightweight state management

### AR & 3D
- **WebXR Device API**: Access to AR/VR devices
- **WebGL**: Hardware-accelerated 3D graphics
- **GLTF Loader**: 3D model loading and optimization
- **Camera API**: Device camera access for AR
- **Sensors API**: Device orientation and motion sensors

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database for persistent storage
- **NextAuth.js**: Authentication and session management
- **Cloudinary**: Image and 3D model storage
- **Redis**: Caching and session management

### Deployment & Infrastructure
- **Vercel**: Hosting and deployment platform
- **Vercel Postgres**: Managed PostgreSQL database
- **Vercel Blob**: File storage and management
- **Cloudflare**: CDN and performance optimization
- **AWS S3**: 3D model and asset storage

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Playwright**: End-to-end testing
- **Husky**: Git hooks for quality assurance

## 📁 Project Structure

```
ArDecorator/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── ar/                # AR experience pages
│   │   ├── catalog/           # Furniture catalog pages
│   │   ├── design/            # Design tool pages
│   │   ├── dashboard/        # User dashboard
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── ar/               # AR-specific components
│   │   ├── 3d/               # 3D model components
│   │   ├── catalog/          # Catalog components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── ar/               # AR utilities
│   │   ├── three/            # Three.js utilities
│   │   ├── models/           # 3D model utilities
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database connection
│   │   └── utils.ts          # General utilities
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── stores/               # State management stores
├── public/                   # Static assets
│   ├── models/              # 3D model files
│   └── textures/            # Texture files
├── prisma/                   # Database schema and migrations
├── tests/                    # Test files
└── docs/                     # Documentation
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e

# Run AR functionality tests
npm run test:ar

# Run 3D model tests
npm run test:3d
```

### Test Structure

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **AR Tests**: AR functionality and camera integration testing
- **3D Tests**: 3D model loading and rendering testing
- **Performance Tests**: AR performance and optimization testing

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

2. **Environment Variables**:
   Set the following environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_AR_ENABLED`
   - `NEXT_PUBLIC_MODEL_BASE_URL`
   - `MODEL_STORAGE_BUCKET`

3. **Database Setup**:
   ```bash
   # Run database migrations
   npx prisma migrate deploy
   
   # Seed the database (optional)
   npx prisma db seed
   ```

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📖 Usage

### Getting Started

1. **Create Account**: Register and verify your email
2. **Grant Permissions**: Allow camera access for AR functionality
3. **Scan Your Room**: Point your camera at the space you want to decorate
4. **Browse Catalog**: Explore furniture and decor items
5. **Place Items**: Drag and drop items into your space
6. **Customize**: Adjust size, rotation, and position
7. **Save Design**: Save your design for later reference

### AR Controls

- **Camera**: Point your device camera at the space
- **Touch**: Tap to place items, drag to move them
- **Pinch**: Pinch to resize objects
- **Rotate**: Use two fingers to rotate objects
- **Screenshot**: Capture your AR design
- **Reset**: Clear all placed items

### Design Tools

- **Room Templates**: Choose from pre-designed layouts
- **Style Filters**: Filter by design style and color
- **Budget Planning**: Set budget limits for your design
- **Measurement**: Use AR to measure your space
- **Color Matching**: Match furniture with existing decor

### Catalog Features

- **Search**: Find specific furniture items
- **Categories**: Browse by room type or furniture category
- **Filters**: Filter by price, brand, style, and color
- **Wishlist**: Save items for later consideration
- **Reviews**: Read customer reviews and ratings
- **Purchase**: Direct links to buy items

## 🔒 Security

- **Authentication**: Secure JWT-based authentication
- **Authorization**: User-level permissions and access control
- **Data Encryption**: Encrypted data transmission and storage
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS**: Secure communication with SSL/TLS
- **CORS**: Proper cross-origin resource sharing configuration

## 📊 Performance

- **AR Optimization**: Optimized AR rendering for smooth performance
- **3D Model Optimization**: Compressed 3D models for faster loading
- **Caching**: Intelligent caching for improved performance
- **CDN**: Global content delivery network
- **Lazy Loading**: On-demand loading of 3D models
- **Progressive Enhancement**: Graceful degradation for older devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features, especially AR functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Test on multiple devices and browsers

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Catalog Endpoints

- `GET /api/catalog` - Get furniture catalog
- `GET /api/catalog/[id]` - Get specific item details
- `GET /api/catalog/search` - Search catalog items
- `GET /api/catalog/categories` - Get categories
- `GET /api/catalog/filters` - Get available filters

### Design Endpoints

- `GET /api/designs` - Get user's saved designs
- `POST /api/designs` - Save new design
- `GET /api/designs/[id]` - Get specific design
- `PUT /api/designs/[id]` - Update design
- `DELETE /api/designs/[id]` - Delete design
- `POST /api/designs/[id]/share` - Share design

### AR Endpoints

- `POST /api/ar/scan` - Process room scan
- `GET /api/ar/models` - Get 3D models
- `POST /api/ar/placement` - Save AR placement data
- `GET /api/ar/session` - Get AR session data

## 🐛 Troubleshooting

### Common Issues

1. **AR Not Working**:
   - Check browser WebXR support
   - Ensure camera permissions are granted
   - Try a different browser

2. **3D Models Not Loading**:
   - Check internet connection
   - Clear browser cache
   - Try refreshing the page

3. **Performance Issues**:
   - Close unnecessary browser tabs
   - Check device specifications
   - Reduce model quality settings

4. **Camera Access Denied**:
   - Check browser permissions
   - Try refreshing the page
   - Use a different browser

### Getting Help

- Check the [Issues](https://github.com/your-org/ardecorator/issues) page
- Review the [Documentation](https://github.com/your-org/ardecorator/wiki)
- Contact support at support@ardecorator.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Three.js](https://threejs.org/) for 3D graphics
- [AR.js](https://ar-js-org.github.io/AR.js-Docs/) for AR functionality
- [WebXR](https://www.w3.org/TR/webxr/) for immersive experiences
- [Vercel](https://vercel.com/) for hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Support

- **Email**: support@ardecorator.com
- **Documentation**: [docs.ardecorator.com](https://docs.ardecorator.com)
- **Community**: [Discord Server](https://discord.gg/ardecorator)

---

**Built with ❤️ for the future of interior design**
