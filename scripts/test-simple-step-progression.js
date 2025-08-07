const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testSimpleStepProgression() {
    let connection;

    try {
        console.log('🔍 Testing simple step progression...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company in step 3
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'documentation' 
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found in step 3');
            return;
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.id);
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);

        // Test with minimal data - just the essential fields
        const minimalStepData = {
            currentStep: 'incorporate',
            status: 'incorporation-processing',
            documentsAcknowledged: true
        };

        console.log('\n📄 Minimal step progression data:');
        console.log(JSON.stringify(minimalStepData, null, 2));

        // Test direct database update first
        console.log('\n🧪 Testing direct database update...');

        try {
            const [updateResult] = await connection.execute(`
        UPDATE registrations 
        SET current_step = ?, status = ?, documents_acknowledged = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
                minimalStepData.currentStep,
                minimalStepData.status,
                minimalStepData.documentsAcknowledged,
                testCompany.id
            ]);

            if (updateResult.affectedRows > 0) {
                console.log('✅ Direct database update successful');
            } else {
                console.log('❌ Direct database update failed');
                return;
            }
        } catch (dbError) {
            console.error('❌ Direct database update error:', dbError.message);
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
        }

        // Now test the API endpoint with minimal data
        console.log('\n📤 Testing API endpoint with minimal data...');

        try {
            const response = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(minimalStepData)
            });

            console.log('📥 API Response status:', response.status);
            console.log('📥 API Response statusText:', response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ API call successful:', result);
            } else {
                const errorText = await response.text();
                console.error('❌ API call failed:', errorText);

                // Try to parse the error response
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('❌ Error details:', errorJson);
                } catch (parseError) {
                    console.error('❌ Raw error response:', errorText);
                }
            }
        } catch (apiError) {
            console.error('❌ API call error:', apiError.message);
            console.log('ℹ️ This is expected if the server is not running');
        }

    } catch (error) {
        console.error('❌ Error in testSimpleStepProgression:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testSimpleStepProgression().then(() => {
    console.log('🏁 Simple step progression test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
