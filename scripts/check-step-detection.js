const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function checkStepDetection() {
    let connection;

    try {
        console.log('🔍 Checking step detection logic...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Get all companies with their step information
        const [companies] = await connection.execute(`
      SELECT id, company_name, current_step, status, documents_approved, step4_final_additional_doc
      FROM registrations 
      ORDER BY created_at DESC
      LIMIT 5
    `);

        console.log('\n📋 Step Detection Analysis:');
        console.log('='.repeat(80));

        companies.forEach((company, index) => {
            console.log(`\n${index + 1}. Company: ${company.company_name || 'Unnamed Company'}`);
            console.log(`   ID: ${company.id}`);
            console.log(`   Current Step: "${company.current_step}"`);
            console.log(`   Status: "${company.status}"`);
            console.log(`   Documents Approved: ${company.documents_approved}`);

            // Test step detection logic
            const isStep4ByStep = company.current_step === 'incorporate';
            const isStep4ByStatus = company.status === 'incorporation-processing';
            const isStep4 = isStep4ByStep || isStep4ByStatus;

            console.log(`   Step Detection Results:`);
            console.log(`     - current_step === 'incorporate': ${isStep4ByStep} (${company.current_step === 'incorporate'})`);
            console.log(`     - status === 'incorporation-processing': ${isStep4ByStatus} (${company.status === 'incorporation-processing'})`);
            console.log(`     - Is Step 4? ${isStep4 ? '✅ YES' : '❌ NO'}`);

            // Check what would happen in the frontend
            if (isStep4) {
                console.log(`   🎯 This company WOULD use handleStep4AdditionalDocumentUpload`);
            } else {
                console.log(`   🎯 This company WOULD use handleAdditionalDocumentUpload (step 3)`);
            }

            // Check step 4 additional documents
            if (company.step4_final_additional_doc) {
                const docs = JSON.parse(company.step4_final_additional_doc);
                console.log(`   📄 Step 4 Additional Documents: ${docs.length} documents`);
                docs.forEach((doc, docIndex) => {
                    console.log(`     ${docIndex + 1}. ${doc.title}: ${doc.name}`);
                });
            } else {
                console.log(`   📄 Step 4 Additional Documents: None`);
            }
        });

        // Show summary
        console.log('\n📊 Summary:');
        console.log('='.repeat(40));

        const step4Companies = companies.filter(company =>
            company.current_step === 'incorporate' || company.status === 'incorporation-processing'
        );

        console.log(`Total companies: ${companies.length}`);
        console.log(`Step 4 companies: ${step4Companies.length}`);
        console.log(`Step 3 companies: ${companies.length - step4Companies.length}`);

        if (step4Companies.length > 0) {
            console.log('\n✅ Step 4 companies found:');
            step4Companies.forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.company_name || 'Unnamed Company'} (${company.id})`);
            });
        } else {
            console.log('\n❌ No step 4 companies found');
            console.log('💡 This might be why additional documents are not saving to the database');
            console.log('💡 Make sure you are working with a company that has:');
            console.log('   - current_step = "incorporate" OR');
            console.log('   - status = "incorporation-processing"');
        }

        // Test API response format
        console.log('\n📤 Testing API response format...');
        if (step4Companies.length > 0) {
            const testCompany = step4Companies[0];

            try {
                const response = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ API call successful');
                    console.log('📄 API response format:');
                    console.log(`   - _id: ${result._id}`);
                    console.log(`   - currentStep: ${result.currentStep}`);
                    console.log(`   - status: ${result.status}`);
                    console.log(`   - step4FinalAdditionalDoc: ${result.step4FinalAdditionalDoc ? 'Present' : 'Not present'}`);

                    // Test step detection with API data
                    const apiIsStep4 = result.currentStep === 'incorporate' || result.status === 'incorporation-processing';
                    console.log(`   - API Step Detection: ${apiIsStep4 ? 'Step 4' : 'Not Step 4'}`);

                } else {
                    console.log('❌ API call failed:', response.status);
                }
            } catch (apiError) {
                console.log('❌ API call error:', apiError.message);
                console.log('ℹ️ This is expected if the server is not running');
            }
        }

    } catch (error) {
        console.error('❌ Error checking step detection:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the check
checkStepDetection().then(() => {
    console.log('🏁 Step detection check finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Step detection check failed:', error);
    process.exit(1);
});
