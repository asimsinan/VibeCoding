# 📅 Appointment Scheduler

A modern, full-stack appointment scheduling application built with React, Node.js, and PostgreSQL. Features a beautiful calendar interface, real-time availability checking, and comprehensive appointment management.

## 🌐 Live Demo

**Try it now**: [https://appointment-scheduler-sooty.vercel.app](https://appointment-scheduler-sooty.vercel.app)

The application is deployed on Vercel and ready to use immediately!

## ✨ Features

- **📅 Interactive Calendar**: Beautiful month view with appointment visualization
- **⏰ Time Slot Management**: Configurable business hours and appointment durations
- **🔍 Real-time Availability**: Live checking of available time slots
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🎨 Modern UI**: Clean, professional interface with smooth animations
- **🔒 Conflict Prevention**: Automatic detection and prevention of double bookings
- **🌍 Timezone Support**: Full timezone awareness for global users
- **📊 Health Monitoring**: Built-in health checks and monitoring

## 🛠️ Tech Stack

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Webpack** for bundling
- **Progressive Web App** capabilities

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Knex.js** for database queries
- **RESTful API** design

### Infrastructure
- **Vercel** for hosting and deployment
- **Vercel Functions** for serverless backend
- **PostgreSQL** on Vercel storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd AppointmentScheduler
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your database URL and settings
   ```

4. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📋 Environment Variables

Create a `.env.local` file with the following variables:

```bash
DATABASE_URL=postgres://your-database-url
NODE_ENV=development
PORT=3000
DEFAULT_TIMEZONE=Europe/Istanbul
BUSINESS_START_HOUR=9
BUSINESS_END_HOUR=16
APPOINTMENT_DURATION_MINUTES=60
```

## 🧪 Testing

The project follows Test-Driven Development (TDD) with comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and database integration
- **E2E Tests**: Full user workflow testing with Playwright
- **Contract Tests**: API contract validation

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/          # React components
├── client/             # API client and services
├── styles/             # CSS and styling
└── template.html       # HTML template
```

### Backend Architecture
```
src/
├── api/                # API routes and middleware
├── models/             # Data models and validation
├── services/           # Business logic
├── repositories/       # Data access layer
└── config/             # Configuration files
```

## 📊 API Endpoints

### Health Check
- `GET /api/v1/health` - Application health status

### Calendar
- `GET /api/v1/calendar/:year/:month` - Get calendar data for a month
- `GET /api/v1/calendar/:year/:month/:day` - Get specific day availability

### Appointments
- `GET /api/v1/appointments` - List all appointments
- `POST /api/v1/appointments` - Create new appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Delete appointment

## 🚀 Deployment

### Vercel Deployment

The application is already deployed on Vercel at:
**https://appointment-scheduler-sooty.vercel.app**

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard

4. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

## 🔧 Configuration

### Business Hours
Configure your business hours in environment variables:
- `BUSINESS_START_HOUR`: Start hour (24-hour format)
- `BUSINESS_END_HOUR`: End hour (24-hour format)
- `APPOINTMENT_DURATION_MINUTES`: Default appointment duration

### Timezone
Set your default timezone:
- `DEFAULT_TIMEZONE`: IANA timezone identifier (e.g., "Europe/Istanbul")

## 📱 Progressive Web App

The application includes PWA capabilities:
- **Offline Support**: Basic functionality works offline
- **Install Prompt**: Users can install the app on their devices
- **Service Worker**: Caches resources for better performance

## 🎨 Customization

### Styling
The app uses Tailwind CSS for styling. Customize the appearance by:
- Modifying `src/styles/tailwind.css`
- Updating `tailwind.config.js`
- Adding custom CSS classes

### Components
All React components are modular and easily customizable:
- `CalendarView.jsx` - Main calendar component
- `AppointmentForm.jsx` - Appointment creation form
- `AppointmentList.jsx` - List of appointments

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify `DATABASE_URL` is correct
   - Check database server is running
   - Ensure SSL settings are proper

2. **Build Errors**:
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **API Not Working**:
   - Check environment variables are set
   - Verify database migrations completed
   - Check Vercel function logs

## 📈 Performance

The application is optimized for performance:
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Optimized images and icons
- **Caching**: Strategic caching of API responses
- **Bundle Optimization**: Minified and compressed assets

## 🔒 Security

Security features include:
- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin settings
- **Error Handling**: Secure error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Deployed on Vercel platform
- Database powered by PostgreSQL
- UI components styled with Tailwind CSS

---

**Live Demo**: [https://appointment-scheduler-sooty.vercel.app](https://appointment-scheduler-sooty.vercel.app)

**Status**: ✅ Deployed and Ready to Use
