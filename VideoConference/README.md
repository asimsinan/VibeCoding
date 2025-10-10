# 📹 VideoConference App

A modern, feature-rich video conferencing application that enables seamless virtual meetings, webinars, and collaborative sessions. Built with cutting-edge web technologies for high-quality video communication and real-time collaboration.

## 🌐 Live Demo

**Try it now**: [http://zuumcuk.vercel.app/dashboard](http://zuumcuk.vercel.app/dashboard)

The application is deployed on Vercel and ready to use immediately! Start hosting and joining video conferences right away.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with WebRTC support
- Microphone and camera access
- Stable internet connection
- Git

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd VideoConference

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

# WebRTC Configuration
NEXT_PUBLIC_STUN_SERVERS="stun:stun.l.google.com:19302"
NEXT_PUBLIC_TURN_SERVERS="turn:your-turn-server.com:3478"
TURN_USERNAME="your-turn-username"
TURN_CREDENTIAL="your-turn-credential"

# Socket.io Configuration
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
SOCKET_PORT=3001

# Redis (for real-time features)
REDIS_URL="redis://localhost:6379"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="/api"

# Optional: Email Service
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

## 🎯 Features

### Core Video Conferencing
- ✅ **HD Video Calls**: High-definition video streaming with adaptive quality
- ✅ **Audio Conferencing**: Crystal-clear audio with noise suppression
- ✅ **Screen Sharing**: Share your entire screen or specific applications
- ✅ **Recording**: Record meetings with high-quality audio and video
- ✅ **Live Streaming**: Stream meetings to larger audiences
- ✅ **Breakout Rooms**: Create separate rooms for group discussions
- ✅ **Waiting Room**: Control who enters your meeting

### Meeting Management
- ✅ **Scheduled Meetings**: Schedule meetings with calendar integration
- ✅ **Instant Meetings**: Start meetings instantly with one click
- ✅ **Meeting Links**: Shareable meeting links for easy access
- ✅ **Meeting Passwords**: Secure meetings with password protection
- ✅ **Meeting Duration**: Set meeting time limits and automatic end
- ✅ **Meeting History**: Track and review past meetings
- ✅ **Meeting Analytics**: Detailed insights on meeting participation

### Collaboration Tools
- ✅ **Chat**: Real-time text chat during meetings
- ✅ **File Sharing**: Share documents and files with participants
- ✅ **Whiteboard**: Collaborative whiteboard for brainstorming
- ✅ **Polls & Surveys**: Conduct polls and surveys during meetings
- ✅ **Hand Raising**: Virtual hand raising for Q&A sessions
- ✅ **Reactions**: Express reactions with emojis and gestures
- ✅ **Notes**: Take and share meeting notes

### User Management
- ✅ **User Authentication**: Secure login and registration system
- ✅ **User Profiles**: Comprehensive user profile management
- ✅ **Contact Management**: Manage contacts and invite lists
- ✅ **User Roles**: Different roles for hosts, co-hosts, and participants
- ✅ **User Permissions**: Granular control over user capabilities
- ✅ **Guest Access**: Allow guests to join without registration
- ✅ **User Analytics**: Track user engagement and participation

### Advanced Features
- ✅ **Virtual Backgrounds**: Custom virtual backgrounds and filters
- ✅ **AI Features**: AI-powered transcription and meeting summaries
- ✅ **Mobile Support**: Full-featured mobile app for iOS and Android
- ✅ **API Integration**: RESTful API for third-party integrations
- ✅ **Webhook Support**: Real-time webhooks for meeting events
- ✅ **Custom Branding**: White-label solution with custom branding
- ✅ **Enterprise Features**: Advanced security and compliance features

### User Experience
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ✅ **Accessibility**: WCAG 2.1 AA compliant interface
- ✅ **Keyboard Shortcuts**: Power user shortcuts for efficient navigation
- ✅ **Dark/Light Mode**: Toggle between dark and light themes
- ✅ **Performance**: Optimized for smooth performance with large groups
- ✅ **Offline Support**: Basic offline functionality for viewing recordings

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **WebRTC**: Real-time video and audio communication
- **Socket.io Client**: Real-time communication
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling and validation
- **Zustand**: Lightweight state management

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Socket.io**: WebSocket server for real-time communication
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database for persistent storage
- **NextAuth.js**: Authentication and session management
- **Redis**: In-memory data store for session management

### Video & Audio
- **WebRTC**: Peer-to-peer video and audio communication
- **MediaRecorder API**: Client-side recording functionality
- **Web Audio API**: Advanced audio processing
- **Canvas API**: Virtual backgrounds and effects

### Deployment & Infrastructure
- **Vercel**: Hosting and deployment platform
- **Vercel Postgres**: Managed PostgreSQL database
- **Vercel Blob**: File storage and management
- **Vercel Analytics**: Performance monitoring
- **Cloudflare**: CDN and DDoS protection

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Playwright**: End-to-end testing
- **Husky**: Git hooks for quality assurance

## 📁 Project Structure

```
VideoConference/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── meeting/           # Meeting pages
│   │   │   ├── [id]/         # Individual meeting pages
│   │   │   └── create/        # Meeting creation
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── video/            # Video-related components
│   │   ├── audio/            # Audio-related components
│   │   ├── meeting/          # Meeting-specific components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── webrtc/           # WebRTC utilities
│   │   ├── socket/           # Socket.io utilities
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

# Run WebRTC tests
npm run test:webrtc
```

### Test Structure

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **WebRTC Tests**: Video and audio functionality testing
- **Performance Tests**: Large group performance testing

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
   - `NEXT_PUBLIC_SOCKET_URL`
   - `NEXT_PUBLIC_STUN_SERVERS`
   - `NEXT_PUBLIC_TURN_SERVERS`

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

# Start Socket.io server (separate terminal)
npm run socket:start
```

## 📖 Usage

### Getting Started

1. **Create Account**: Register and verify your email
2. **Access Dashboard**: Navigate to the dashboard to manage meetings
3. **Create Meeting**: Start a new meeting or schedule one for later
4. **Invite Participants**: Share meeting links or send email invitations
5. **Start Meeting**: Join the meeting and begin video conferencing
6. **Use Features**: Utilize chat, screen sharing, and other collaboration tools

### Meeting Management

- **Create Meeting**: Click "New Meeting" to start instantly
- **Schedule Meeting**: Set up meetings for future dates and times
- **Meeting Settings**: Configure meeting options and permissions
- **Invite Participants**: Share meeting links or send email invitations
- **Manage Participants**: Control who can join and what they can do
- **End Meeting**: End meetings for all participants

### Video & Audio Controls

- **Camera**: Toggle camera on/off
- **Microphone**: Mute/unmute microphone
- **Screen Share**: Share your screen or specific applications
- **Chat**: Send messages to all participants or individuals
- **Reactions**: Express reactions with emojis
- **Virtual Background**: Change your background or add filters

### Collaboration Features

- **Whiteboard**: Collaborate on a shared whiteboard
- **File Sharing**: Share documents and files
- **Polls**: Conduct polls and surveys
- **Breakout Rooms**: Create separate rooms for group discussions
- **Recording**: Record meetings for later review
- **Notes**: Take and share meeting notes

## 🔒 Security

- **Authentication**: Secure JWT-based authentication
- **Authorization**: Meeting-level permissions and access control
- **Data Encryption**: End-to-end encryption for video and audio
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS**: Secure communication with SSL/TLS
- **CORS**: Proper cross-origin resource sharing configuration

## 📊 Performance

- **WebRTC Optimization**: Optimized peer-to-peer connections
- **Adaptive Quality**: Automatic quality adjustment based on network
- **Efficient Streaming**: Optimized video and audio streaming
- **Caching**: Intelligent caching for improved performance
- **CDN**: Global content delivery network
- **Real-time Updates**: Optimized WebSocket communication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features, especially WebRTC functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Test with multiple participants to ensure performance

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Meeting Endpoints

- `GET /api/meetings` - List user's meetings
- `POST /api/meetings` - Create new meeting
- `GET /api/meetings/[id]` - Get meeting details
- `PUT /api/meetings/[id]` - Update meeting
- `DELETE /api/meetings/[id]` - Delete meeting
- `POST /api/meetings/[id]/join` - Join meeting
- `POST /api/meetings/[id]/invite` - Invite users to meeting

### WebSocket Events

- `join-meeting` - Join a meeting room
- `leave-meeting` - Leave a meeting room
- `user-joined` - User joined notification
- `user-left` - User left notification
- `video-toggle` - Video on/off toggle
- `audio-toggle` - Audio on/off toggle
- `screen-share` - Screen sharing events
- `chat-message` - Chat message events

## 🐛 Troubleshooting

### Common Issues

1. **Camera/Microphone Not Working**:
   - Check browser permissions
   - Ensure devices are not used by other applications
   - Try refreshing the page

2. **Poor Video Quality**:
   - Check internet connection speed
   - Reduce video quality settings
   - Close unnecessary applications

3. **Audio Issues**:
   - Check microphone permissions
   - Test audio devices
   - Check audio settings

4. **Connection Problems**:
   - Verify firewall settings
   - Check network configuration
   - Try different network

### Getting Help

- Check the [Issues](https://github.com/your-org/videoconference/issues) page
- Review the [Documentation](https://github.com/your-org/videoconference/wiki)
- Contact support at support@videoconference.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [WebRTC](https://webrtc.org/) for real-time communication
- [Socket.io](https://socket.io/) for WebSocket communication
- [Vercel](https://vercel.com/) for hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://prisma.io/) for the database ORM

## 📞 Support

- **Email**: support@videoconference.com
- **Documentation**: [docs.videoconference.com](https://docs.videoconference.com)
- **Community**: [Discord Server](https://discord.gg/videoconference)

---

**Built with ❤️ for seamless communication**
