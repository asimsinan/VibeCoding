# 🎉 Event Organizer

A comprehensive virtual event management platform built with modern web technologies, designed to streamline event planning, management, and execution.

## 🌐 Live Demo

**Try it now**: [https://virtual-event-organizer.vercel.app](https://virtual-event-organizer.vercel.app)

The application is deployed on Vercel and ready to use immediately!

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser
- Git

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd EventOrganizer

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

# Email Service (Optional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="/api"
```

## 🎯 Features

### Core Event Management
- ✅ **Event Creation**: Create and manage virtual events with detailed information
- ✅ **Event Discovery**: Browse and search through available events
- ✅ **Event Registration**: User-friendly registration process with confirmation
- ✅ **Event Scheduling**: Advanced calendar integration and time management
- ✅ **Event Categories**: Organize events by type, topic, and audience

### User Management
- ✅ **User Authentication**: Secure login and registration system
- ✅ **User Profiles**: Comprehensive user profile management
- ✅ **Role-based Access**: Different access levels for organizers and attendees
- ✅ **User Preferences**: Customizable notification and privacy settings

### Event Organization Tools
- ✅ **Event Dashboard**: Comprehensive overview of all events
- ✅ **Attendee Management**: Track and manage event participants
- ✅ **Event Analytics**: Detailed insights and reporting
- ✅ **Event Templates**: Reusable templates for common event types
- ✅ **Bulk Operations**: Efficient management of multiple events

### Communication Features
- ✅ **Event Notifications**: Automated email and in-app notifications
- ✅ **Event Updates**: Real-time updates and announcements
- ✅ **Event Chat**: Integrated messaging for event participants
- ✅ **Event Reminders**: Automated reminder system

### Advanced Features
- ✅ **Event Streaming**: Integration with video streaming platforms
- ✅ **Event Recording**: Record and archive event sessions
- ✅ **Event Polls**: Interactive polling and Q&A features
- ✅ **Event Resources**: File sharing and resource management
- ✅ **Event Feedback**: Post-event surveys and feedback collection

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling and validation
- **Zustand**: State management

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication and session management
- **Nodemailer**: Email service integration

### Deployment & Infrastructure
- **Vercel**: Hosting and deployment platform
- **Vercel Postgres**: Managed PostgreSQL database
- **Vercel Blob**: File storage and management
- **Vercel Analytics**: Performance monitoring

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Playwright**: End-to-end testing
- **Husky**: Git hooks for quality assurance

## 📁 Project Structure

```
EventOrganizer/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── events/            # Event management pages
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── event/            # Event-specific components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database connection
│   │   ├── email.ts          # Email service
│   │   └── utils.ts          # General utilities
│   ├── types/                # TypeScript type definitions
│   └── hooks/                # Custom React hooks
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
```

### Test Structure

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **Visual Tests**: UI component visual regression testing

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
   - `EMAIL_SERVER_*` (if using email features)

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

### For Event Organizers

1. **Create Account**: Register and verify your email
2. **Create Event**: Use the event creation wizard
3. **Customize Settings**: Configure event details, timing, and requirements
4. **Manage Attendees**: Track registrations and send updates
5. **Run Event**: Execute your event with live management tools
6. **Analyze Results**: Review post-event analytics and feedback

### For Event Attendees

1. **Browse Events**: Discover events by category, date, or keyword
2. **Register**: Sign up for events with one-click registration
3. **Receive Updates**: Get automatic notifications about event changes
4. **Participate**: Join events and interact with other attendees
5. **Provide Feedback**: Share your experience and suggestions

## 🔒 Security

- **Authentication**: Secure JWT-based authentication
- **Authorization**: Role-based access control
- **Data Protection**: Encrypted sensitive data storage
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS**: Secure communication with SSL/TLS

## 📊 Performance

- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Image Optimization**: Automatic image optimization and lazy loading
- **Code Splitting**: Dynamic imports for optimal bundle sizes
- **Caching**: Intelligent caching strategies
- **CDN**: Global content delivery network

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Event Endpoints

- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event
- `POST /api/events/[id]/register` - Register for event

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/events` - Get user's events

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correctly set
   - Ensure database is accessible
   - Run `npx prisma migrate deploy`

2. **Authentication Problems**:
   - Check `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches your domain
   - Clear browser cookies and try again

3. **Email Not Working**:
   - Verify email service credentials
   - Check spam folder
   - Test with a different email provider

### Getting Help

- Check the [Issues](https://github.com/your-org/event-organizer/issues) page
- Review the [Documentation](https://github.com/your-org/event-organizer/wiki)
- Contact support at support@eventorganizer.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Vercel](https://vercel.com/) for hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://prisma.io/) for the database ORM
- [NextAuth.js](https://next-auth.js.org/) for authentication

## 📞 Support

- **Email**: support@eventorganizer.com
- **Documentation**: [docs.eventorganizer.com](https://docs.eventorganizer.com)
- **Community**: [Discord Server](https://discord.gg/eventorganizer)

---

**Built with ❤️ for the event management community**
