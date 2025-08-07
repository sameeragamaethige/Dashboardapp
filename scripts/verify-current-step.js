const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function verifyCurrentStep() {
    let connection;

    try {
        console.log('🔍 Verifying current step of companies...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Get all companies with their current step and status
        const [companies] = await connection.execute(`
      SELECT id, company_name, current_step, status, documents_approved, step4_final_additional_doc
      FROM registrations 
      ORDER BY created_at DESC
      LIMIT 10
    `);

        console.log('\n📋 Company Step Information:');
        console.log('='.repeat(80));

        companies.forEach((company, index) => {
            console.log(`${index + 1}. Company: ${company.company_name || 'Unnamed Company'}`);
            console.log(`   ID: ${company.id}`);
            console.log(`   Current Step: ${company.current_step}`);
            console.log(`   Status: ${company.status}`);
            console.log(`   Documents Approved: ${company.documents_approved}`);

            // Check if it's step 4
            const isStep4 = company.current_step === 'incorporate' || company.status === 'incorporation-processing';
            console.log(`   Is Step 4? ${isStep4 ? '✅ YES' : '❌ NO'}`);

            // Check step 4 additional documents
            if (company.step4_final_additional_doc) {
                const docs = JSON.parse(company.step4_final_additional_doc);
                console.log(`   Step 4 Additional Documents: ${docs.length} documents`);
                docs.forEach((doc, docIndex) => {
                    console.log(`     ${docIndex + 1}. ${doc.title}: ${doc.name}`);
                });
            } else {
                console.log(`   Step 4 Additional Documents: None`);
            }

            console.log('');
        });

        // Show step 4 companies specifically
        const step4Companies = companies.filter(company =>
            company.current_step === 'incorporate' || company.status === 'incorporation-processing'
        );

        console.log('📊 Step 4 Companies Summary:');
        console.log('='.repeat(40));
        if (step4Companies.length > 0) {
            step4Companies.forEach((company, index) => {
                console.log(`${index + 1}. ${company.company_name || 'Unnamed Company'} (${company.id})`);
            });
        } else {
            console.log('❌ No companies found in step 4');
        }

    } catch (error) {
        console.error('❌ Error verifying current step:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the verification
verifyCurrentStep().then(() => {
    console.log('🏁 Current step verification finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
});
