const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function testCustomerDocuments() {
    let connection;

    try {
        // Connect to MySQL database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Test 1: Check if new columns exist
        console.log('\n🔍 Test 1: Checking if new customer document columns exist...');
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' 
      AND COLUMN_NAME LIKE 'customer_%'
      ORDER BY COLUMN_NAME
    `, [dbConfig.database]);

        const expectedColumns = [
            'customer_address_proof',
            'customer_aoa',
            'customer_form1',
            'customer_form18',
            'customer_letter_of_engagement'
        ];

        console.log('Found customer document columns:', columns.map(c => c.COLUMN_NAME));

        const foundColumns = columns.map(c => c.COLUMN_NAME);
        const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));

        if (missingColumns.length === 0) {
            console.log('✅ All expected customer document columns exist');
        } else {
            console.log('❌ Missing columns:', missingColumns);
        }

        // Test 2: Check if there are any registrations with customer documents
        console.log('\n🔍 Test 2: Checking for registrations with customer documents...');
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
      LIMIT 5
    `);

        if (registrations.length > 0) {
            console.log(`✅ Found ${registrations.length} registrations with customer documents:`);
            registrations.forEach((reg, index) => {
                console.log(`  ${index + 1}. ${reg.company_name} (${reg.id})`);
                if (reg.customer_form1) console.log('     - Form 1: ✅');
                if (reg.customer_letter_of_engagement) console.log('     - Letter of Engagement: ✅');
                if (reg.customer_aoa) console.log('     - AOA: ✅');
                if (reg.customer_form18) console.log('     - Form 18: ✅');
                if (reg.customer_address_proof) console.log('     - Address Proof: ✅');
            });
        } else {
            console.log('ℹ️ No registrations with customer documents found yet');
        }

        // Test 3: Check total number of registrations
        console.log('\n🔍 Test 3: Checking total number of registrations...');
        const [totalRegistrations] = await connection.execute('SELECT COUNT(*) as total FROM registrations');
        console.log(`Total registrations in database: ${totalRegistrations[0].total}`);

        console.log('\n✅ Customer documents structure test completed successfully');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testCustomerDocuments()
        .then(() => {
            console.log('🎉 Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testCustomerDocuments }; 