# Banana DB MySQL Setup Guide

## Database Configuration

Your application is now configured to connect to MySQL with the following settings:

- **Host**: localhost
- **Username**: root
- **Password**: (empty - no password)
- **Database**: banana_db
- **Port**: 3306

## Setup Steps

1. **Ensure MySQL is running**:
   - Make sure your MySQL server is running
   - Verify you can connect with the root user without password

2. **Create Environment File** (optional):
   ```bash
   cp env.example .env.local
   ```
   Then edit `.env.local` if you need to change any settings.

3. **Test Connection**:
   ```bash
   node scripts/test-mysql-connection.js
   ```

4. **Initialize Database**:
   ```bash
   node scripts/init-database.js
   ```

5. **Start the Application**:
   ```bash
   npm run dev
   ```

## Default Admin Credentials

After running the initialization script, you can log in with:
- **Email**: admin@example.com
- **Password**: admin123

## Database Tables Created

The initialization script creates the following tables:
- `users` - User accounts and authentication
- `registrations` - Company registration data
- `packages` - Available service packages
- `bank_details` - Bank account information
- `settings` - Application settings and customization

## Troubleshooting

### Connection Issues
- Make sure MySQL is running
- Check that port 3306 is not blocked
- Verify the database 'banana_db' exists

### Database Not Found
If you get a "database not found" error, the initialization script will create it automatically.

### Permission Issues
Make sure the root user has the necessary permissions to create databases and tables.

## Files Modified
- `lib/database.ts` - Updated with banana_db configuration
- `scripts/init-database.js` - Updated to create banana_db
- `scripts/test-mysql-connection.js` - Updated to test banana_db connection
- `env.example` - Created with banana_db configuration 