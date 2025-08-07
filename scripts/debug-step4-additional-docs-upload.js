const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function debugStep4AdditionalDocsUpload() {
    let connection;

    try {
        console.log('🔍 Debugging step 4 additional documents upload...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company that's ready for step 4
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'incorporate' 
      OR status = 'incorporation-processing'
      OR documents_approved = 1
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found ready for step 4. Creating a test company...');

            // Create a test company ready for step 4
            const testCompany = {
                companyName: 'Debug Test Company Step4',
                current_step: 'incorporate',
                status: 'incorporation-processing',
                documents_approved: 1,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            const [result] = await connection.execute(`
        INSERT INTO registrations (companyName, current_step, status, documents_approved, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [testCompany.companyName, testCompany.current_step, testCompany.status, testCompany.documents_approved, testCompany.created_at, testCompany.updated_at]);

            console.log('✅ Test company created with ID:', result.insertId);
            return await debugStep4AdditionalDocsUpload();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);
        console.log('📊 Documents approved:', testCompany.documents_approved);

        // Test step detection logic
        console.log('\n🧪 Testing step detection logic...');
        const isStep4 = testCompany.current_step === 'incorporate' || testCompany.status === 'incorporation-processing';
        console.log('Is Step 4?', isStep4);
        console.log('Current step === "incorporate":', testCompany.current_step === 'incorporate');
        console.log('Status === "incorporation-processing":', testCompany.status === 'incorporation-processing');

        // Check current step 4 additional documents status
        console.log('\n📄 Current step 4 additional documents status:');
        if (testCompany.step4_final_additional_doc) {
            const docs = JSON.parse(testCompany.step4_final_additional_doc);
            console.log('✅ Step 4 additional documents exist:', docs.length, 'documents');
            docs.forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
            });
        } else {
            console.log('❌ No step 4 additional documents found');
        }

        // Test the API endpoint to see what data is returned
        console.log('\n📤 Testing API endpoint...');

        try {
            const response = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('📥 API Response status:', response.status);
            console.log('📥 API Response statusText:', response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ API call successful');
                console.log('📄 API response data:');
                console.log('  - _id:', result._id);
                console.log('  - currentStep:', result.currentStep);
                console.log('  - status:', result.status);
                console.log('  - step4FinalAdditionalDoc:', result.step4FinalAdditionalDoc);

                // Test the PUT API with step 4 additional document
                console.log('\n🧪 Testing PUT API with step 4 additional document...');

                const mockStep4AdditionalDoc = {
                    name: 'debug_test_step4_doc.pdf',
                    type: 'application/pdf',
                    size: 1024000,
                    title: 'Debug Test Step 4 Document',
                    url: '/uploads/documents/debug_test_step4_doc.pdf',
                    filePath: 'documents/debug_test_step4_doc.pdf',
                    id: 'debug-step4-doc-' + Date.now(),
                    uploadedAt: new Date().toISOString()
                };

                // Get existing step 4 documents
                const existingStep4Docs = result.step4FinalAdditionalDoc || [];
                const updatedStep4Docs = [...existingStep4Docs, mockStep4AdditionalDoc];

                console.log('📄 Mock step 4 additional document:', mockStep4AdditionalDoc);
                console.log('📄 Updated step 4 documents array:', updatedStep4Docs);

                // Test PUT request
                const putResponse = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...result,
                        step4FinalAdditionalDoc: updatedStep4Docs,
                        updatedAt: new Date().toISOString(),
                    })
                });

                console.log('📥 PUT API Response status:', putResponse.status);
                console.log('📥 PUT API Response statusText:', putResponse.statusText);

                if (putResponse.ok) {
                    const putResult = await putResponse.json();
                    console.log('✅ PUT API call successful');
                    console.log('📄 PUT API response:', putResult);

                    // Verify the update in database
                    console.log('\n📋 Verifying database update...');
                    const [updatedCompany] = await connection.execute(`
            SELECT * FROM registrations WHERE id = ?
          `, [testCompany.id]);

                    if (updatedCompany.length > 0) {
                        const company = updatedCompany[0];
                        console.log('✅ Database verification successful');

                        if (company.step4_final_additional_doc) {
                            const docs = JSON.parse(company.step4_final_additional_doc);
                            console.log('✅ Step 4 additional documents in database:', docs.length, 'documents');
                            docs.forEach((doc, index) => {
                                console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
                            });
                        } else {
                            console.log('❌ Step 4 additional documents not found in database after PUT');
                        }
                    }
                } else {
                    const errorText = await putResponse.text();
                    console.error('❌ PUT API call failed:', errorText);
                }
            } else {
                const errorText = await response.text();
                console.error('❌ GET API call failed:', errorText);
            }
        } catch (apiError) {
            console.error('❌ API call error:', apiError.message);
            console.log('ℹ️ This is expected if the server is not running');

            // Test direct database update instead
            console.log('\n🧪 Testing direct database update...');

            const mockStep4AdditionalDoc = {
                name: 'debug_test_step4_doc.pdf',
                type: 'application/pdf',
                size: 1024000,
                title: 'Debug Test Step 4 Document',
                url: '/uploads/documents/debug_test_step4_doc.pdf',
                filePath: 'documents/debug_test_step4_doc.pdf',
                id: 'debug-step4-doc-' + Date.now(),
                uploadedAt: new Date().toISOString()
            };

            // Get existing step 4 documents
            const existingStep4Docs = testCompany.step4_final_additional_doc
                ? JSON.parse(testCompany.step4_final_additional_doc)
                : [];
            const updatedStep4Docs = [...existingStep4Docs, mockStep4AdditionalDoc];

            console.log('📄 Mock step 4 additional document:', mockStep4AdditionalDoc);
            console.log('📄 Updated step 4 documents array:', updatedStep4Docs);

            // Update database directly
            const [updateResult] = await connection.execute(`
        UPDATE registrations 
        SET step4_final_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
                JSON.stringify(updatedStep4Docs),
                testCompany.id
            ]);

            if (updateResult.affectedRows > 0) {
                console.log('✅ Direct database update successful');

                // Verify the update
                const [updatedCompany] = await connection.execute(`
          SELECT * FROM registrations WHERE id = ?
        `, [testCompany.id]);

                if (updatedCompany.length > 0) {
                    const company = updatedCompany[0];
                    if (company.step4_final_additional_doc) {
                        const docs = JSON.parse(company.step4_final_additional_doc);
                        console.log('✅ Step 4 additional documents verified in database:', docs.length, 'documents');
                    }
                }
            } else {
                console.log('❌ Direct database update failed');
            }
        }

    } catch (error) {
        console.error('❌ Error in debugStep4AdditionalDocsUpload:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the debug
debugStep4AdditionalDocsUpload().then(() => {
    console.log('🏁 Step 4 additional docs upload debug finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
});
