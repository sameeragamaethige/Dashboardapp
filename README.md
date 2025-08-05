# DashboardPro - Company Registration Dashboard

A comprehensive company registration management system with automatic setup and zero configuration required.

## 🚀 Quick Start (Zero Configuration)

### Prerequisites
- **Node.js** (v18 or higher)
- **XAMPP** (for MySQL database)

### One-Command Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd DashboardPro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start **Apache** and **MySQL** services
   - Ensure both services show green status

4. **Run Auto-Setup (One Command)**
   ```bash
   npm run setup
   ```

   This single command will:
   - ✅ Create all necessary directories
   - ✅ Initialize MySQL database
   - ✅ Create all database tables
   - ✅ Add default admin user and settings
   - ✅ Create sample packages
   - ✅ Set up file storage structure
   - ✅ Verify everything is working

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open: http://localhost:3000
   - **Admin Login**: admin@example.com / admin123

## 🎯 Features

### Automatic Setup
- **Zero Configuration**: Everything is set up automatically
- **Self-Contained**: All directories and database structures created automatically
- **Server Ready**: Works on any server with XAMPP
- **File Storage**: Automatic file upload and storage management

### Database Management
- **Automatic Migration**: Database schema updates automatically
- **Data Preservation**: Existing data is preserved during updates
- **Error Handling**: Graceful fallbacks if database is unavailable

### File Upload System
- **Automatic Directory Creation**: Upload folders created automatically
- **File Categorization**: Files organized by type (images, documents, temp)
- **Secure Storage**: Files stored with unique IDs and proper metadata
- **Database Integration**: File metadata stored in database

## 📁 Project Structure

```
DashboardPro/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
├── public/                 # Static files
│   └── uploads/           # File uploads (auto-created)
│       ├── images/        # Image files
│       ├── documents/     # Document files
│       └── temp/          # Temporary files
├── scripts/               # Setup and utility scripts
└── data/                  # Data storage (auto-created)
    ├── backups/           # Database backups
    └── exports/           # Data exports
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | **Complete auto-setup** (recommended for new servers) |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run init-db` | Initialize database only |
| `npm run migrate-db` | Run database migrations |
| `npm run test-mysql` | Test database connection |

## 🗄️ Database Configuration

The application is pre-configured for XAMPP:
- **Host**: localhost
- **User**: root
- **Password**: (empty - no password)
- **Database**: dashboard_pro
- **Port**: 3306

### Custom Configuration
Create a `.env.local` file for custom settings:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dashboard_pro
DB_PORT=3306
```

## 📊 Database Tables

The auto-setup creates these tables:
- **users** - User accounts and authentication
- **registrations** - Company registration data (42 columns)
- **packages** - Available service packages
- **bank_details** - Bank transfer information
- **settings** - Application settings and customization

## 🔐 Default Login Credentials

After auto-setup:
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: Admin

## 🚀 Production Deployment

### 1. Server Setup
```bash
# Clone and setup
git clone <repository-url>
cd DashboardPro
npm install
npm run setup
```

### 2. Environment Configuration
```bash
# Create production environment file
cp .env.local .env.production
# Edit with production database settings
```

### 3. Build and Start
```bash
npm run build
npm start
```

## 🔧 Troubleshooting

### Database Connection Issues
1. **Ensure XAMPP is running**
   - Check MySQL service is started
   - Verify port 3306 is not blocked

2. **Run setup again**
   ```bash
   npm run setup
   ```

3. **Test connection**
   ```bash
   npm run test-mysql
   ```

### File Upload Issues
1. **Check directory permissions**
   ```bash
   # Ensure uploads directory is writable
   chmod -R 755 public/uploads
   ```

2. **Verify directory structure**
   ```bash
   # Check if directories exist
   ls -la public/uploads/
   ```

### Application Issues
1. **Clear cache and restart**
   ```bash
   npm run dev
   ```

2. **Check logs** for specific error messages

3. **Verify all dependencies**
   ```bash
   npm install
   ```

## 📝 File Upload System

### How It Works
1. **File Selection**: Users select files in the UI
2. **Temporary Storage**: Files stored temporarily with preview
3. **Form Submission**: Files uploaded to server during form submission
4. **File Storage**: Files saved to appropriate directories (images/documents)
5. **Database Update**: File metadata saved to database
6. **URL Generation**: Files accessible via generated URLs

### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT, XLS, XLSX
- **Max Size**: 10MB per file

### File Organization
- **Images**: `public/uploads/images/`
- **Documents**: `public/uploads/documents/`
- **Temp**: `public/uploads/temp/`

## 🤝 Support

If you encounter any issues:

1. **Check the console output** for error messages
2. **Verify XAMPP services** are running
3. **Run the setup script** to ensure everything is configured
4. **Check file permissions** for upload directories

## 📄 License

This project is licensed under the MIT License.

---

**DashboardPro** - Making company registration management simple and automated! 🚀 