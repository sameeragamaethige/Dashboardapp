const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function clearOldCustomerDocuments() {
    let connection;

    try {
        // Connect to MySQL database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Clear the old customer_documents column
        console.log('🗑️ Clearing old customer_documents column data...');

        const [result] = await connection.execute(
            'UPDATE registrations SET customer_documents = NULL WHERE customer_documents IS NOT NULL'
        );

        console.log(`✅ Cleared customer_documents data from ${result.affectedRows} registrations`);

        // Verify the separate columns still have data
        console.log('\n🔍 Verifying separate customer document columns still have data...');
        const [registrations] = await connection.execute(`
            SELECT id, company_name, 
                   customer_form1, customer_letter_of_engagement, customer_aoa, 
                   customer_form18, customer_address_proof
            FROM registrations 
            WHERE customer_form1 IS NOT NULL 
               OR customer_letter_of_engagement IS NOT NULL 
               OR customer_aoa IS NOT NULL 
               OR customer_form18 IS NOT NULL 
               OR customer_address_proof IS NOT NULL
        `);

        if (registrations.length > 0) {
            console.log(`✅ Found ${registrations.length} registrations with customer documents in separate columns:`);
            registrations.forEach((reg, index) => {
                console.log(`  ${index + 1}. ${reg.company_name} (${reg.id})`);
                if (reg.customer_form1) console.log('     - Form 1: ✅');
                if (reg.customer_letter_of_engagement) console.log('     - Letter of Engagement: ✅');
                if (reg.customer_aoa) console.log('     - AOA: ✅');
                if (reg.customer_form18) console.log('     - Form 18: ✅');
                if (reg.customer_address_proof) console.log('     - Address Proof: ✅');
            });
        } else {
            console.log('ℹ️ No registrations with customer documents in separate columns found');
        }

        console.log('\n✅ Old customer_documents column cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing old customer documents:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run if this script is executed directly
if (require.main === module) {
    clearOldCustomerDocuments()
        .then(() => {
            console.log('🎉 Clear operation completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Clear operation failed:', error);
            process.exit(1);
        });
}

module.exports = { clearOldCustomerDocuments }; 