const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function checkCustomerDocumentsColumns() {
    let connection;

    try {
        // Connect to MySQL database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Check both old and new customer document columns
        console.log('\n🔍 Checking customer document columns...');
        const [registrations] = await connection.execute(`
            SELECT id, company_name, 
                   customer_documents,
                   customer_form1, customer_letter_of_engagement, customer_aoa, 
                   customer_form18, customer_address_proof
            FROM registrations 
            WHERE id = 'reg_1754308978698_7cztjd9fo_y0h9a'
        `);

        if (registrations.length > 0) {
            const reg = registrations[0];
            console.log(`\n📋 Registration: ${reg.company_name} (${reg.id})`);

            console.log('\n📁 Old customer_documents column:');
            if (reg.customer_documents) {
                console.log('  ✅ Has data:', JSON.stringify(JSON.parse(reg.customer_documents), null, 2));
            } else {
                console.log('  ❌ No data');
            }

            console.log('\n📁 New separate columns:');
            if (reg.customer_form1) {
                console.log('  ✅ customer_form1:', JSON.stringify(JSON.parse(reg.customer_form1), null, 2));
            } else {
                console.log('  ❌ customer_form1: No data');
            }

            if (reg.customer_letter_of_engagement) {
                console.log('  ✅ customer_letter_of_engagement:', JSON.stringify(JSON.parse(reg.customer_letter_of_engagement), null, 2));
            } else {
                console.log('  ❌ customer_letter_of_engagement: No data');
            }

            if (reg.customer_aoa) {
                console.log('  ✅ customer_aoa:', JSON.stringify(JSON.parse(reg.customer_aoa), null, 2));
            } else {
                console.log('  ❌ customer_aoa: No data');
            }

            if (reg.customer_form18) {
                console.log('  ✅ customer_form18:', JSON.stringify(JSON.parse(reg.customer_form18), null, 2));
            } else {
                console.log('  ❌ customer_form18: No data');
            }

            if (reg.customer_address_proof) {
                console.log('  ✅ customer_address_proof:', JSON.stringify(JSON.parse(reg.customer_address_proof), null, 2));
            } else {
                console.log('  ❌ customer_address_proof: No data');
            }
        } else {
            console.log('❌ Registration not found');
        }

    } catch (error) {
        console.error('❌ Error checking customer documents:', error);
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
    checkCustomerDocumentsColumns()
        .then(() => {
            console.log('\n🎉 Check completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkCustomerDocumentsColumns }; 