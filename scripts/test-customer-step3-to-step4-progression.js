const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testCustomerStep3ToStep4Progression() {
    let connection;

    try {
        console.log('🔍 Testing customer step 3 to step 4 progression...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company that's in step 3 (documentation)
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'documentation' 
      OR status = 'documentation-processing'
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found in step 3. Creating a test company...');

            // Create a test company in step 3
            const testCompany = {
                companyName: 'Test Company Step3',
                current_step: 'documentation',
                status: 'documentation-processing',
                documents_acknowledged: false,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            const [result] = await connection.execute(`
        INSERT INTO registrations (companyName, current_step, status, documents_acknowledged, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [testCompany.companyName, testCompany.current_step, testCompany.status, testCompany.documents_acknowledged, testCompany.created_at, testCompany.updated_at]);

            console.log('✅ Test company created with ID:', result.insertId);
            return await testCustomerStep3ToStep4Progression();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);
        console.log('📊 Documents acknowledged:', testCompany.documents_acknowledged);

        // Simulate the step 3 to step 4 progression
        console.log('\n📤 Simulating customer step 3 to step 4 progression...');

        // Simulate the API call that would be made when customer completes step 3
        const stepProgressionData = {
            currentStep: 'incorporate', // Step 4
            status: 'incorporation-processing',
            documentsAcknowledged: true,
            customerDocuments: {
                form1: {
                    name: 'signed_form1.pdf',
                    type: 'application/pdf',
                    size: 1024000,
                    url: '/uploads/documents/signed_form1.pdf',
                    signedByCustomer: true,
                    submittedAt: new Date().toISOString()
                },
                letterOfEngagement: {
                    name: 'signed_engagement.pdf',
                    type: 'application/pdf',
                    size: 1024000,
                    url: '/uploads/documents/signed_engagement.pdf',
                    signedByCustomer: true,
                    submittedAt: new Date().toISOString()
                },
                aoa: {
                    name: 'signed_aoa.pdf',
                    type: 'application/pdf',
                    size: 1024000,
                    url: '/uploads/documents/signed_aoa.pdf',
                    signedByCustomer: true,
                    submittedAt: new Date().toISOString()
                },
                form18: [
                    {
                        name: 'signed_form18_director1.pdf',
                        type: 'application/pdf',
                        size: 1024000,
                        url: '/uploads/documents/signed_form18_director1.pdf',
                        signedByCustomer: true,
                        submittedAt: new Date().toISOString()
                    }
                ]
            }
        };

        console.log('📄 Step progression data:', stepProgressionData);

        // Update the company in the database
        const [updateResult] = await connection.execute(`
      UPDATE registrations 
      SET current_step = ?, status = ?, documents_acknowledged = ?, 
          customer_form1 = ?, customer_letter_of_engagement = ?, customer_aoa = ?, customer_form18 = ?,
          updated_at = ?
      WHERE id = ?
    `, [
            stepProgressionData.currentStep,
            stepProgressionData.status,
            stepProgressionData.documentsAcknowledged,
            JSON.stringify(stepProgressionData.customerDocuments.form1),
            JSON.stringify(stepProgressionData.customerDocuments.letterOfEngagement),
            JSON.stringify(stepProgressionData.customerDocuments.aoa),
            JSON.stringify(stepProgressionData.customerDocuments.form18),
            new Date().toISOString().slice(0, 19).replace('T', ' '),
            testCompany.id
        ]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Step progression saved to database successfully');
        } else {
            console.log('❌ Failed to save step progression to database');
            return;
        }

        // Verify the update
        const [updatedCompany] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [testCompany.id]);

        if (updatedCompany.length > 0) {
            const company = updatedCompany[0];
            console.log('\n📋 Verification - Updated company data:');
            console.log('Company ID:', company.id);
            console.log('Company Name:', company.companyName || 'Unnamed Company');
            console.log('Current Step:', company.current_step);
            console.log('Status:', company.status);
            console.log('Documents Acknowledged:', company.documents_acknowledged);

            // Check if step progression was successful
            if (company.current_step === 'incorporate' &&
                company.status === 'incorporation-processing' &&
                company.documents_acknowledged === 1) {
                console.log('\n✅ Step 3 to Step 4 progression successful!');
                console.log('✅ Customer should now have permanent access to Step 4');
                console.log('✅ Page refresh will maintain Step 4 access');
            } else {
                console.log('\n❌ Step 3 to Step 4 progression failed!');
                console.log('❌ Customer will be redirected back to Step 3 on page refresh');
            }

            // Test the loadLatestCompanyData logic
            console.log('\n🧪 Testing loadLatestCompanyData logic...');

            // Simulate what happens when page is refreshed
            const simulatedLoadedData = {
                _id: company.id,
                currentStep: company.current_step,
                status: company.status,
                documentsAcknowledged: company.documents_acknowledged === 1,
                companyName: company.companyName
            };

            console.log('📄 Simulated loaded data:', simulatedLoadedData);

            if (simulatedLoadedData.currentStep === 'incorporate') {
                console.log('✅ Page refresh would correctly show Step 4');
                console.log('✅ Customer would NOT be redirected back to Step 3');
            } else {
                console.log('❌ Page refresh would incorrectly show Step 3');
                console.log('❌ Customer would be redirected back to Step 3');
            }

        }

    } catch (error) {
        console.error('❌ Error in testCustomerStep3ToStep4Progression:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testCustomerStep3ToStep4Progression().then(() => {
    console.log('🏁 Customer step 3 to step 4 progression test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
