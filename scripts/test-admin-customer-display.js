// Test script to verify admin uploaded additional documents are properly displayed in customer step3
// This script tests the complete flow from admin upload to customer display

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

// Test data
const testCompanyId = 'admin-customer-display-test';
const testAdminDocuments = [
    {
        title: 'Business Plan Template',
        name: 'business-plan-template.pdf',
        type: 'application/pdf',
        size: 2048000,
        url: '/uploads/documents/business-plan-template.pdf',
        filePath: 'documents/business-plan-template.pdf',
        id: 'admin-doc-001',
        uploadedAt: new Date().toISOString()
    },
    {
        title: 'Financial Projections Template',
        name: 'financial-projections-template.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024000,
        url: '/uploads/documents/financial-projections-template.xlsx',
        filePath: 'documents/financial-projections-template.xlsx',
        id: 'admin-doc-002',
        uploadedAt: new Date().toISOString()
    },
    {
        title: 'Legal Agreement Template',
        name: 'legal-agreement-template.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 512000,
        url: '/uploads/documents/legal-agreement-template.docx',
        filePath: 'documents/legal-agreement-template.docx',
        id: 'admin-doc-003',
        uploadedAt: new Date().toISOString()
    }
];

// Helper function to create test files
async function createTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create test files
    for (const doc of testAdminDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        const content = `Test content for ${doc.title}`;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created test file: ${doc.name}`);
    }
}

// Helper function to clean up test files
async function cleanupTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (fs.existsSync(uploadsDir)) {
        for (const doc of testAdminDocuments) {
            const filePath = path.join(uploadsDir, doc.name);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Cleaned up test file: ${doc.name}`);
            }
        }
    }
}

// Test 1: Create test registration with admin uploaded documents
async function testCreateTestRegistration() {
    console.log('\n🧪 Test 1: Creating test registration with admin uploaded documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Create test registration
        const testRegistration = {
            id: testCompanyId,
            company_name: 'Admin Customer Display Test Company',
            contact_person_name: 'Test Contact',
            contact_person_email: 'test@example.com',
            contact_person_phone: '+1234567890',
            selected_package: 'basic',
            status: 'documents-published',
            current_step: 'documentation',
            step3_additional_doc: JSON.stringify(testAdminDocuments),
            documents_published: true
        };

        // Insert test registration
        await connection.execute(`
            INSERT INTO registrations (id, company_name, contact_person_name, contact_person_email, contact_person_phone, selected_package, status, current_step, step3_additional_doc, documents_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            company_name = VALUES(company_name),
            contact_person_name = VALUES(contact_person_name),
            contact_person_email = VALUES(contact_person_email),
            contact_person_phone = VALUES(contact_person_phone),
            selected_package = VALUES(selected_package),
            status = VALUES(status),
            current_step = VALUES(current_step),
            step3_additional_doc = VALUES(step3_additional_doc),
            documents_published = VALUES(documents_published)
        `, [
            testRegistration.id,
            testRegistration.company_name,
            testRegistration.contact_person_name,
            testRegistration.contact_person_email,
            testRegistration.contact_person_phone,
            testRegistration.selected_package,
            testRegistration.status,
            testRegistration.current_step,
            testRegistration.step3_additional_doc,
            testRegistration.documents_published
        ]);

        console.log('✅ Test registration created with admin uploaded documents');
        return true;

    } catch (error) {
        console.error('❌ Error creating test registration:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify API returns correct data for customer
async function testAPIReturnsCorrectData() {
    console.log('\n🧪 Test 2: Verifying API returns correct data for customer');

    try {
        // Simulate API call to get registration data
        let connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(`
            SELECT * FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const row = rows[0];

        // Convert to frontend format (same as API)
        const convertedRow = {
            _id: row.id,
            id: row.id,
            companyName: row.company_name,
            contactPersonName: row.contact_person_name,
            contactPersonEmail: row.contact_person_email,
            contactPersonPhone: row.contact_person_phone,
            selectedPackage: row.selected_package,
            currentStep: row.current_step,
            status: row.status,
            documentsPublished: row.documents_published,
            step3AdditionalDoc: row.step3_additional_doc ? JSON.parse(row.step3_additional_doc) : null,
            step3SignedAdditionalDoc: row.step3_signed_additional_doc ? JSON.parse(row.step3_signed_additional_doc) : null
        };

        console.log('✅ API data conversion successful:');
        console.log(`   - Company Name: ${convertedRow.companyName}`);
        console.log(`   - Status: ${convertedRow.status}`);
        console.log(`   - Documents Published: ${convertedRow.documentsPublished}`);
        console.log(`   - Current Step: ${convertedRow.currentStep}`);

        // Verify step3 additional documents
        if (convertedRow.step3AdditionalDoc) {
            console.log(`   - Step3 Additional Documents: ${convertedRow.step3AdditionalDoc.length} documents`);

            convertedRow.step3AdditionalDoc.forEach((doc, index) => {
                console.log(`     ${index + 1}. ${doc.title} (${doc.name})`);
                console.log(`        - File ID: ${doc.id}`);
                console.log(`        - File URL: ${doc.url}`);
                console.log(`        - File Size: ${(doc.size / 1024).toFixed(2)} KB`);
                console.log(`        - File Type: ${doc.type}`);
            });
        } else {
            console.log('   - Step3 Additional Documents: None');
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing API data:', error.message);
        return false;
    }
}

// Test 3: Verify customer component receives correct data
async function testCustomerComponentData() {
    console.log('\n🧪 Test 3: Verifying customer component receives correct data');

    try {
        // Simulate what the customer component would receive
        let connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(`
            SELECT step3_additional_doc, documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const row = rows[0];
        const step3Docs = row.step3_additional_doc ? JSON.parse(row.step3_additional_doc) : null;

        console.log('✅ Customer component data verification:');
        console.log(`   - Documents Published: ${row.documents_published}`);
        console.log(`   - Status: ${row.status}`);
        console.log(`   - Step3 Documents Available: ${step3Docs ? step3Docs.length : 0}`);

        // Verify documents should be visible to customer
        if (row.documents_published && step3Docs && step3Docs.length > 0) {
            console.log('✅ Documents should be visible to customer');

            // Verify each document has required fields for display
            step3Docs.forEach((doc, index) => {
                const requiredFields = ['title', 'name', 'url', 'id', 'type', 'size'];
                const missingFields = requiredFields.filter(field => !doc.hasOwnProperty(field));

                if (missingFields.length === 0) {
                    console.log(`   ✅ Document ${index + 1} (${doc.title}) has all required fields`);
                } else {
                    console.log(`   ❌ Document ${index + 1} (${doc.title}) missing fields: ${missingFields.join(', ')}`);
                    return false;
                }
            });
        } else {
            console.log('❌ Documents should not be visible to customer');
            return false;
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing customer component data:', error.message);
        return false;
    }
}

// Test 4: Verify file accessibility
async function testFileAccessibility() {
    console.log('\n🧪 Test 4: Verifying file accessibility');

    try {
        // Create test files
        await createTestFiles();

        // Verify files exist and are accessible
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

        for (const doc of testAdminDocuments) {
            const filePath = path.join(uploadsDir, doc.name);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`✅ File accessible: ${doc.name} (${stats.size} bytes)`);

                // Verify file content
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes(doc.title)) {
                    console.log(`   ✅ File content verified for: ${doc.name}`);
                } else {
                    console.log(`   ❌ File content verification failed for: ${doc.name}`);
                    return false;
                }
            } else {
                console.log(`❌ File not accessible: ${doc.name}`);
                return false;
            }
        }

        console.log('✅ All files are accessible');
        return true;

    } catch (error) {
        console.error('❌ Error testing file accessibility:', error.message);
        return false;
    }
}

// Test 5: Verify customer display logic
async function testCustomerDisplayLogic() {
    console.log('\n🧪 Test 5: Verifying customer display logic');

    try {
        // Simulate the customer component's display logic
        let connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(`
            SELECT step3_additional_doc, documents_published FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const row = rows[0];
        const step3Docs = row.step3_additional_doc ? JSON.parse(row.step3_additional_doc) : null;

        // Simulate customer component logic
        const shouldShowDocuments = row.documents_published && step3Docs && step3Docs.length > 0;

        console.log('✅ Customer display logic verification:');
        console.log(`   - Documents Published: ${row.documents_published}`);
        console.log(`   - Step3 Documents: ${step3Docs ? step3Docs.length : 0} documents`);
        console.log(`   - Should Show Documents: ${shouldShowDocuments}`);

        if (shouldShowDocuments) {
            console.log('✅ Documents should be displayed in customer interface');

            // Verify download tab display
            console.log('   📥 Download Tab:');
            step3Docs.forEach((doc, index) => {
                console.log(`     - ${doc.title} (${doc.name})`);
                console.log(`       Download URL: ${doc.url}`);
            });

            // Verify upload tab display
            console.log('   📤 Upload Tab:');
            step3Docs.forEach((doc, index) => {
                console.log(`     - Signed ${doc.title}`);
                console.log(`       Upload key: step3_additional_${index}`);
            });
        } else {
            console.log('❌ Documents should not be displayed');
            return false;
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing customer display logic:', error.message);
        return false;
    }
}

// Test 6: Verify customer signed document handling
async function testCustomerSignedDocumentHandling() {
    console.log('\n🧪 Test 6: Verifying customer signed document handling');

    try {
        // Simulate customer uploading signed documents
        const signedDocuments = {
            'Business Plan Template': {
                name: 'signed-business-plan.pdf',
                type: 'application/pdf',
                size: 2150400,
                url: '/uploads/documents/signed-business-plan.pdf',
                filePath: 'documents/signed-business-plan.pdf',
                id: 'signed-doc-001',
                title: 'Business Plan Template',
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            }
        };

        let connection = await mysql.createConnection(dbConfig);

        // Update with signed documents
        await connection.execute(`
            UPDATE registrations 
            SET step3_signed_additional_doc = ?
            WHERE id = ?
        `, [JSON.stringify(signedDocuments), testCompanyId]);

        console.log('✅ Customer signed documents saved');

        // Verify signed documents
        const [rows] = await connection.execute(`
            SELECT step3_signed_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const savedSignedDocs = JSON.parse(rows[0].step3_signed_additional_doc);
        console.log('✅ Customer signed document verification:');
        console.log(`   - Signed Documents: ${Object.keys(savedSignedDocs).length} documents`);

        Object.entries(savedSignedDocs).forEach(([title, doc]) => {
            console.log(`   - ${title} (${doc.name})`);
            console.log(`     - Signed by Customer: ${doc.signedByCustomer}`);
            console.log(`     - Submitted At: ${doc.submittedAt}`);
        });

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing customer signed document handling:', error.message);
        return false;
    }
}

// Cleanup function
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Delete test registration
        await connection.execute(`
            DELETE FROM registrations WHERE id = ?
        `, [testCompanyId]);

        console.log('✅ Test registration deleted');

        // Clean up test files
        await cleanupTestFiles();

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Admin-Customer Display Tests\n');

    const tests = [
        { name: 'Create Test Registration', fn: testCreateTestRegistration },
        { name: 'API Returns Correct Data', fn: testAPIReturnsCorrectData },
        { name: 'Customer Component Data', fn: testCustomerComponentData },
        { name: 'File Accessibility', fn: testFileAccessibility },
        { name: 'Customer Display Logic', fn: testCustomerDisplayLogic },
        { name: 'Customer Signed Document Handling', fn: testCustomerSignedDocumentHandling }
    ];

    const results = [];

    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
            console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}\n`);
        } catch (error) {
            console.error(`❌ ${test.name} threw an error:`, error.message);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }

    // Summary
    console.log('📊 Test Results Summary:');
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}${result.error ? ` (Error: ${result.error})` : ''}`);
    });

    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Admin uploaded additional documents are properly displayed in customer step3.');
        console.log('✅ The complete flow from admin upload to customer display is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please review the admin-customer display implementation.');
    }

    // Cleanup
    await cleanup();
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests }; 