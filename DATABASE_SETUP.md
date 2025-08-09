# Database Setup Guide

This guide will help you set up the MySQL database with password authentication for the application.

## Prerequisites

- MySQL Server installed and running
- Node.js and npm installed
- Access to MySQL root user

## Step 1: Set MySQL Root Password

### Option A: Using the Setup Script (Recommended)

1. Run the MySQL user setup script:
```bash
node scripts/setup-mysql-user.js
```

This script will:
- Connect to MySQL as root
- Set the password for root user to `wp@XRT.2003`
- Create the `banana_db` database
- Grant necessary privileges

### Option B: Manual Setup

1. Connect to MySQL as root:
```bash
mysql -u root
```

2. Set the password for root user:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'wp@XRT.2003';
FLUSH PRIVILEGES;
```

3. Create the database:
```sql
CREATE DATABASE IF NOT EXISTS banana_db;
```

4. Exit MySQL:
```sql
EXIT;
```

## Step 2: Environment Configuration

1. Copy the environment example file:
```bash
cp env.example .env.local
```

2. The `.env.local` file should contain:
```env
# Database Configuration for banana_db
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=wp@XRT.2003
DB_NAME=banana_db
DB_PORT=3306

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## Step 3: Initialize Database

1. Run the database initialization script:
```bash
node scripts/init-database.js
```

This will:
- Create all necessary tables
- Insert default admin user
- Insert default settings
- Run any pending migrations

## Step 4: Verify Setup

1. Test the database connection:
```bash
node -e "
const mysql = require('mysql2/promise');
const config = {
  host: 'localhost',
  user: 'root',
  password: 'wp@XRT.2003',
  database: 'banana_db',
  port: 3306
};
mysql.createConnection(config)
  .then(conn => {
    console.log('✅ Database connection successful!');
    conn.end();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });
"
```

## Step 5: Start the Application

1. Install dependencies (if not already done):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

After initialization, you can log in with:
- **Email:** admin@example.com
- **Password:** admin123

## Troubleshooting

### Connection Refused
- Make sure MySQL is running
- Check if the port 3306 is correct
- Verify MySQL service is started

### Access Denied
- Ensure the password is correct: `wp@XRT.2003`
- Check if the user has proper privileges
- Try running the setup script again

### Database Not Found
- Run the initialization script: `node scripts/init-database.js`
- Check if the database name is correct: `banana_db`

### Migration Issues
If you encounter migration issues, run the migration scripts:
```bash
node scripts/migrate-database.js
node scripts/migrate-customer-documents.js
node scripts/migrate-admin-step3-columns.js
```

## Security Notes

- The password `wp@XRT.2003` is now configured in all database scripts
- Make sure your `.env.local` file is not committed to version control
- Consider using a more secure password in production
- Regularly backup your database

## Files Updated

The following files have been updated with the new password configuration:

- `env.example` - Environment configuration template
- `lib/database.ts` - Main database connection configuration
- `scripts/init-database.js` - Database initialization script
- `scripts/migrate-database.js` - Database migration script
- `scripts/migrate-customer-documents.js` - Customer documents migration
- `scripts/migrate-admin-step3-columns.js` - Admin columns migration
- `scripts/migrate-step3-signed-additional-doc.js` - Additional documents migration
- `scripts/auto-setup.js` - Auto setup script
- `scripts/setup-mysql-user.js` - New MySQL user setup script

## Support

If you encounter any issues during setup, please check:
1. MySQL server is running
2. All prerequisites are installed
3. Environment variables are correctly set
4. Database scripts have proper permissions to run
