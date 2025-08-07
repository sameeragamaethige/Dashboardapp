const mysql = require('mysql2/promise');

async function createDocumentTemplatesTable() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'banana_db'
        });

        console.log('📝 Creating document_templates table...');

        // Create document_templates table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS document_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                document_type VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                size INT NOT NULL,
                url VARCHAR(500) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_id VARCHAR(100) NOT NULL,
                director_index INT NULL,
                uploaded_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_document_type (document_type),
                INDEX idx_director_index (director_index),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ document_templates table created successfully');

        // Check if table exists and show structure
        const [rows] = await connection.execute('DESCRIBE document_templates');
        console.log('📋 Table structure:');
        console.table(rows);

        // Check if there are any existing records
        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM document_templates');
        console.log(`📊 Current record count: ${countResult[0].count}`);

    } catch (error) {
        console.error('❌ Error creating document_templates table:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
createDocumentTemplatesTable()
    .then(() => {
        console.log('🎉 Document templates migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }); 