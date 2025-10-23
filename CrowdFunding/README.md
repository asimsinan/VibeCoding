# Dilenci - Crowdfunding Platform

A modern, full-stack crowdfunding platform built with Next.js, TypeScript, and PostgreSQL. Users can create campaigns, make donations, and track funding progress in real-time.

## 🌐 Live Demo

**Demo URL:** https://dilenci.vercel.app

## ✨ Features

### 🎯 Campaign Management
- **Create Campaigns** - Users can create and manage their own crowdfunding campaigns
- **Campaign Categories** - Technology, Healthcare, Education, Environment, Arts, Sports, Business
- **Image Support** - Upload campaign images to make campaigns more appealing
- **Real-time Progress** - Live updates of funding progress and donor count
- **Campaign Status** - Draft, Active, Completed, Cancelled, Suspended states

### 💰 Donation System
- **Secure Donations** - Make donations with credit card or bank transfer
- **Anonymous Donations** - Option to donate anonymously
- **Donation Messages** - Leave supportive messages with donations
- **Recent Donations** - See recent donors and their contributions
- **Donor Count** - Track unique donors for each campaign

### 👤 User Management
- **User Registration** - Create accounts with email and password
- **Authentication** - Secure JWT-based authentication
- **User Profiles** - Manage user information and avatar
- **Campaign Ownership** - Users can only edit/delete their own campaigns

### 📊 Platform Features
- **Featured Campaigns** - Highlighted campaigns on homepage
- **Trending Campaigns** - Most funded campaigns
- **Search & Filter** - Find campaigns by category, status, or keywords
- **Responsive Design** - Works perfectly on desktop and mobile
- **Real-time Updates** - Live data updates without page refresh

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - State management and side effects
- **Axios** - HTTP client for API calls

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database toolkit and query builder
- **PostgreSQL** - Production-ready relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Deployment
- **Vercel** - Frontend and API deployment
- **Neon DB** - Cloud PostgreSQL database
- **Environment Variables** - Secure configuration management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dilenci.git
   cd dilenci
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your environment variables:
   ```env
   DATABASE_URL="your_postgresql_connection_string"
   JWT_SECRET="your_jwt_secret_key"
   NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── campaigns/         # Campaign pages
│   └── my-campaigns/      # User campaign management
├── components/            # Reusable UI components
├── contexts/              # React contexts (Auth)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── middleware/            # Express middleware
├── models/                # Data models
├── repositories/          # Database repositories
├── services/              # Business logic services
└── types/                 # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data

## 🎨 Design System

The platform uses a consistent design system with:
- **Primary Colors** - Blue gradient theme
- **Typography** - Clean, readable fonts
- **Components** - Reusable UI components
- **Responsive Layout** - Mobile-first design
- **Accessibility** - WCAG compliant

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Input Validation** - Server-side validation
- **CORS Protection** - Cross-origin request security
- **Rate Limiting** - API rate limiting
- **SQL Injection Protection** - Prisma ORM protection

## 📱 Mobile Support

The platform is fully responsive and works seamlessly on:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktop computers
- 🖥️ Large screens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using Next.js and TypeScript
- Database powered by PostgreSQL and Prisma
- Deployed on Vercel
- Icons from Heroicons
- Images from Unsplash

## 📞 Support

For support, email support@dilenci.com or create an issue on GitHub.

---

**Live Demo:** https://dilenci.vercel.app
