// Server-side only database configuration
let pool: any = null;

// Only initialize database connection on server side
if (typeof window === 'undefined') {
  const mysql = require('mysql2/promise');

  // Database configuration for banana_db
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wp@XRT.2003',
    database: process.env.DB_NAME || 'banana_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Create connection pool
  pool = mysql.createPool(dbConfig);
}

// Test database connection
export async function testConnection() {
  if (!pool) {
    console.log('Database pool not initialized (client-side)');
    return false;
  }

  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  if (!pool) {
    console.log('Database pool not initialized (client-side)');
    return;
  }

  try {
    // Initialize file storage directories
    await initializeFileStorage();

    const connection = await pool.getConnection();

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'customer') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create registrations table with all columns
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        contact_person_name VARCHAR(255) NOT NULL,
        contact_person_email VARCHAR(255) NOT NULL,
        contact_person_phone VARCHAR(255) NOT NULL,
        selected_package VARCHAR(255) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'bankTransfer',
        current_step VARCHAR(50) DEFAULT 'contact-details',
        status VARCHAR(50) DEFAULT 'payment-processing',
        payment_approved BOOLEAN DEFAULT FALSE,
        details_approved BOOLEAN DEFAULT FALSE,
        documents_approved BOOLEAN DEFAULT FALSE,
        documents_published BOOLEAN DEFAULT FALSE,
        documents_acknowledged BOOLEAN DEFAULT FALSE,
        payment_receipt JSON,
        balance_payment_receipt JSON,
        form1 JSON,
        letter_of_engagement JSON,
        aoa JSON,
        form18 JSON,
        address_proof JSON,
        customer_documents JSON,
        -- Customer Signed Documents (separate columns)
        customer_form1 JSON,
        customer_letter_of_engagement JSON,
        customer_aoa JSON,
        customer_form18 JSON,
        customer_address_proof JSON,
        incorporation_certificate JSON,
        step3_additional_doc JSON,
        step3_signed_additional_doc JSON,
        -- Company Details Fields
        company_name_english VARCHAR(255),
        company_name_sinhala VARCHAR(255),
        is_foreign_owned VARCHAR(10),
        business_address_number VARCHAR(255),
        business_address_street VARCHAR(255),
        business_address_city VARCHAR(255),
        postal_code VARCHAR(20),
        share_price VARCHAR(50),
        number_of_shareholders VARCHAR(10),
        shareholders JSON,
        make_simple_books_secretary VARCHAR(10),
        number_of_directors VARCHAR(10),
        directors JSON,
        import_export_status VARCHAR(20),
        imports_to_add TEXT,
        exports_to_add TEXT,
        other_business_activities TEXT,
        drama_sedaka_division VARCHAR(255),
        business_email VARCHAR(255),
        business_contact_number VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create packages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS packages (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        advance_amount DECIMAL(10,2) DEFAULT 0,
        balance_amount DECIMAL(10,2) DEFAULT 0,
        features JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create bank_details table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bank_details (
        id VARCHAR(255) PRIMARY KEY,
        bank_name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        branch VARCHAR(255),
        swift_code VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(500),
        favicon_url VARCHAR(500),
        primary_color VARCHAR(7) DEFAULT '#000000',
        secondary_color VARCHAR(7) DEFAULT '#ffffff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Run automatic migration to add any missing columns
    await migrateDatabase(connection);

    connection.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Automatic database migration function
async function migrateDatabase(connection: any) {
  try {
    console.log('Running automatic database migration...');

    // Define all expected columns for registrations table
    const expectedColumns = [
      { name: 'company_name_english', type: 'VARCHAR(255)' },
      { name: 'company_name_sinhala', type: 'VARCHAR(255)' },
      { name: 'is_foreign_owned', type: 'VARCHAR(10)' },
      { name: 'business_address_number', type: 'VARCHAR(255)' },
      { name: 'business_address_street', type: 'VARCHAR(255)' },
      { name: 'business_address_city', type: 'VARCHAR(255)' },
      { name: 'postal_code', type: 'VARCHAR(20)' },
      { name: 'share_price', type: 'VARCHAR(50)' },
      { name: 'number_of_shareholders', type: 'VARCHAR(10)' },
      { name: 'shareholders', type: 'JSON' },
      { name: 'make_simple_books_secretary', type: 'VARCHAR(10)' },
      { name: 'number_of_directors', type: 'VARCHAR(10)' },
      { name: 'directors', type: 'JSON' },
      { name: 'import_export_status', type: 'VARCHAR(20)' },
      { name: 'imports_to_add', type: 'TEXT' },
      { name: 'exports_to_add', type: 'TEXT' },
      { name: 'other_business_activities', type: 'TEXT' },
      { name: 'drama_sedaka_division', type: 'VARCHAR(255)' },
      { name: 'business_email', type: 'VARCHAR(255)' },
      { name: 'business_contact_number', type: 'VARCHAR(255)' },
      { name: 'step3_signed_additional_doc', type: 'JSON' }
    ];

    // Get existing columns
    const [columns] = await connection.execute('DESCRIBE registrations');
    const existingColumns = columns.map((col: any) => col.Field);

    // Add missing columns
    for (const column of expectedColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added missing column: ${column.name}`);
        } catch (error: any) {
          if (error.code !== 'ER_DUP_FIELDNAME') {
            console.error(`❌ Error adding column ${column.name}:`, error.message);
          }
        }
      }
    }

    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  }
}

// Initialize file storage directories
async function initializeFileStorage() {
  if (typeof window !== 'undefined') {
    return; // Skip on client side
  }

  try {
    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const subdirectories = ['images', 'documents', 'temp'];

    // Create main uploads directory
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Create subdirectories
    for (const subdir of subdirectories) {
      const subdirPath = path.join(uploadsDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
        console.log(`✅ Created ${subdir} directory`);
      }
    }

    // Create .gitkeep files
    for (const subdir of subdirectories) {
      const gitkeepPath = path.join(uploadsDir, subdir, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '# This file ensures the directory is tracked in git\n');
      }
    }

  } catch (error) {
    console.error('Error initializing file storage:', error);
  }
}

export default pool; 