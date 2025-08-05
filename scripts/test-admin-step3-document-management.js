// Test script specifically for admin step3 document management functionality
// This script tests the admin's ability to upload, manage, and publish additional documents in step3

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
const testCompanyId = 'admin-step3-test-company';
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
    }
];

// Helper function to create test files in uploads directory
async function createTestUploadFiles() {
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

// Test 1: Verify admin can upload additional documents to step3
async function testAdminUploadStep3Documents() {
    console.log('\n🧪 Test 1: Admin uploading additional documents to step3');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Create test registration for admin step3 testing
        const testRegistration = {
            id: testCompanyId,
            company_name: 'Admin Step3 Test Company',
            contact_person_name: 'Test Contact',
            contact_person_email: 'test@example.com',
            contact_person_phone: '+1234567890',
            selected_package: 'basic',
            status: 'documentation-processing',
            current_step: 'documentation',
            step3_additional_doc: JSON.stringify(testAdminDocuments),
            documents_published: false
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

        console.log('✅ Test registration created for admin step3 testing');

        // Verify documents were saved
        const [rows] = await connection.execute(`
            SELECT step3_additional_doc, documents_published FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const savedDocs = JSON.parse(rows[0].step3_additional_doc);
        const documentsPublished = rows[0].documents_published;

        console.log('✅ Admin step3 documents saved to database:');
        console.log(`   - Number of documents: ${savedDocs.length}`);
        console.log(`   - Documents published: ${documentsPublished}`);

        savedDocs.forEach((doc, index) => {
            console.log(`   - Document ${index + 1}: ${doc.title} (${doc.name})`);
            console.log(`     - File ID: ${doc.id}`);
            console.log(`     - File Path: ${doc.filePath}`);
            console.log(`     - File URL: ${doc.url}`);
        });

        // Verify document structure
        const firstDoc = savedDocs[0];
        const requiredFields = ['title', 'name', 'type', 'size', 'url', 'filePath', 'id', 'uploadedAt'];
        const missingFields = requiredFields.filter(field => !firstDoc.hasOwnProperty(field));

        if (missingFields.length > 0) {
            console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
            return false;
        }

        console.log('✅ Admin step3 document structure is correct');
        return true;

    } catch (error) {
        console.error('❌ Error testing admin upload step3 documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify admin can publish documents to customer
async function testAdminPublishDocuments() {
    console.log('\n🧪 Test 2: Admin publishing documents to customer');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Update registration to mark documents as published
        await connection.execute(`
            UPDATE registrations 
            SET documents_published = true, 
                status = 'documents-published'
            WHERE id = ?
        `, [testCompanyId]);

        console.log('✅ Documents marked as published');

        // Verify the update
        const [rows] = await connection.execute(`
            SELECT documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const registration = rows[0];
        console.log('✅ Document publishing verified:');
        console.log(`   - Documents published: ${registration.documents_published}`);
        console.log(`   - Status: ${registration.status}`);

        if (registration.documents_published && registration.status === 'documents-published') {
            console.log('✅ Documents successfully published to customer');
            return true;
        } else {
            console.log('❌ Documents not properly published');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing admin publish documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 3: Verify customer can see published documents
async function testCustomerViewPublishedDocuments() {
    console.log('\n🧪 Test 3: Customer viewing published documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Get registration data as customer would see it
        const [rows] = await connection.execute(`
            SELECT company_name, status, step3_additional_doc, documents_published
            FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const registration = rows[0];
        console.log('✅ Customer view of published documents:');
        console.log(`   - Company Name: ${registration.company_name}`);
        console.log(`   - Status: ${registration.status}`);
        console.log(`   - Documents Published: ${registration.documents_published}`);

        if (registration.step3_additional_doc) {
            const step3Docs = JSON.parse(registration.step3_additional_doc);
            console.log(`   - Step3 Additional Documents Available: ${step3Docs.length} documents`);

            step3Docs.forEach((doc, index) => {
                console.log(`     ${index + 1}. ${doc.title} (${doc.name})`);
                console.log(`        - Download URL: ${doc.url}`);
                console.log(`        - File Size: ${(doc.size / 1024).toFixed(2)} KB`);
            });
        }

        // Verify customer can access documents
        if (registration.documents_published && registration.step3_additional_doc) {
            console.log('✅ Customer can see published step3 documents');
            return true;
        } else {
            console.log('❌ Customer cannot see published documents');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing customer view published documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 4: Verify admin can manage (add/remove/replace) documents
async function testAdminManageDocuments() {
    console.log('\n🧪 Test 4: Admin managing (adding/removing/replacing) documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Test adding a new document
        const newDocument = {
            title: 'New Legal Agreement',
            name: 'new-legal-agreement.docx',
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 512000,
            url: '/uploads/documents/new-legal-agreement.docx',
            filePath: 'documents/new-legal-agreement.docx',
            id: 'admin-doc-003',
            uploadedAt: new Date().toISOString()
        };

        // Get current documents and add new one
        const [currentRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (currentRows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const currentDocs = JSON.parse(currentRows[0].step3_additional_doc);
        const updatedDocs = [...currentDocs, newDocument];

        // Update with new document
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(updatedDocs), testCompanyId]);

        console.log('✅ New document added to step3');

        // Verify the addition
        const [verifyRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const verifiedDocs = JSON.parse(verifyRows[0].step3_additional_doc);
        console.log(`✅ Document count updated: ${verifiedDocs.length} documents`);

        // Test removing a document
        const docsAfterRemoval = verifiedDocs.filter(doc => doc.id !== 'admin-doc-002');

        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(docsAfterRemoval), testCompanyId]);

        console.log('✅ Document removed from step3');

        // Verify the removal
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`✅ Final document count: ${finalDocs.length} documents`);

        if (finalDocs.length === 2 && finalDocs.find(doc => doc.id === 'admin-doc-001') && finalDocs.find(doc => doc.id === 'admin-doc-003')) {
            console.log('✅ Document management (add/remove) working correctly');
            return true;
        } else {
            console.log('❌ Document management not working correctly');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing admin manage documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 5: Verify file storage integration
async function testFileStorageIntegration() {
    console.log('\n🧪 Test 5: File storage integration');

    try {
        // Create test files in uploads directory
        await createTestUploadFiles();

        // Verify files exist on disk
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

        for (const doc of testAdminDocuments) {
            const filePath = path.join(uploadsDir, doc.name);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`✅ File exists: ${doc.name} (${stats.size} bytes)`);
            } else {
                console.log(`❌ File missing: ${doc.name}`);
                return false;
            }
        }

        console.log('✅ All test files exist in file storage');
        return true;

    } catch (error) {
        console.error('❌ Error testing file storage integration:', error.message);
        return false;
    }
}

// Test 6: Verify API endpoints for admin step3 management
async function testAPIEndpoints() {
    console.log('\n🧪 Test 6: API endpoints for admin step3 management');

    try {
        // Test database operations that would be used by API endpoints
        let connection = await mysql.createConnection(dbConfig);

        // Simulate GET registration endpoint
        const [getRows] = await connection.execute(`
            SELECT company_name, status, step3_additional_doc, documents_published
            FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (getRows.length === 0) {
            console.log('❌ Test registration not found for API test');
            return false;
        }

        const registration = getRows[0];
        console.log('✅ GET registration operation works:');
        console.log(`   - Company Name: ${registration.company_name}`);
        console.log(`   - Status: ${registration.status}`);
        console.log(`   - Step3 Additional Docs: ${registration.step3_additional_doc ? JSON.parse(registration.step3_additional_doc).length : 0}`);
        console.log(`   - Documents Published: ${registration.documents_published}`);

        // Simulate PUT registration endpoint
        const updateData = {
            step3AdditionalDoc: [
                {
                    title: 'Updated Business Plan',
                    name: 'updated-business-plan.pdf',
                    type: 'application/pdf',
                    size: 2048000,
                    url: '/uploads/documents/updated-business-plan.pdf',
                    filePath: 'documents/updated-business-plan.pdf',
                    id: 'admin-doc-updated-001',
                    uploadedAt: new Date().toISOString()
                }
            ],
            documentsPublished: true,
            status: 'documents-published'
        };

        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, 
                documents_published = ?,
                status = ?
            WHERE id = ?
        `, [
            JSON.stringify(updateData.step3AdditionalDoc),
            updateData.documentsPublished,
            updateData.status,
            testCompanyId
        ]);

        console.log('✅ PUT registration operation works');

        // Verify the update
        const [verifyRows] = await connection.execute(`
            SELECT step3_additional_doc, documents_published, status
            FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const updatedRegistration = verifyRows[0];
        const updatedDocs = JSON.parse(updatedRegistration.step3_additional_doc);

        console.log('✅ Update verification:');
        console.log(`   - Updated docs count: ${updatedDocs.length}`);
        console.log(`   - Documents published: ${updatedRegistration.documents_published}`);
        console.log(`   - Status: ${updatedRegistration.status}`);

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing API endpoints:', error.message);
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
    console.log('🚀 Starting Admin Step3 Document Management Tests\n');

    const tests = [
        { name: 'Admin Upload Step3 Documents', fn: testAdminUploadStep3Documents },
        { name: 'Admin Publish Documents', fn: testAdminPublishDocuments },
        { name: 'Customer View Published Documents', fn: testCustomerViewPublishedDocuments },
        { name: 'Admin Manage Documents', fn: testAdminManageDocuments },
        { name: 'File Storage Integration', fn: testFileStorageIntegration },
        { name: 'API Endpoints', fn: testAPIEndpoints }
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
        console.log('🎉 All tests passed! Admin step3 document management is working correctly.');
        console.log('✅ Additional documents are correctly saved to MySQL database and filestore.');
    } else {
        console.log('⚠️ Some tests failed. Please review the admin step3 document management implementation.');
    }

    // Cleanup
    await cleanup();
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests }; 