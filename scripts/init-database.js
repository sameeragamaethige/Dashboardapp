const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function initializeDatabase() {
  let connection;

  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection(dbConfig);

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'banana_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database '${dbName}' created or already exists`);

    // Use the database
    await connection.query(`USE ${dbName}`);

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
    console.log('Users table created');

    // Create registrations table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Registrations table created');

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
    console.log('Packages table created');

    // Create bank_details table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bank_details (
        id VARCHAR(255) PRIMARY KEY,
        bank_name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        branch VARCHAR(255),
        swift_code VARCHAR(50),
        additional_instructions TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Bank details table created');

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
    console.log('Settings table created');

    // Run automatic migration to add any missing columns
    await migrateDatabase(connection);

    // Insert default admin user
    await connection.execute(`
      INSERT IGNORE INTO users (id, name, email, password, role) 
      VALUES ('admin-1', 'Admin', 'admin@example.com', 'admin123', 'admin')
    `);
    console.log('Default admin user created');

    // Insert default settings
    await connection.execute(`
      INSERT IGNORE INTO settings (id, title, description, primary_color, secondary_color) 
      VALUES ('default', 'Dashboard V3', 'Company Registration Dashboard', '#000000', '#ffffff')
    `);
    console.log('Default settings created');

    console.log('Database initialization completed successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Automatic database migration function
async function migrateDatabase(connection) {
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
      { name: 'other_business_activities', type: 'TEXT' }
    ];

    // Get existing columns
    const [columns] = await connection.execute('DESCRIBE registrations');
    const existingColumns = columns.map(col => col.Field);

    // Add missing columns
    for (const column of expectedColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Added missing column: ${column.name}`);
        } catch (error) {
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

// Run the initialization
initializeDatabase(); 