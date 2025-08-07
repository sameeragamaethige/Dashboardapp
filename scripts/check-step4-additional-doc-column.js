const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function checkStep4AdditionalDocColumn() {
    let connection;

    try {
        console.log('🔍 Checking for step4_final_additional_doc column...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Check if the column exists
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'registrations' 
      AND COLUMN_NAME = 'step4_final_additional_doc'
    `, [DB_CONFIG.database]);

        if (columns.length > 0) {
            const column = columns[0];
            console.log('✅ Column step4_final_additional_doc exists:');
            console.log('   - Data Type:', column.DATA_TYPE);
            console.log('   - Nullable:', column.IS_NULLABLE);
            console.log('   - Default:', column.COLUMN_DEFAULT);
        } else {
            console.log('❌ Column step4_final_additional_doc does not exist');
            console.log('📝 Need to create the column...');

            // Create the column
            await connection.execute(`
        ALTER TABLE registrations 
        ADD COLUMN step4_final_additional_doc JSON NULL
      `);

            console.log('✅ Column step4_final_additional_doc created successfully');
        }

        // Show all columns in the registrations table for reference
        const [allColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'registrations'
      ORDER BY ORDINAL_POSITION
    `, [DB_CONFIG.database]);

        console.log('\n📋 All columns in registrations table:');
        allColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

    } catch (error) {
        console.error('❌ Error checking step4_final_additional_doc column:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the check
checkStep4AdditionalDocColumn().then(() => {
    console.log('🏁 Step 4 additional doc column check finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
});
