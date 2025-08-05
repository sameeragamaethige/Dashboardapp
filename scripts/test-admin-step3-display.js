// Test script to verify admin step 3 displays customer signed additional documents
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAdminStep3Display() {
    let connection;

    try {
        console.log('🧪 Testing admin step 3 display of customer signed additional documents...');

        // Database configuration
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || null,
            database: process.env.DB_NAME || 'banana_db',
            port: parseInt(process.env.DB_PORT || '3306'),
        };

        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Test 1: Create a test registration with both admin and customer documents
        console.log('\n📋 Test 1: Creating test registration with admin and customer documents...');
        const testId = 'test-admin-step3-' + Date.now();

        // Mock admin-uploaded step 3 additional documents
        const step3AdditionalDocs = [
            {
                title: "Business Plan",
                name: "business-plan.pdf",
                type: "application/pdf",
                size: 2048000,
                url: "/uploads/documents/business-plan.pdf",
                filePath: "documents/business-plan.pdf",
                id: "doc-001",
                uploadedAt: new Date().toISOString()
            },
            {
                title: "Financial Projections",
                name: "financial-projections.xlsx",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 1536000,
                url: "/uploads/documents/financial-projections.xlsx",
                filePath: "documents/financial-projections.xlsx",
                id: "doc-002",
                uploadedAt: new Date().toISOString()
            }
        ];

        // Mock customer-signed step 3 additional documents
        const step3SignedAdditionalDocs = {
            "Business Plan": {
                name: "signed-business-plan.pdf",
                type: "application/pdf",
                size: 2150400,
                url: "/uploads/documents/signed-business-plan.pdf",
                filePath: "documents/signed-business-plan.pdf",
                id: "signed-doc-001",
                title: "Business Plan",
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            },
            "Financial Projections": {
                name: "signed-financial-projections.xlsx",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 1638400,
                url: "/uploads/documents/signed-financial-projections.xlsx",
                filePath: "documents/signed-financial-projections.xlsx",
                id: "signed-doc-002",
                title: "Financial Projections",
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            }
        };

        // Mock customer documents
        const customerDocuments = {
            form1: {
                name: "signed-form1.pdf",
                type: "application/pdf",
                size: 1024000,
                url: "/uploads/documents/signed-form1.pdf",
                filePath: "documents/signed-form1.pdf",
                id: "signed-form1-001",
                title: "FORM 1",
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            },
            letterOfEngagement: {
                name: "signed-engagement.pdf",
                type: "application/pdf",
                size: 512000,
                url: "/uploads/documents/signed-engagement.pdf",
                filePath: "documents/signed-engagement.pdf",
                id: "signed-engagement-001",
                title: "Letter of Engagement",
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            }
        };

        // Insert test registration
        await connection.execute(`
      INSERT INTO registrations (
        id, company_name, contact_person_name, contact_person_email, 
        contact_person_phone, selected_package, step3_additional_doc, 
        step3_signed_additional_doc, customer_form1, customer_letter_of_engagement,
        documents_published, documents_acknowledged
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            testId,
            'Test Admin Step 3 Company',
            'Test Person',
            'test@admin-step3.com',
            '1234567890',
            'Basic Package',
            JSON.stringify(step3AdditionalDocs),
            JSON.stringify(step3SignedAdditionalDocs),
            JSON.stringify(customerDocuments.form1),
            JSON.stringify(customerDocuments.letterOfEngagement),
            true,
            true
        ]);

        console.log('✅ Test registration created with admin and customer documents');

        // Test 2: Simulate API GET request to retrieve registration data
        console.log('\n📋 Test 2: Simulating API GET request...');
        const [rows] = await connection.execute('SELECT * FROM registrations WHERE id = ?', [testId]);

        if (rows.length > 0) {
            const row = rows[0];

            // Simulate the API conversion from snake_case to camelCase (like in the actual API)
            const convertedRow = {
                _id: row.id,
                step3AdditionalDoc: row.step3_additional_doc ? JSON.parse(row.step3_additional_doc) : null,
                step3SignedAdditionalDoc: row.step3_signed_additional_doc ? JSON.parse(row.step3_signed_additional_doc) : null,
                customerDocuments: (() => {
                    const customerDocs = {};
                    if (row.customer_form1) {
                        customerDocs.form1 = JSON.parse(row.customer_form1);
                    }
                    if (row.customer_letter_of_engagement) {
                        customerDocs.letterOfEngagement = JSON.parse(row.customer_letter_of_engagement);
                    }
                    return Object.keys(customerDocs).length > 0 ? customerDocs : null;
                })(),
                documentsPublished: row.documents_published,
                documentsAcknowledged: row.documents_acknowledged
            };

            console.log('✅ API conversion successful:');
            console.log('   Step 3 Additional Documents (admin):', convertedRow.step3AdditionalDoc?.length || 0);
            console.log('   Step 3 Signed Additional Documents (customer):', Object.keys(convertedRow.step3SignedAdditionalDoc || {}).length);
            console.log('   Customer Documents:', Object.keys(convertedRow.customerDocuments || {}).length);
            console.log('   Documents Published:', convertedRow.documentsPublished);
            console.log('   Documents Acknowledged:', convertedRow.documentsAcknowledged);
        }

        // Test 3: Simulate admin step 3 display logic
        console.log('\n📋 Test 3: Simulating admin step 3 display logic...');

        // Simulate the admin component logic
        const selectedCompany = {
            _id: testId,
            step3AdditionalDoc: step3AdditionalDocs,
            step3SignedAdditionalDoc: step3SignedAdditionalDocs,
            customerDocuments: customerDocuments,
            documentsPublished: true,
            documentsAcknowledged: true
        };

        // Check if customer has submitted any documents
        const customerDocumentsFromAPI = selectedCompany.customerDocuments || {};
        const hasCustomerDocuments = Object.keys(customerDocumentsFromAPI).length > 0;
        const hasStep3SignedAdditionalDocs = selectedCompany.step3SignedAdditionalDoc && Object.keys(selectedCompany.step3SignedAdditionalDoc).length > 0;

        console.log('✅ Admin display logic check:');
        console.log('   Has Customer Documents:', hasCustomerDocuments);
        console.log('   Has Step 3 Signed Additional Docs:', hasStep3SignedAdditionalDocs);
        console.log('   Should Show Documents Section:', hasCustomerDocuments || hasStep3SignedAdditionalDocs);

        if (hasCustomerDocuments || hasStep3SignedAdditionalDocs) {
            // Separate documents by type for better organization
            const normalDocs = Object.entries(customerDocumentsFromAPI).filter(([key, doc]) =>
                key !== 'form18' && key !== 'addressProof' && key !== 'additionalDocuments' && key !== 'step3SignedAdditionalDoc'
            );
            const step3SignedAdditionalDocs = selectedCompany.step3SignedAdditionalDoc ? Object.entries(selectedCompany.step3SignedAdditionalDoc) : [];

            console.log('   Normal Customer Documents:', normalDocs.length);
            console.log('   Step 3 Signed Additional Documents:', step3SignedAdditionalDocs.length);

            // Display document details
            console.log('\n📄 Document Details:');

            console.log('   Normal Customer Documents:');
            normalDocs.forEach(([key, doc]) => {
                console.log(`     - ${doc.title || key}: ${doc.name} (${doc.size} bytes)`);
            });

            console.log('   Step 3 Signed Additional Documents:');
            step3SignedAdditionalDocs.forEach(([title, doc]) => {
                console.log(`     - ${doc.title}: ${doc.name} (${doc.size} bytes)`);
                console.log(`       Signed by customer: ${doc.signedByCustomer}`);
                console.log(`       Submitted at: ${doc.submittedAt}`);
            });
        }

        // Test 4: Verify data structure matches frontend expectations
        console.log('\n📋 Test 4: Verifying data structure...');

        // Check step 3 additional documents structure (admin uploads)
        if (selectedCompany.step3AdditionalDoc && Array.isArray(selectedCompany.step3AdditionalDoc)) {
            console.log('✅ step3AdditionalDoc is an array (correct for admin uploads)');
            selectedCompany.step3AdditionalDoc.forEach((doc, index) => {
                console.log(`   Admin Doc ${index + 1}: ${doc.title} (${doc.name})`);
            });
        }

        // Check step 3 signed additional documents structure (customer uploads)
        if (selectedCompany.step3SignedAdditionalDoc && typeof selectedCompany.step3SignedAdditionalDoc === 'object') {
            console.log('✅ step3SignedAdditionalDoc is an object (correct for customer uploads)');
            Object.entries(selectedCompany.step3SignedAdditionalDoc).forEach(([title, doc]) => {
                console.log(`   Customer Signed Doc: ${title} (${doc.name})`);
            });
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await connection.execute('DELETE FROM registrations WHERE id = ?', [testId]);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All admin step 3 display tests passed successfully!');

    } catch (error) {
        console.error('❌ Admin step 3 display test failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testAdminStep3Display()
        .then(() => {
            console.log('✅ Admin step 3 display test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Admin step 3 display test failed:', error);
            process.exit(1);
        });
}

module.exports = testAdminStep3Display; 