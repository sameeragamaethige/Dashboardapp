const mysql = require('mysql2/promise');

async function migrateAdminStep3Columns() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || 'banana_db',
        port: parseInt(process.env.DB_PORT || '3306'),
    };

    let connection;
    let pool;

    try {
        console.log('🚀 Starting admin step3 columns migration...');
        pool = mysql.createPool(dbConfig);
        connection = await pool.getConnection();

        // Check if registrations table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'registrations'");
        if (tables.length === 0) {
            console.log('❌ Registrations table does not exist. Please run the initialization script first.');
            return;
        }

        // Get existing columns
        const [columns] = await connection.execute('DESCRIBE registrations');
        const existingColumns = columns.map(col => col.Field);

        console.log(`📊 Found ${existingColumns.length} existing columns in registrations table`);

        // Define missing columns for admin step3 functionality
        const missingColumns = [
            { name: 'documents_published_at', type: 'TIMESTAMP NULL' },
            { name: 'step3_signed_additional_doc', type: 'JSON' }
        ];

        // Add missing columns
        let addedCount = 0;
        for (const column of missingColumns) {
            if (!existingColumns.includes(column.name)) {
                try {
                    await connection.execute(`ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`);
                    console.log(`✅ Added missing column: ${column.name}`);
                    addedCount++;
                } catch (error) {
                    if (error.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`❌ Error adding column ${column.name}:`, error.message);
                    } else {
                        console.log(`⚠️  Column already exists: ${column.name}`);
                    }
                }
            } else {
                console.log(`⚠️  Column already exists: ${column.name}`);
            }
        }

        // Verify step3_additional_doc column exists
        if (!existingColumns.includes('step3_additional_doc')) {
            try {
                await connection.execute(`ALTER TABLE registrations ADD COLUMN step3_additional_doc JSON`);
                console.log(`✅ Added missing column: step3_additional_doc`);
                addedCount++;
            } catch (error) {
                if (error.code !== 'ER_DUP_FIELDNAME') {
                    console.error(`❌ Error adding column step3_additional_doc:`, error.message);
                } else {
                    console.log(`⚠️  Column already exists: step3_additional_doc`);
                }
            }
        } else {
            console.log(`⚠️  Column already exists: step3_additional_doc`);
        }

        if (addedCount > 0) {
            console.log(`\n✅ Migration completed successfully! Added ${addedCount} new columns.`);
        } else {
            console.log('\n✅ All required columns already exist. No migration needed.');
        }

        // Show final table structure for step3 related columns
        console.log('\n📋 Step3 related columns in registrations table:');
        const [finalColumns] = await connection.execute('DESCRIBE registrations');
        const step3Columns = finalColumns.filter(col =>
            col.Field.includes('step3') ||
            col.Field.includes('documents_published') ||
            col.Field.includes('form1') ||
            col.Field.includes('letter_of_engagement') ||
            col.Field.includes('aoa') ||
            col.Field.includes('form18')
        );

        step3Columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        console.log('\n🎉 Admin step3 columns migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        if (pool) {
            await pool.end();
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateAdminStep3Columns().catch(console.error);
}

module.exports = { migrateAdminStep3Columns }; 