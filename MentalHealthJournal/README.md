# Mental Health Journal

## 🚀 Project Overview
A comprehensive mental health tracking application that allows users to log their daily mood, view trend charts, and gain insights into their emotional patterns. Built with Next.js, TypeScript, and modern web technologies.

## 🌐 Live Demo

**Try it now**: [https://moodtracker-lac.vercel.app](https://moodtracker-lac.vercel.app)

The application is deployed on Vercel and ready to use immediately!

## ✨ Features

### Daily Mood Tracking
- Log your mood daily with a simple 1-10 rating system
- Add optional notes to capture your emotional state
- Track mood patterns over time

### Trend Analysis
- View interactive charts showing your mood patterns
- Analyze trends over different time periods (week, month, year)
- Identify patterns and correlations in your emotional well-being

### Data Privacy
- Your data is stored locally in your browser with optional cloud sync
- Privacy-first approach with client-side data processing
- Optional cloud backup for data persistence

### Responsive Design
- Access your mood journal on any device
- Mobile, tablet, and desktop optimized
- Consistent experience across all platforms

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with React-ChartJS-2
- **State Management**: Zustand
- **Data Storage**: IndexedDB (local) + PostgreSQL (cloud)
- **Testing**: Jest, Playwright, Testing Library
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- PostgreSQL database (for cloud sync - optional)

## 🔧 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mental-health-journal.git
cd mental-health-journal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the project root:
```env
# Database (Optional - for cloud sync)
DATABASE_URL=postgresql://username:password@localhost:5432/moodtracker

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup (Optional)
If you want to enable cloud sync:
```bash
# Run database migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Running the Application
```bash
# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e

# Run contract tests
npm run test:contract
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

# Start production server
npm run start
```

## 📱 Usage

1. **Log Mood**: Click "Log Mood" to record your daily mood rating and notes
2. **View History**: Browse your mood entries chronologically
3. **Analyze Trends**: View interactive charts to understand your mood patterns
4. **Data Sync**: Enable cloud sync to backup your data (optional)

## 🔒 Privacy & Security

- All data is processed client-side by default
- Optional cloud sync with encrypted data transmission
- No personal information is collected without consent
- Data is stored securely with industry-standard encryption

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
- Check the [Issues](https://github.com/yourusername/mental-health-journal/issues) page
- Create a new issue with detailed information
- Contact the development team

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for accessible mental health tracking tools
- Community feedback and contributions

---

**Built with ❤️ for better mental health awareness**
