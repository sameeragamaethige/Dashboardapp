# 🍌 Banana Business Registration System

A comprehensive web application for managing business registrations, document processing, and administrative workflows. Built with Next.js, React, TypeScript, and MySQL.

## 📋 Table of Contents

1. [What is this Application?](#what-is-this-application)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Understanding the Code Structure](#understanding-the-code-structure)
7. [VPS Deployment Guide](#vps-deployment-guide)
8. [Troubleshooting](#troubleshooting)
9. [Common Commands](#common-commands)

## 🎯 What is this Application?

This is a **Business Registration Management System** that helps:

- **Customers** register their businesses online
- **Admins** manage and approve registrations
- **Process documents** through multiple steps
- **Handle payments** and track approval status
- **Store and manage** business documents securely

### Key Features:
- ✅ User registration and authentication
- ✅ Multi-step business registration process
- ✅ Document upload and management
- ✅ Payment processing
- ✅ Admin dashboard for approvals
- ✅ Real-time status tracking
- ✅ File storage and management

## 🔧 Prerequisites

Before you start, you need these tools installed on your computer:

### 1. Node.js (Version 18 or higher)
**What is Node.js?** It's a JavaScript runtime that lets you run JavaScript code outside of a web browser.

**How to install:**
- Go to [nodejs.org](https://nodejs.org/)
- Download the "LTS" version (Long Term Support)
- Run the installer and follow the instructions

**Verify installation:**
```bash
node --version
npm --version
```

### 2. MySQL Database
**What is MySQL?** It's a database system that stores all your application data.

**How to install:**
- **Windows:** Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- **Mac:** Use Homebrew: `brew install mysql`
- **Linux:** `sudo apt-get install mysql-server` (Ubuntu/Debian)

**Start MySQL:**
```bash
# Mac/Linux
sudo service mysql start
# or
brew services start mysql

# Windows
# MySQL starts automatically after installation
```

### 3. Git (Optional but recommended)
**What is Git?** It's a version control system that tracks changes in your code.

**How to install:**
- Download from [git-scm.com](https://git-scm.com/)
- Follow the installation instructions

## 🚀 Local Development Setup

### Step 1: Download the Project

```bash
# If you have Git installed:
git clone <your-repository-url>
cd 1

# If you don't have Git, download the ZIP file and extract it
# Then open terminal/command prompt in the extracted folder
```

### Step 2: Install Dependencies

**What are dependencies?** These are external code libraries that your application needs to work.

```bash
# Install all required packages
npm install
# or if you prefer pnpm:
pnpm install
```

### Step 3: Environment Configuration

**What is environment configuration?** These are settings that tell your application how to connect to databases and other services.

1. **Copy the environment template:**
```bash
cp env.example .env.local
```

2. **Edit the `.env.local` file:**
```bash
# Open .env.local in a text editor and update these values:

# Database Configuration
DB_HOST=localhost          # Your database server address
DB_USER=root              # Your database username
DB_PASSWORD=your_password # Your database password
DB_NAME=banana_db         # Database name
DB_PORT=3306              # Database port (usually 3306)

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here  # Generate a random string
NEXTAUTH_URL=http://localhost:3000    # Your application URL
```

**Generate a secret key:**
```bash
# Run this command to generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Database Setup

### Step 1: Create the Database

1. **Open MySQL command line:**
```bash
mysql -u root -p
```

2. **Create the database:**
```sql
CREATE DATABASE banana_db;
SHOW DATABASES;
EXIT;
```

### Step 2: Initialize Database Tables

**What does this do?** This creates all the tables and columns that your application needs to store data.

```bash
# Run the database initialization script
npm run init-db
```

### Step 3: Run Migrations

**What are migrations?** These are scripts that update your database structure when you add new features.

```bash
# Run all database migrations
npm run migrate-db
npm run migrate-files
npm run migrate-admin-step3
```

## 🏃‍♂️ Running the Application

### Development Mode (for coding)

```bash
# Start the development server
npm run dev
```

**What happens:**
- Your application starts on `http://localhost:3000`
- Any changes you make to code will automatically reload
- You'll see error messages in the terminal

### Production Mode (for testing)

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📁 Understanding the Code Structure

```
1/                          # Root project folder
├── app/                    # Next.js app directory (main application code)
│   ├── api/               # Backend API routes (server-side code)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── registrations/ # Registration management
│   │   └── upload/        # File upload handling
│   ├── layout.tsx         # Main layout component
│   └── page.tsx           # Homepage
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── customer/         # Customer-specific components
│   └── ui/               # General UI components
├── lib/                   # Utility functions and database connections
├── scripts/               # Database setup and migration scripts
├── public/                # Static files (images, documents)
├── package.json           # Project configuration and dependencies
└── .env.local            # Environment variables (create this file)
```

### Key Files Explained:

- **`app/page.tsx`** - The main homepage
- **`app/api/`** - Backend API endpoints
- **`components/`** - Reusable UI components
- **`lib/database.ts`** - Database connection setup
- **`scripts/`** - Database setup and maintenance scripts

## 🌐 VPS Deployment Guide

**What is a VPS?** A Virtual Private Server is a remote computer where you can host your application so others can access it over the internet.

### Step 1: Choose a VPS Provider

Popular options:
- **DigitalOcean** (Recommended for beginners)
- **AWS EC2**
- **Google Cloud Platform**
- **Linode**
- **Vultr**

### Step 2: Create a VPS Instance

**Using DigitalOcean as an example:**

1. **Sign up** at [digitalocean.com](https://digitalocean.com)
2. **Create a Droplet** (VPS instance):
   - Choose **Ubuntu 22.04 LTS**
   - Select **Basic plan** ($6/month minimum)
   - Choose a **datacenter** close to your users
   - Add your **SSH key** (recommended) or use password

### Step 3: Connect to Your VPS

```bash
# Connect via SSH (replace with your VPS IP)
ssh root@your-vps-ip-address

# If you used password authentication, enter your password when prompted
```

### Step 4: Update the Server

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip
```

### Step 5: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 6: Install MySQL

```bash
# Install MySQL
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Step 7: Configure MySQL

```bash
# Access MySQL as root
sudo mysql

# Create database and user
CREATE DATABASE banana_db;
CREATE USER 'banana_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON banana_db.* TO 'banana_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 8: Install PM2 (Process Manager)

**What is PM2?** It keeps your application running even if it crashes and restarts it automatically.

```bash
# Install PM2 globally
sudo npm install -g pm2
```

### Step 9: Deploy Your Application

1. **Upload your code:**
```bash
# On your local computer, create a ZIP of your project
# Upload it to your VPS using SCP or SFTP

# Or clone from Git (if using version control)
git clone <your-repository-url>
cd your-project-folder
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create environment file
cp env.example .env.local

# Edit the file with your production settings
nano .env.local
```

**Production environment variables:**
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=banana_user
DB_PASSWORD=your_secure_password
DB_NAME=banana_db
DB_PORT=3306

# Next.js Configuration
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-domain.com
```

4. **Initialize database:**
```bash
npm run init-db
npm run migrate-db
npm run migrate-files
npm run migrate-admin-step3
```

5. **Build the application:**
```bash
npm run build
```

6. **Start with PM2:**
```bash
# Start the application
pm2 start npm --name "banana-app" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### Step 10: Set Up Domain and SSL (Optional but Recommended)

1. **Point your domain** to your VPS IP address
2. **Install Nginx** (web server):
```bash
sudo apt install nginx -y
```

3. **Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/banana-app
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/banana-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Install SSL certificate:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Port 3000 is already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <process-id>
```

#### 2. "Database connection failed"
- Check if MySQL is running: `sudo systemctl status mysql`
- Verify database credentials in `.env.local`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

#### 3. "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 4. "Permission denied" errors
```bash
# Fix file permissions
chmod +x scripts/*.js
```

#### 5. PM2 issues
```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart banana-app

# View logs
pm2 logs banana-app
```

## 📝 Common Commands

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Check code quality
```

### Database Commands
```bash
npm run init-db      # Initialize database tables
npm run migrate-db   # Run database migrations
npm run migrate-files # Migrate file storage
npm run migrate-admin-step3 # Migrate admin columns
```

### PM2 Commands (Production)
```bash
pm2 start npm --name "banana-app" -- start  # Start application
pm2 stop banana-app                         # Stop application
pm2 restart banana-app                      # Restart application
pm2 logs banana-app                         # View logs
pm2 status                                  # Check status
pm2 delete banana-app                       # Remove from PM2
```

### System Commands
```bash
sudo systemctl status mysql    # Check MySQL status
sudo systemctl restart mysql   # Restart MySQL
sudo systemctl status nginx    # Check Nginx status
sudo systemctl restart nginx   # Restart Nginx
```

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs:**
   - Development: Look at the terminal output
   - Production: `pm2 logs banana-app`

2. **Verify your setup:**
   - Database connection: `npm run test-mysql`
   - File storage: `npm run test-files`

3. **Common resources:**
   - [Next.js Documentation](https://nextjs.org/docs)
   - [MySQL Documentation](https://dev.mysql.com/doc/)
   - [PM2 Documentation](https://pm2.keymetrics.io/docs/)

## 🎉 Congratulations!

You've successfully set up and deployed a full-stack web application! This is a significant achievement for someone new to programming. 

**Next steps:**
- Learn more about the technologies used
- Customize the application for your needs
- Add new features
- Improve security and performance

Remember: Programming is a journey, and every problem you solve makes you better at it! 🚀
