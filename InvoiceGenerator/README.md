# Invoice Generator

A modern, full-stack invoice management application built with React, TypeScript, and Node.js. Create, manage, and download professional invoices with a beautiful, responsive interface.

## 🌐 Live Demo

**Try it now**: [https://invoice-generator-three-weld.vercel.app/](https://invoice-generator-three-weld.vercel.app/)

The application is deployed on Vercel and ready to use immediately!

## 🚀 Features

### 📄 Invoice Management
- **Create Invoices**: Build professional invoices with client details and line items
- **Edit & Update**: Modify existing invoices with real-time validation
- **Delete Invoices**: Remove invoices with confirmation dialogs
- **Status Management**: Track invoice status (Draft, Sent, Paid, Overdue)
- **Search & Filter**: Find invoices by client name, invoice number, or email
- **Sorting**: Sort invoices by date, client, amount, or status

### 🎨 Professional Design
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Real-time Preview**: See exactly how your invoice will look before saving
- **Print Optimization**: Special print styles for clean invoice printing

### 📊 Dashboard & Analytics
- **Overview Dashboard**: Quick stats on total invoices, revenue, and overdue items
- **Real-time Updates**: Dashboard refreshes automatically when data changes
- **Status Tracking**: Visual indicators for invoice statuses
- **Recent Invoices**: Quick access to your latest invoices

### 💾 Data Management
- **Bulk Operations**: Select and delete multiple invoices at once
- **Export Options**: Export invoices to CSV or JSON format
- **Bulk PDF Download**: Download multiple invoices as a ZIP file
- **Data Persistence**: All data is saved and persists between sessions

### 🎯 Advanced Features
- **Invoice Numbering**: Customizable invoice numbering system with prefixes and counters
- **Tax Calculations**: Automatic tax calculations with configurable rates
- **Due Date Tracking**: Automatic overdue detection and status updates
- **PDF Generation**: High-quality PDF generation with Unicode support
- **Template System**: Pre-defined invoice templates for quick creation

### ⚙️ Settings & Configuration
- **Invoice Numbering Settings**: Configure prefixes, counters, and date formats
- **User Preferences**: Customize default tax rates and payment terms
- **Numbering Statistics**: View current numbering configuration and next number

### 🔧 Technical Features
- **TypeScript**: Full type safety and better development experience
- **RESTful API**: Clean, well-documented API endpoints
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: Non-intrusive success and error messages
- **CORS Support**: Cross-origin resource sharing for API access

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **CSS3** - Modern styling with Grid and Flexbox
- **React Router** - Client-side routing
- **jsPDF** - PDF generation
- **Vite** - Fast build tool and dev server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe server code
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Supertest** - API testing
- **Concurrently** - Run multiple commands

## 📋 Prerequisites

Before running the application, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** (version 8 or higher)
- **Git** (for cloning the repository)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd InvoiceGenerator/invoice-generator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the API
```bash
npm run build:api
```

### 4. Start the Application
```bash
npm run dev
```

This will start both the frontend (React) and backend (API) servers:
- Frontend: http://localhost:5173
- API: http://localhost:3000


2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy frontend
   vercel --prod
   
   # Deploy backend
   cd api && vercel --prod
   ```

3. **Environment Variables**:
   - Frontend: `VITE_API_URL` (your backend URL)
   - Backend: `PORT=3000`, `NODE_ENV=production`


## 📖 Detailed Setup Guide

### Step 1: Environment Setup
1. Ensure Node.js is installed on your system
2. Open a terminal/command prompt
3. Navigate to the project directory

### Step 2: Install Dependencies
```bash
# Install all required packages
npm install
```

### Step 3: Build the Backend
```bash
# Compile TypeScript to JavaScript
npm run build:api
```

### Step 4: Start the Development Servers
```bash
# Start both frontend and backend
npm run dev
```

### Step 5: Access the Application
1. Open your web browser
2. Navigate to http://localhost:5173
3. The application should load with the dashboard

## 🎯 Usage Guide

### Creating Your First Invoice
1. Click "Create Invoice" from the dashboard or navigation
2. Fill in client details (name, email, phone, address)
3. Add line items with descriptions, quantities, and prices
4. Set tax rate and due date
5. Review the preview on the right
6. Click "Save Invoice" to save or "Download PDF" to generate PDF

### Managing Invoices
1. Go to "Invoices" from the navigation
2. Use search to find specific invoices
3. Click on an invoice to view details
4. Use the status dropdown to change invoice status
5. Click "Download PDF" to generate a PDF

### Bulk Operations
1. Go to "Invoices" page
2. Select multiple invoices using checkboxes
3. Use bulk actions menu for:
   - Bulk delete
   - Bulk PDF download
   - Export to CSV/JSON

### Settings Configuration
1. Go to "Settings" from the navigation
2. Configure invoice numbering:
   - Set prefix (e.g., "INV", "YSA")
   - Enable/disable date inclusion
   - Set counter format
3. Save settings to apply changes

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:api          # Start only backend

# Building
npm run build            # Build frontend for production
npm run build:api        # Build backend API

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

## 📁 Project Structure

```
invoice-generator/
├── src/
│   ├── components/          # React components
│   │   ├── Navigation/      # Navigation bar
│   │   ├── InvoiceForm/     # Invoice creation form
│   │   ├── InvoicePreview/  # Invoice preview
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Dashboard/       # Dashboard page
│   │   ├── InvoiceList/     # Invoice list page
│   │   ├── CreateInvoice/   # Create invoice page
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── lib/                # Utility libraries
│   └── api/                # Backend API
│       ├── controllers/    # API controllers
│       ├── services/       # Business logic
│       ├── routes/         # API routes
│       └── middleware/     # Express middleware
├── dist/                   # Built frontend
├── dist-api/              # Built backend
└── tests/                 # Test files
```

## 🌐 API Endpoints

### Invoices
- `GET /api/v1/invoices` - List all invoices
- `POST /api/v1/invoices` - Create new invoice
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `PATCH /api/v1/invoices/:id/status` - Update invoice status

### Statistics
- `GET /api/v1/invoices/stats` - Get invoice statistics

### PDF Generation
- `GET /api/v1/invoices/:id/pdf` - Download invoice PDF
- `POST /api/v1/invoices/bulk-pdf` - Bulk PDF download

### Export
- `GET /api/v1/invoices/export/csv` - Export to CSV
- `GET /api/v1/invoices/export/json` - Export to JSON

### Settings
- `GET /api/v1/invoices/numbering/config` - Get numbering config
- `PUT /api/v1/invoices/numbering/config` - Update numbering config
- `GET /api/v1/invoices/numbering/stats` - Get numbering stats
- `POST /api/v1/invoices/numbering/reset` - Reset numbering

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill processes using ports 3000 or 5173
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Module not found errors**
```bash
# Rebuild the API
npm run build:api
```

**CORS errors**
- Ensure the API server is running on port 3000
- Check that the frontend is making requests to the correct API URL

**PDF generation issues**
- Ensure all dependencies are installed
- Check browser console for JavaScript errors
- Verify that the invoice data is valid

### Getting Help

1. Check the browser console for error messages
2. Check the terminal for server-side errors
3. Ensure all dependencies are installed correctly
4. Verify that both servers are running

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- jsPDF for PDF generation capabilities
- All contributors and testers

---

**Happy Invoicing! 🎉**
