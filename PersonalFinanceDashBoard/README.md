# Personal Finance Dashboard

## 🚀 Project Overview
A comprehensive personal finance tracking application with features for managing transactions, categories, and financial insights.

## 🌐 Live Demo

**Try it now**: [https://personalfinancedashboard.vercel.app/](https://personalfinancedashboard.vercel.app/)

The application is deployed on Vercel and ready to use immediately!

## 📋 Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- PostgreSQL database (Neon recommended)

## 🔧 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/personal-finance-dashboard.git
cd personal-finance-dashboard
```

### 2. Environment Configuration
1. Create a `.env` file in the project root
2. Add the following configuration:
```
# Database Connection
NEON_DATABASE_URL=postgresql://your_username:your_password@your_neon_instance.neon.tech/neondb?sslmode=require

# JWT Authentication
JWT_SECRET=your_very_secure_random_string

# Application Configuration
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api

# Demo User
DEMO_USER_ID=a22002ba-8d08-41d4-8c07-62784123244a
DEMO_EMAIL=demo@example.com
DEMO_PASSWORD=demo_password_hash
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install web dependencies
cd web
npm install

# Install API dependencies
cd ../api
npm install
```

### 4. Database Setup
```bash
# From project root
npm run setup:db
```

### 5. Running the Application
- Start API Server (Terminal 1):
```bash
npm run start:api
```

- Start Frontend Dev Server (Terminal 2):
```bash
cd web
npm run dev
```

## 🌐 Deployment

### Vercel Deployment
- Ensure all environment variables are set in Vercel project settings
- Use the following commands:
```bash
# Deploy to Vercel
npm run deploy

# Deploy to production
npm run deploy:prod
```

## 🛠 Troubleshooting
- Verify database connection
- Check Vercel logs for deployment issues
- Ensure all dependencies are correctly installed

## 📦 Key Technologies
- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express
- Database: PostgreSQL (Neon)
- Deployment: Vercel

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License
[Your License Here]
