# 🎨 Collaborative Whiteboard App

A real-time collaborative whiteboard application that enables teams to brainstorm, design, and work together in a shared digital workspace. Built with modern web technologies for seamless collaboration and intuitive user experience.

## 🌐 Live Demo

**Try it now**: [http://collaborative-whiteboard-app-beta.vercel.app](http://collaborative-whiteboard-app-beta.vercel.app)

The application is deployed on Vercel and ready to use immediately! Start collaborating with your team right away.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with WebSocket support
- Git

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd WhiteBoard

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

# WebSocket Configuration
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
WS_PORT=3001

# Redis (for real-time collaboration)
REDIS_URL="redis://localhost:6379"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="/api"

# File Storage
NEXT_PUBLIC_STORAGE_URL="http://localhost:3000/storage"
```

## 🎯 Features

### Core Drawing Tools
- ✅ **Freehand Drawing**: Smooth pen and brush tools with pressure sensitivity
- ✅ **Shape Tools**: Rectangle, circle, line, arrow, and polygon drawing
- ✅ **Text Tools**: Add text annotations with customizable fonts and sizes
- ✅ **Eraser**: Precise erasing with different brush sizes
- ✅ **Highlighter**: Transparent highlighting for emphasis
- ✅ **Color Picker**: Full color palette with custom color selection
- ✅ **Layer Management**: Organize elements with multiple layers

### Real-time Collaboration
- ✅ **Live Collaboration**: Multiple users can draw simultaneously
- ✅ **User Presence**: See who's online and where they're working
- ✅ **Cursor Tracking**: Real-time cursor positions of all collaborators
- ✅ **Conflict Resolution**: Automatic conflict resolution for simultaneous edits
- ✅ **Version History**: Track changes and revert to previous versions
- ✅ **Real-time Sync**: Instant synchronization across all connected clients

### Board Management
- ✅ **Multiple Boards**: Create and manage multiple whiteboard projects
- ✅ **Board Templates**: Pre-designed templates for common use cases
- ✅ **Board Sharing**: Share boards with specific users or make them public
- ✅ **Board Permissions**: Control who can view, edit, or manage boards
- ✅ **Board Search**: Find boards by name, tags, or content
- ✅ **Board Organization**: Organize boards into folders and categories

### Advanced Features
- ✅ **Image Import**: Upload and embed images into the whiteboard
- ✅ **PDF Export**: Export whiteboards as high-quality PDF files
- ✅ **PNG Export**: Save whiteboards as PNG images
- ✅ **Undo/Redo**: Full undo/redo functionality with history
- ✅ **Zoom & Pan**: Smooth zooming and panning for detailed work
- ✅ **Grid & Snap**: Optional grid overlay and snap-to-grid functionality

### User Experience
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ✅ **Touch Support**: Full touch gesture support for mobile devices
- ✅ **Keyboard Shortcuts**: Power user shortcuts for efficient workflow
- ✅ **Dark/Light Mode**: Toggle between dark and light themes
- ✅ **Accessibility**: WCAG 2.1 AA compliant interface
- ✅ **Performance**: Optimized for smooth performance with large boards

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Canvas API**: HTML5 Canvas for drawing functionality
- **Fabric.js**: Advanced canvas manipulation library
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Zustand**: Lightweight state management

### Real-time Communication
- **Socket.io**: WebSocket communication for real-time collaboration
- **Redis**: In-memory data store for session management
- **WebRTC**: Peer-to-peer communication for low-latency updates

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database for persistent storage
- **NextAuth.js**: Authentication and session management

### Deployment & Infrastructure
- **Vercel**: Hosting and deployment platform
- **Vercel Postgres**: Managed PostgreSQL database
- **Vercel Blob**: File storage and management
- **Upstash Redis**: Managed Redis service

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Playwright**: End-to-end testing
- **Husky**: Git hooks for quality assurance

## 📁 Project Structure

```
WhiteBoard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── board/             # Whiteboard pages
│   │   │   ├── [id]/         # Individual board pages
│   │   │   └── create/        # Board creation
│   │   ├── dashboard/         # User dashboard
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── canvas/           # Canvas-related components
│   │   ├── tools/            # Drawing tool components
│   │   ├── collaboration/    # Real-time collaboration components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── canvas/           # Canvas utilities
│   │   ├── websocket/        # WebSocket utilities
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database connection
│   │   └── utils.ts          # General utilities
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── stores/               # State management stores
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
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

# Run canvas-specific tests
npm run test:canvas
```

### Test Structure

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **Canvas Tests**: Drawing functionality and collaboration testing
- **Performance Tests**: Real-time collaboration performance testing

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
   - `REDIS_URL`
   - `NEXT_PUBLIC_WS_URL`

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

# Start WebSocket server (separate terminal)
npm run ws:start
```

## 📖 Usage

### Getting Started

1. **Create Account**: Register and verify your email
2. **Create Board**: Start a new whiteboard or choose a template
3. **Invite Collaborators**: Share your board with team members
4. **Start Drawing**: Use the toolbar to select tools and start creating
5. **Collaborate**: Work together in real-time with your team
6. **Save & Export**: Save your work and export when ready

### Drawing Tools

- **Pen Tool**: Click and drag to draw freehand lines
- **Shape Tools**: Click and drag to create rectangles, circles, or lines
- **Text Tool**: Click to add text annotations
- **Eraser**: Click and drag to erase parts of your drawing
- **Highlighter**: Click and drag to highlight areas
- **Color Picker**: Click to select colors from the palette

### Collaboration Features

- **User Presence**: See colored cursors of other users
- **Live Updates**: Watch changes appear in real-time
- **Chat**: Use the built-in chat for communication
- **Version History**: Access previous versions of your board
- **Export Options**: Save as PDF, PNG, or JSON

## 🔒 Security

- **Authentication**: Secure JWT-based authentication
- **Authorization**: Board-level permissions and access control
- **Data Encryption**: Encrypted data transmission and storage
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS**: Secure communication with SSL/TLS
- **CORS**: Proper cross-origin resource sharing configuration

## 📊 Performance

- **Real-time Updates**: Optimized WebSocket communication
- **Canvas Performance**: Efficient rendering for smooth drawing
- **Memory Management**: Smart memory usage for large boards
- **Caching**: Intelligent caching for improved performance
- **CDN**: Global content delivery network
- **Lazy Loading**: On-demand loading of board content

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features, especially canvas functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Test real-time collaboration features thoroughly

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Board Endpoints

- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/[id]` - Get board details
- `PUT /api/boards/[id]` - Update board
- `DELETE /api/boards/[id]` - Delete board
- `POST /api/boards/[id]/share` - Share board with users
- `GET /api/boards/[id]/export` - Export board

### WebSocket Events

- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `draw` - Drawing actions
- `cursor-move` - Cursor position updates
- `user-join` - User joined notification
- `user-leave` - User left notification

## 🐛 Troubleshooting

### Common Issues

1. **Canvas Not Loading**:
   - Check browser WebGL support
   - Clear browser cache
   - Try a different browser

2. **Real-time Collaboration Not Working**:
   - Verify WebSocket connection
   - Check firewall settings
   - Ensure Redis is running

3. **Performance Issues**:
   - Reduce board size
   - Close unnecessary browser tabs
   - Check network connection

4. **Export Problems**:
   - Ensure board has content
   - Check file permissions
   - Try different export format

### Getting Help

- Check the [Issues](https://github.com/your-org/whiteboard/issues) page
- Review the [Documentation](https://github.com/your-org/whiteboard/wiki)
- Contact support at support@whiteboard.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Fabric.js](http://fabricjs.com/) for canvas manipulation
- [Socket.io](https://socket.io/) for real-time communication
- [Vercel](https://vercel.com/) for hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://prisma.io/) for the database ORM

## 📞 Support

- **Email**: support@whiteboard.com
- **Documentation**: [docs.whiteboard.com](https://docs.whiteboard.com)
- **Community**: [Discord Server](https://discord.gg/whiteboard)

---

**Built with ❤️ for creative collaboration**
