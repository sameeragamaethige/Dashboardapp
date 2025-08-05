# DashboardPro Setup Guide for New Servers

This guide will help you set up DashboardPro on a new server with automatic database migration.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **XAMPP** (for MySQL database)
3. **Git** (to clone the repository)

## Quick Setup Steps

### 1. Clone and Install Dependencies

```bash
git clone <your-repository-url>
cd DashboardPro
npm install
```

### 2. Start XAMPP Services

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Ensure both services show green status

### 3. Initialize Database (Automatic Migration)

The application now includes automatic database migration. You have two options:

#### Option A: Automatic Setup (Recommended)
```bash
npm run init-db
```

This will:
- ✅ Create the `dashboard_pro` database
- ✅ Create all required tables with complete schema
- ✅ Add any missing columns automatically
- ✅ Create default admin user and settings
- ✅ Run automatic migration for any missing columns

#### Option B: Manual Migration (if database already exists)
```bash
npm run migrate-db
```

This will:
- ✅ Check existing database structure
- ✅ Add any missing columns automatically
- ✅ Show detailed migration results

### 4. Test Database Connection

```bash
npm run test-mysql
```

You should see:
```
✅ MySQL connection successful!
Database: dashboard_pro
✅ Test query successful: [ { test: 1 } ]
✅ Connection test completed successfully!
```

### 5. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Configuration

The application is pre-configured for XAMPP with these default settings:

- **Host**: localhost
- **User**: root
- **Password**: (empty - no password)
- **Database**: dashboard_pro
- **Port**: 3306

### Custom Configuration

If you need to customize the database settings, create a `.env.local` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dashboard_pro
DB_PORT=3306
```

## Automatic Migration Features

### What's Included

The application now includes automatic migration that will:

1. **Create missing tables** if they don't exist
2. **Add missing columns** to existing tables
3. **Preserve existing data** during migration
4. **Handle errors gracefully** (won't break if columns already exist)

### Migration Triggers

Automatic migration runs when:
- ✅ Application starts (via `lib/database.ts`)
- ✅ Database initialization script runs (`npm run init-db`)
- ✅ Manual migration script runs (`npm run migrate-db`)

### Supported Columns

The migration automatically adds these columns to the `registrations` table:

- `company_name_english` (VARCHAR(255))
- `company_name_sinhala` (VARCHAR(255))
- `is_foreign_owned` (VARCHAR(10))
- `business_address_number` (VARCHAR(255))
- `business_address_street` (VARCHAR(255))
- `business_address_city` (VARCHAR(255))
- `postal_code` (VARCHAR(20))
- `share_price` (VARCHAR(50))
- `number_of_shareholders` (VARCHAR(10))
- `shareholders` (JSON)
- `make_simple_books_secretary` (VARCHAR(10))
- `number_of_directors` (VARCHAR(10))
- `directors` (JSON)
- `import_export_status` (VARCHAR(20))
- `imports_to_add` (TEXT)
- `exports_to_add` (TEXT)
- `other_business_activities` (TEXT)

## Troubleshooting

### Database Connection Issues

1. **Make sure XAMPP is running**
   - Check that MySQL service is started
   - Verify port 3306 is not blocked

2. **Check database exists**
   ```bash
   npm run init-db
   ```

3. **Test connection**
   ```bash
   npm run test-mysql
   ```

### Migration Issues

1. **If migration fails**, run manually:
   ```bash
   npm run migrate-db
   ```

2. **Check for errors** in the console output

3. **Verify table structure**:
   ```bash
   npm run migrate-db
   ```

### Application Issues

1. **Clear cache and restart**:
   ```bash
   npm run dev
   ```

2. **Check logs** for specific error messages

3. **Verify all dependencies** are installed:
   ```bash
   npm install
   ```

## Default Login Credentials

After initialization, you can log in with:

- **Email**: admin@example.com
- **Password**: admin123
- **Role**: Admin

## Production Deployment

For production deployment:

1. **Set up environment variables** for production database
2. **Run database migration** on production server
3. **Build the application**:
   ```bash
   npm run build
   npm start
   ```

## Support

If you encounter any issues:

1. Check the console output for error messages
2. Verify XAMPP services are running
3. Run the migration scripts to ensure database compatibility
4. Check that all required columns exist in the database

The application now includes comprehensive automatic migration, so setup should be seamless on any new server! 🚀 