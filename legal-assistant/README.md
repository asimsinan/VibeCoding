# Turkish Legal Assistant

AI-powered legal document analysis and counseling platform for Turkish law compliance.

## 🚀 Live Demo

🌐 **[View Live Application](https://kavekaka.vercel.app)**

## 📋 Overview

**Turkish Legal Assistant** is a comprehensive web application that helps Turkish businesses and individuals analyze legal documents, check KVKK (GDPR-like) compliance, and receive AI-powered legal guidance in Turkish. The system allows users to upload contract templates and receive intelligent analysis about risks, obligations, and compliance requirements.

## ✨ Key Features

### 📄 Document Management
- **Upload Contract Templates** - Support for PDF and DOCX formats
- **Automatic Text Extraction** - Advanced parsing of legal documents
- **Document Library** - Manage and organize your legal documents
- **Secure Storage** - PostgreSQL with encrypted data at rest and in transit

### 💬 AI-Powered Chat Interface
- **Turkish Language Support** - Full localization with Turkish responses
- **Interactive Q&A** - Ask questions about your uploaded documents
- **Contextual Responses** - AI provides relevant answers based on document context
- **Source Citations** - Responses include references to legal sources

### 🔍 KVKK Compliance Analysis
- **Automated Compliance Checks** - Analyze documents for KVKK (Data Protection Law) compliance
- **Detailed Reports** - Comprehensive reports with findings and recommendations
- **Risk Assessment** - Identify potential legal risks and obligations
- **Plain Language Explanations** - Legal concepts explained in simple Turkish

### 📝 Contract Generation
- **Tailored Agreements** - Generate customized legal documents
- **Template Support** - Gizlilik (Privacy), Hizmet (Service), Danışmanlık (Consulting), Mesafeli Satış (Distance Sales), Aydınlatma Metni (Disclosure)
- **Turkish Legal Standards** - Documents comply with Turkish legal requirements

### 🔐 Security & Privacy
- **User Authentication** - Secure login and registration
- **Data Isolation** - Each user's documents are completely isolated
- **Encryption** - All data encrypted in transit and at rest
- **Privacy Compliance** - KVKK compliant architecture

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Modern, responsive styling
- **React** - User interface framework

### Backend
- **Next.js API Routes** - Serverless backend API
- **TypeScript** - Type-safe server code
- **Prisma** - ORM for database management
- **PostgreSQL** - Production database

### AI & Document Processing
- **Google Gemini API** - AI text generation and analysis
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction

### Authentication & Storage
- **NextAuth.js** - Authentication and session management
- **Vercel Blob** - File storage
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd legal-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/legal-assistant"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google Gemini
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# Vercel Blob (for production)
BLOB_READ_WRITE_TOKEN="your-blob-token"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
npx prisma migrate dev
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

### Run tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Structure
- **Contract Tests** - API contract validation
- **Integration Tests** - Database and service integration
- **E2E Tests** - End-to-end user flows
- **Unit Tests** - Individual component testing

## 🚀 Deployment

The application is deployed on Vercel with:
- **Database**: PostgreSQL with Prisma
- **File Storage**: Vercel Blob Storage
- **Authentication**: NextAuth.js
- **AI Integration**: Google Gemini API

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are set in Vercel dashboard:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_GEMINI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

## 💻 Usage

### For Business Owners
1. Register or log in to your account
2. Upload your contract templates (PDF or DOCX)
3. Ask questions in Turkish about legal risks and obligations
4. Receive AI-powered analysis and recommendations

### For Legal Professionals
1. Upload multiple contract versions for comparison
2. Request KVKK compliance checks
3. Generate tailored agreements for your clients
4. Access detailed legal analysis with source citations

## 🔒 Security Features

- **HTTPS Only** - All communications encrypted
- **Content Security Policy** - XSS protection
- **CSRF Protection** - Token-based request validation
- **Input Validation** - Zod schema validation
- **SQL Injection Prevention** - Parameterized queries
- **Row-Level Security** - User data isolation

## 📚 API Documentation

Comprehensive API documentation available at:
- **OpenAPI Spec**: `/src/contracts/openapi.yaml`
- **Interactive Docs**: Available in development mode

### Key Endpoints
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents` - List user documents
- `POST /api/v1/chat/sessions/{sessionId}/messages` - Send message
- `POST /api/v1/documents/{id}/analyze` - Analyze document

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Run `npx prisma db push` to sync schema

### Gemini API Errors
- Verify `GOOGLE_GEMINI_API_KEY` is set correctly
- Check API quota and limits
- Review Vercel logs for detailed error messages

### Document Upload Fails
- Check file size (max 20MB)
- Ensure file format is PDF or DOCX
- Verify Vercel Blob storage is configured

## 🤝 Contributing

This is a learning project built with SDD-MCP methodology. Feel free to:
- Study the code and architecture
- Run the tests and experiments
- Suggest improvements
- Share your learnings

## 📄 License

MIT License - Feel free to use this code for learning and experimentation.

## 🙏 Acknowledgments

Built with ❤️ using [AI-SDD-MCP](https://www.npmjs.com/package/ai-sdd-mcp) methodology.

---

**Note**: This application is for educational and informational purposes only. It is not intended to replace professional legal advice. Always consult with a qualified legal professional for legal matters.

