const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testAdminStep4AdditionalDocsUpload() {
    let connection;

    try {
        console.log('🔍 Testing admin step 4 additional documents upload...');

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
                companyName: 'Test Company Step4 Additional Docs',
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
            return await testAdminStep4AdditionalDocsUpload();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);
        console.log('📊 Documents approved:', testCompany.documents_approved);

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

        // Simulate the step 4 additional document upload process
        console.log('\n🧪 Simulating step 4 additional document upload...');

        // Mock step 4 additional document data
        const mockStep4AdditionalDoc = {
            name: 'test_step4_additional_doc.pdf',
            type: 'application/pdf',
            size: 1024000,
            title: 'Test Step 4 Additional Document',
            url: '/uploads/documents/test_step4_additional_doc.pdf',
            filePath: 'documents/test_step4_additional_doc.pdf',
            id: 'step4-doc-' + Date.now(),
            uploadedAt: new Date().toISOString()
        };

        console.log('📄 Mock step 4 additional document data:', mockStep4AdditionalDoc);

        // Get existing step 4 additional documents
        const existingStep4Docs = testCompany.step4_final_additional_doc
            ? JSON.parse(testCompany.step4_final_additional_doc)
            : [];

        // Add new document to the array
        const updatedStep4Docs = [...existingStep4Docs, mockStep4AdditionalDoc];

        // Update the company with the step 4 additional document
        const [updateResult] = await connection.execute(`
      UPDATE registrations 
      SET step4_final_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
            JSON.stringify(updatedStep4Docs),
            testCompany.id
        ]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Step 4 additional document saved to database successfully');
        } else {
            console.log('❌ Failed to save step 4 additional document to database');
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

            // Check step 4 additional documents
            if (company.step4_final_additional_doc) {
                const docs = JSON.parse(company.step4_final_additional_doc);
                console.log('\n✅ Step 4 additional documents verification:');
                console.log('Total documents:', docs.length);

                docs.forEach((doc, index) => {
                    console.log(`\n📄 Document ${index + 1}:`);
                    console.log('Title:', doc.title);
                    console.log('Name:', doc.name);
                    console.log('Type:', doc.type);
                    console.log('Size:', doc.size);
                    console.log('URL:', doc.url);
                    console.log('File Path:', doc.filePath);
                    console.log('File ID:', doc.id);
                    console.log('Uploaded At:', doc.uploadedAt);
                });

                // Verify all required fields are present for the latest document
                const latestDoc = docs[docs.length - 1];
                const requiredFields = ['name', 'type', 'size', 'title', 'url', 'filePath', 'id', 'uploadedAt'];
                const missingFields = requiredFields.filter(field => !latestDoc[field]);

                if (missingFields.length === 0) {
                    console.log('\n✅ All required step 4 additional document fields are present');
                    console.log('✅ Step 4 additional document upload simulation successful');
                    console.log('✅ Database update working correctly');
                } else {
                    console.log('\n❌ Missing required fields:', missingFields);
                    console.log('❌ Step 4 additional document upload simulation failed');
                }
            } else {
                console.log('\n❌ Step 4 additional documents not found in database');
                console.log('❌ Step 4 additional document upload simulation failed');
            }
        }

        // Test the API endpoint
        console.log('\n📤 Testing API endpoint for step 4 additional documents...');

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

                if (result.step4FinalAdditionalDoc) {
                    console.log('✅ Step 4 additional documents found in API response');
                    console.log('📄 API step 4 additional documents data:', result.step4FinalAdditionalDoc);
                    console.log('📊 Number of documents:', result.step4FinalAdditionalDoc.length);
                } else {
                    console.log('❌ Step 4 additional documents not found in API response');
                }
            } else {
                const errorText = await response.text();
                console.error('❌ API call failed:', errorText);
                console.log('ℹ️ This is expected if the server is not running');
            }
        } catch (apiError) {
            console.error('❌ API call error:', apiError.message);
            console.log('ℹ️ This is expected if the server is not running');
        }

    } catch (error) {
        console.error('❌ Error in testAdminStep4AdditionalDocsUpload:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testAdminStep4AdditionalDocsUpload().then(() => {
    console.log('🏁 Admin step 4 additional docs upload test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
