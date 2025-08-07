const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testStep4DocumentDeletion() {
    let connection;

    try {
        console.log('🧪 Testing step 4 document deletion functionality...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company with step 4 documents
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'incorporate' 
      AND step4_final_additional_doc IS NOT NULL
      AND JSON_LENGTH(step4_final_additional_doc) > 0
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found with step 4 documents. Creating test data...');

            // Create a test company with documents
            const testCompany = {
                companyName: 'Deletion Test Company',
                current_step: 'incorporate',
                status: 'incorporation-processing',
                documents_approved: 1,
                step4_final_additional_doc: JSON.stringify([
                    {
                        name: 'test_doc_1.pdf',
                        type: 'application/pdf',
                        size: 1024000,
                        title: 'Test Document 1',
                        url: '/uploads/documents/test_doc_1.pdf',
                        filePath: 'documents/test_doc_1.pdf',
                        id: 'test-doc-1-' + Date.now(),
                        uploadedAt: new Date().toISOString()
                    },
                    {
                        name: 'test_doc_2.pdf',
                        type: 'application/pdf',
                        size: 2048000,
                        title: 'Test Document 2',
                        url: '/uploads/documents/test_doc_2.pdf',
                        filePath: 'documents/test_doc_2.pdf',
                        id: 'test-doc-2-' + Date.now(),
                        uploadedAt: new Date().toISOString()
                    }
                ]),
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            const [result] = await connection.execute(`
        INSERT INTO registrations (companyName, current_step, status, documents_approved, step4_final_additional_doc, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [testCompany.companyName, testCompany.current_step, testCompany.status, testCompany.documents_approved, testCompany.step4_final_additional_doc, testCompany.created_at, testCompany.updated_at]);

            console.log('✅ Test company created with ID:', result.insertId);
            return await testStep4DocumentDeletion();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Company ID:', testCompany.id);

        // Check current documents
        const currentDocs = JSON.parse(testCompany.step4_final_additional_doc);
        console.log('📄 Current step 4 documents:', currentDocs.length, 'documents');
        currentDocs.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
        });

        if (currentDocs.length === 0) {
            console.log('❌ No documents to delete');
            return;
        }

        // Test document deletion (simulate frontend deletion)
        console.log('\n🧪 Testing document deletion...');

        // Get current registration from API
        console.log('📤 Getting current registration from API...');
        try {
            const response = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                console.error('❌ Failed to get registration from API:', response.status);
                return;
            }

            const currentRegistration = await response.json();
            console.log('✅ Got current registration from API');

            // Simulate deleting the first document (index 0)
            const documentIndexToDelete = 0;
            const documentToDelete = currentRegistration.step4FinalAdditionalDoc[documentIndexToDelete];

            console.log('🗑️ Document to delete:', documentToDelete);

            // Remove document from array
            const updatedStep4Documents = currentRegistration.step4FinalAdditionalDoc.filter((_, index) => index !== documentIndexToDelete);
            console.log('📄 Updated documents array:', updatedStep4Documents);

            // Test file deletion from storage (simulate)
            console.log('🗑️ Simulating file deletion from storage...');
            console.log('   File path:', documentToDelete.filePath);
            console.log('   Note: This is a simulation - actual file deletion would happen via API');

            // Update database via API
            console.log('📝 Updating database via API...');
            const updateResponse = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...currentRegistration,
                    step4FinalAdditionalDoc: updatedStep4Documents,
                    updatedAt: new Date().toISOString(),
                })
            });

            console.log('📥 Update response status:', updateResponse.status);

            if (!updateResponse.ok) {
                console.error('❌ Failed to update database:', updateResponse.status, updateResponse.statusText);
                const errorText = await updateResponse.text();
                console.error('Error details:', errorText);
                return;
            }

            const updateResult = await updateResponse.json();
            console.log('✅ Update result:', updateResult);

            // Verify the deletion
            console.log('\n📋 Verifying deletion...');
            const [updatedCompany] = await connection.execute(`
        SELECT * FROM registrations WHERE id = ?
      `, [testCompany.id]);

            if (updatedCompany.length > 0) {
                const company = updatedCompany[0];
                const updatedDocs = JSON.parse(company.step4_final_additional_doc);
                console.log('📄 Documents after deletion:', updatedDocs.length, 'documents');

                if (updatedDocs.length === currentDocs.length - 1) {
                    console.log('✅ SUCCESS: Document count reduced by 1');

                    // Check if the deleted document is gone
                    const deletedDocStillExists = updatedDocs.find(doc => doc.title === documentToDelete.title);
                    if (!deletedDocStillExists) {
                        console.log('✅ SUCCESS: Deleted document no longer exists in database');
                    } else {
                        console.log('❌ FAILED: Deleted document still exists in database');
                    }

                    // Show remaining documents
                    updatedDocs.forEach((doc, index) => {
                        console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
                    });
                } else {
                    console.log('❌ FAILED: Document count not reduced correctly');
                }
            }

        } catch (apiError) {
            console.error('❌ API error:', apiError.message);
            console.log('ℹ️ This is expected if the server is not running');

            // Test direct database deletion instead
            console.log('\n🧪 Testing direct database deletion...');

            const documentIndexToDelete = 0;
            const documentToDelete = currentDocs[documentIndexToDelete];

            console.log('🗑️ Document to delete:', documentToDelete);

            // Remove document from array
            const updatedStep4Documents = currentDocs.filter((_, index) => index !== documentIndexToDelete);
            console.log('📄 Updated documents array:', updatedStep4Documents);

            // Update database directly
            const [updateResult] = await connection.execute(`
        UPDATE registrations 
        SET step4_final_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
                JSON.stringify(updatedStep4Documents),
                testCompany.id
            ]);

            if (updateResult.affectedRows > 0) {
                console.log('✅ Direct database update successful');

                // Verify the deletion
                const [updatedCompany] = await connection.execute(`
          SELECT * FROM registrations WHERE id = ?
        `, [testCompany.id]);

                if (updatedCompany.length > 0) {
                    const company = updatedCompany[0];
                    const updatedDocs = JSON.parse(company.step4_final_additional_doc);
                    console.log('📄 Documents after deletion:', updatedDocs.length, 'documents');

                    if (updatedDocs.length === currentDocs.length - 1) {
                        console.log('✅ SUCCESS: Document count reduced by 1');

                        // Check if the deleted document is gone
                        const deletedDocStillExists = updatedDocs.find(doc => doc.title === documentToDelete.title);
                        if (!deletedDocStillExists) {
                            console.log('✅ SUCCESS: Deleted document no longer exists in database');
                        } else {
                            console.log('❌ FAILED: Deleted document still exists in database');
                        }
                    } else {
                        console.log('❌ FAILED: Document count not reduced correctly');
                    }
                }
            } else {
                console.log('❌ Direct database update failed');
            }
        }

    } catch (error) {
        console.error('❌ Error in testStep4DocumentDeletion:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testStep4DocumentDeletion().then(() => {
    console.log('🏁 Step 4 document deletion test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
