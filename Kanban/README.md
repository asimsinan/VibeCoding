# 📋 Kanban Board App

A powerful and intuitive Kanban board application designed to streamline project management, task organization, and team collaboration. Built with modern web technologies for seamless workflow management and real-time collaboration.

## 🌐 Live Demo

**Try it now**: [https://kanban-app-ten-mu.vercel.app](https://kanban-app-ten-mu.vercel.app)

The application is deployed on Vercel and ready to use immediately! Start organizing your projects and boosting productivity right away.

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
cd Kanban

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

### Core Kanban Functionality
- ✅ **Drag & Drop**: Intuitive drag-and-drop interface for task management
- ✅ **Multiple Boards**: Create and manage multiple Kanban boards
- ✅ **Custom Columns**: Create custom columns with different statuses
- ✅ **Task Cards**: Rich task cards with descriptions, due dates, and labels
- ✅ **Task Filtering**: Filter tasks by assignee, priority, due date, or labels
- ✅ **Task Search**: Quick search functionality across all tasks
- ✅ **Bulk Operations**: Select and move multiple tasks simultaneously

### Task Management
- ✅ **Task Creation**: Quick task creation with detailed information
- ✅ **Task Editing**: In-line editing for task titles and descriptions
- ✅ **Due Dates**: Set and track task due dates with visual indicators
- ✅ **Priority Levels**: Assign priority levels (High, Medium, Low)
- ✅ **Labels & Tags**: Categorize tasks with custom labels and tags
- ✅ **Task Comments**: Add comments and discussions to tasks
- ✅ **File Attachments**: Attach files and images to tasks
- ✅ **Checklists**: Create sub-tasks with checklists

### Team Collaboration
- ✅ **User Management**: Invite team members to boards
- ✅ **Role-based Access**: Different permission levels for team members
- ✅ **Real-time Updates**: Live updates when team members make changes
- ✅ **Activity Feed**: Track all board activities and changes
- ✅ **Notifications**: Get notified about task assignments and updates
- ✅ **Team Chat**: Built-in chat for team communication
- ✅ **User Presence**: See who's online and actively working

### Advanced Features
- ✅ **Board Templates**: Pre-built templates for common workflows
- ✅ **Automation Rules**: Set up automatic task movements and assignments
- ✅ **Time Tracking**: Track time spent on tasks and projects
- ✅ **Reporting**: Generate reports on team productivity and task completion
- ✅ **Calendar View**: View tasks in calendar format
- ✅ **Gantt Chart**: Visualize project timelines and dependencies
- ✅ **Export Options**: Export boards as PDF, CSV, or JSON

### User Experience
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ✅ **Dark/Light Mode**: Toggle between dark and light themes
- ✅ **Keyboard Shortcuts**: Power user shortcuts for efficient workflow
- ✅ **Accessibility**: WCAG 2.1 AA compliant interface
- ✅ **Performance**: Optimized for smooth performance with large boards
- ✅ **Offline Support**: Basic offline functionality for viewing tasks

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **React DnD**: Drag and drop functionality
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling and validation
- **Zustand**: Lightweight state management
- **React Query**: Data fetching and caching

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM and migrations
- **PostgreSQL**: Primary database for persistent storage
- **NextAuth.js**: Authentication and session management
- **Nodemailer**: Email service integration

### Real-time Features
- **Socket.io**: WebSocket communication for real-time updates
- **Redis**: In-memory data store for session management

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
Kanban/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── board/             # Kanban board pages
│   │   │   ├── [id]/         # Individual board pages
│   │   │   └── create/        # Board creation
│   │   ├── dashboard/         # User dashboard
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── board/            # Board-specific components
│   │   ├── task/             # Task-related components
│   │   ├── drag-drop/        # Drag and drop components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database connection
│   │   ├── email.ts          # Email service
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

# Run drag-and-drop tests
npm run test:dnd
```

### Test Structure

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database testing
- **E2E Tests**: Complete user workflow testing
- **Drag & Drop Tests**: Drag and drop functionality testing
- **Performance Tests**: Large board performance testing

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
   - `REDIS_URL` (if using real-time features)

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
2. **Create Board**: Start a new Kanban board or choose a template
3. **Add Columns**: Create columns for different task statuses
4. **Create Tasks**: Add tasks to your board with details
5. **Invite Team**: Share your board with team members
6. **Start Working**: Drag and drop tasks as they progress

### Board Management

- **Create Board**: Click "New Board" to create a new Kanban board
- **Customize Columns**: Add, remove, or rename columns as needed
- **Board Settings**: Configure board permissions and notifications
- **Board Templates**: Use pre-built templates for common workflows
- **Archive Board**: Archive completed or inactive boards

### Task Management

- **Create Task**: Click the "+" button in any column to add a task
- **Edit Task**: Click on a task to edit its details
- **Move Task**: Drag and drop tasks between columns
- **Assign Task**: Assign tasks to team members
- **Set Due Date**: Add due dates with visual indicators
- **Add Labels**: Categorize tasks with color-coded labels

### Team Collaboration

- **Invite Members**: Share board links or send email invitations
- **Set Permissions**: Control who can view, edit, or manage the board
- **Track Activity**: Monitor team activity in the activity feed
- **Communicate**: Use the built-in chat for team discussions
- **Get Notified**: Receive notifications for task assignments and updates

## 🔒 Security

- **Authentication**: Secure JWT-based authentication
- **Authorization**: Board-level permissions and access control
- **Data Encryption**: Encrypted data transmission and storage
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS**: Secure communication with SSL/TLS
- **CORS**: Proper cross-origin resource sharing configuration

## 📊 Performance

- **Optimized Rendering**: Efficient rendering for large boards
- **Lazy Loading**: On-demand loading of board content
- **Caching**: Intelligent caching for improved performance
- **CDN**: Global content delivery network
- **Real-time Updates**: Optimized WebSocket communication
- **Memory Management**: Smart memory usage for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features, especially drag-and-drop functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Test with large boards to ensure performance

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
- `POST /api/boards/[id]/invite` - Invite users to board

### Task Endpoints

- `GET /api/boards/[id]/tasks` - Get board tasks
- `POST /api/boards/[id]/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/move` - Move task between columns

### Column Endpoints

- `POST /api/boards/[id]/columns` - Create new column
- `PUT /api/columns/[id]` - Update column
- `DELETE /api/columns/[id]` - Delete column
- `POST /api/columns/[id]/reorder` - Reorder columns

## 🐛 Troubleshooting

### Common Issues

1. **Drag & Drop Not Working**:
   - Check browser compatibility
   - Ensure JavaScript is enabled
   - Try refreshing the page

2. **Real-time Updates Not Working**:
   - Verify WebSocket connection
   - Check firewall settings
   - Ensure Redis is running

3. **Performance Issues**:
   - Reduce number of tasks per column
   - Close unnecessary browser tabs
   - Check network connection

4. **Export Problems**:
   - Ensure board has content
   - Check file permissions
   - Try different export format

### Getting Help

- Check the [Issues](https://github.com/your-org/kanban/issues) page
- Review the [Documentation](https://github.com/your-org/kanban/wiki)
- Contact support at support@kanban.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [React DnD](https://react-dnd.github.io/react-dnd/) for drag and drop functionality
- [Vercel](https://vercel.com/) for hosting and deployment
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prisma](https://prisma.io/) for the database ORM
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

## 📞 Support

- **Email**: support@kanban.com
- **Documentation**: [docs.kanban.com](https://docs.kanban.com)
- **Community**: [Discord Server](https://discord.gg/kanban)

---

**Built with ❤️ for productive teams**
