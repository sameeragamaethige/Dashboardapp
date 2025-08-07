const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testCustomerStep4AdditionalDocsDisplay() {
    let connection;

    try {
        console.log('🧪 Testing customer step 4 additional documents display...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company with step 4 additional documents
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'incorporate' 
      AND step4_final_additional_doc IS NOT NULL
      AND JSON_LENGTH(step4_final_additional_doc) > 0
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found with step 4 additional documents. Creating test data...');

            // Create a test company with step 4 additional documents
            const testCompany = {
                companyName: 'Customer Step 4 Test Company',
                current_step: 'incorporate',
                status: 'incorporation-processing',
                documents_approved: 1,
                step4_final_additional_doc: JSON.stringify([
                    {
                        name: 'step4_doc_1.pdf',
                        type: 'application/pdf',
                        size: 1024000,
                        title: 'Step 4 Document 1',
                        url: '/uploads/documents/step4_doc_1.pdf',
                        filePath: 'documents/step4_doc_1.pdf',
                        id: 'step4-doc-1-' + Date.now(),
                        uploadedAt: new Date().toISOString()
                    },
                    {
                        name: 'step4_doc_2.pdf',
                        type: 'application/pdf',
                        size: 2048000,
                        title: 'Step 4 Document 2',
                        url: '/uploads/documents/step4_doc_2.pdf',
                        filePath: 'documents/step4_doc_2.pdf',
                        id: 'step4-doc-2-' + Date.now(),
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
            return await testCustomerStep4AdditionalDocsDisplay();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Company ID:', testCompany.id);

        // Check current step 4 additional documents
        const step4Docs = JSON.parse(testCompany.step4_final_additional_doc);
        console.log('📄 Current step 4 additional documents:', step4Docs.length, 'documents');
        step4Docs.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
        });

        // Test API data retrieval (simulate customer frontend)
        console.log('\n🧪 Testing API data retrieval for customer...');

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

            const registrationData = await response.json();
            console.log('✅ Got registration data from API');

            // Check if step4FinalAdditionalDoc is present
            if (registrationData.step4FinalAdditionalDoc) {
                console.log('✅ step4FinalAdditionalDoc field is present in API response');
                console.log('📄 Number of step 4 additional documents:', registrationData.step4FinalAdditionalDoc.length);

                registrationData.step4FinalAdditionalDoc.forEach((doc, index) => {
                    console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
                    console.log(`      - URL: ${doc.url}`);
                    console.log(`      - File Path: ${doc.filePath}`);
                    console.log(`      - Size: ${doc.size} bytes`);
                    console.log(`      - Type: ${doc.type}`);
                });

                // Test file accessibility
                console.log('\n🧪 Testing file accessibility...');
                for (const doc of registrationData.step4FinalAdditionalDoc) {
                    if (doc.url) {
                        try {
                            const fileResponse = await fetch(`http://localhost:3000${doc.url}`);
                            if (fileResponse.ok) {
                                console.log(`✅ File accessible: ${doc.name}`);
                            } else {
                                console.log(`⚠️ File not accessible: ${doc.name} (Status: ${fileResponse.status})`);
                            }
                        } catch (fileError) {
                            console.log(`⚠️ File access error: ${doc.name} - ${fileError.message}`);
                        }
                    }
                }

            } else {
                console.log('❌ step4FinalAdditionalDoc field is missing from API response');
            }

            // Test customer component data structure
            console.log('\n🧪 Testing customer component data structure...');

            // Simulate what the customer component would receive
            const customerComponentData = {
                _id: registrationData._id,
                companyName: registrationData.companyName,
                currentStep: registrationData.currentStep,
                status: registrationData.status,
                incorporationCertificate: registrationData.incorporationCertificate,
                step4FinalAdditionalDoc: registrationData.step4FinalAdditionalDoc
            };

            console.log('📋 Customer component data structure:');
            console.log('   - Company ID:', customerComponentData._id);
            console.log('   - Company Name:', customerComponentData.companyName);
            console.log('   - Current Step:', customerComponentData.currentStep);
            console.log('   - Status:', customerComponentData.status);
            console.log('   - Incorporation Certificate:', customerComponentData.incorporationCertificate ? 'Present' : 'Not present');
            console.log('   - Step 4 Additional Documents:', customerComponentData.step4FinalAdditionalDoc ? customerComponentData.step4FinalAdditionalDoc.length : 0);

            // Test conditional rendering logic
            console.log('\n🧪 Testing conditional rendering logic...');

            const hasStep4AdditionalDocs = customerComponentData.step4FinalAdditionalDoc && customerComponentData.step4FinalAdditionalDoc.length > 0;
            console.log('   - Has step 4 additional documents?', hasStep4AdditionalDocs);

            if (hasStep4AdditionalDocs) {
                console.log('✅ Customer component should display step 4 additional documents section');
                console.log('📄 Documents that should be displayed:');
                customerComponentData.step4FinalAdditionalDoc.forEach((doc, index) => {
                    console.log(`   ${index + 1}. ${doc.title} (${doc.name})`);
                });
            } else {
                console.log('ℹ️ Customer component should display "No additional documents" message');
            }

        } catch (apiError) {
            console.error('❌ API error:', apiError.message);
            console.log('ℹ️ This is expected if the server is not running');

            // Test direct database data structure instead
            console.log('\n🧪 Testing direct database data structure...');

            const customerComponentData = {
                _id: testCompany.id,
                companyName: testCompany.companyName,
                currentStep: testCompany.current_step,
                status: testCompany.status,
                incorporationCertificate: testCompany.incorporation_certificate ? JSON.parse(testCompany.incorporation_certificate) : null,
                step4FinalAdditionalDoc: step4Docs
            };

            console.log('📋 Customer component data structure (direct from DB):');
            console.log('   - Company ID:', customerComponentData._id);
            console.log('   - Company Name:', customerComponentData.companyName);
            console.log('   - Current Step:', customerComponentData.currentStep);
            console.log('   - Status:', customerComponentData.status);
            console.log('   - Incorporation Certificate:', customerComponentData.incorporationCertificate ? 'Present' : 'Not present');
            console.log('   - Step 4 Additional Documents:', customerComponentData.step4FinalAdditionalDoc.length);

            const hasStep4AdditionalDocs = customerComponentData.step4FinalAdditionalDoc && customerComponentData.step4FinalAdditionalDoc.length > 0;
            console.log('   - Has step 4 additional documents?', hasStep4AdditionalDocs);

            if (hasStep4AdditionalDocs) {
                console.log('✅ Customer component should display step 4 additional documents section');
                console.log('📄 Documents that should be displayed:');
                customerComponentData.step4FinalAdditionalDoc.forEach((doc, index) => {
                    console.log(`   ${index + 1}. ${doc.title} (${doc.name})`);
                });
            } else {
                console.log('ℹ️ Customer component should display "No additional documents" message');
            }
        }

    } catch (error) {
        console.error('❌ Error in testCustomerStep4AdditionalDocsDisplay:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testCustomerStep4AdditionalDocsDisplay().then(() => {
    console.log('🏁 Customer step 4 additional documents display test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
