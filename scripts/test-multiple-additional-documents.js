// Test script for multiple additional documents upload
// This script tests that admin can upload multiple additional documents correctly

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
const testCompanyId = 'multiple-additional-docs-test-company';
const testAdditionalDocuments = [
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
    },
    {
        title: 'Tax Certificate Template',
        name: 'tax-certificate-template.pdf',
        type: 'application/pdf',
        size: 1536000,
        url: '/uploads/documents/tax-certificate-template.pdf',
        filePath: 'documents/tax-certificate-template.pdf',
        id: 'admin-doc-004',
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
    for (const doc of testAdditionalDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        const content = `Test content for ${doc.title}`;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created test file: ${doc.name}`);
    }
}

// Helper function to cleanup test files
async function cleanupTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Remove test files
    for (const doc of testAdditionalDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removed test file: ${doc.name}`);
        }
    }
}

// Test 1: Verify admin can upload multiple additional documents sequentially
async function testMultipleAdditionalDocumentsUpload() {
    console.log('\n🧪 Test 1: Admin uploading multiple additional documents sequentially');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // First, create a test registration if it doesn't exist
        const [existingRows] = await connection.execute(`
            SELECT id FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (existingRows.length === 0) {
            await connection.execute(`
                INSERT INTO registrations (id, company_name, contact_person_name, contact_person_email, 
                contact_person_phone, selected_package, current_step, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [testCompanyId, 'Test Company', 'Test Contact', 'test@example.com', '+1234567890', 'basic', 'documentation', 'pending']);
            console.log('✅ Created test registration');
        }

        // Simulate uploading multiple additional documents one by one
        let currentDocuments = [];

        for (let i = 0; i < testAdditionalDocuments.length; i++) {
            const doc = testAdditionalDocuments[i];
            console.log(`📁 Uploading document ${i + 1}/${testAdditionalDocuments.length}: ${doc.title}`);

            // Add document to current list
            currentDocuments.push(doc);

            // Update the registration with the new document
            await connection.execute(`
                UPDATE registrations 
                SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [JSON.stringify(currentDocuments), testCompanyId]);

            console.log(`✅ Document ${i + 1} uploaded and saved: ${doc.title}`);
        }

        console.log('✅ All multiple additional documents uploaded successfully');

        // Verify all documents were saved correctly
        const [verifyRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (verifyRows.length === 0) {
            console.log('❌ Test registration not found after upload');
            return false;
        }

        const savedDocuments = JSON.parse(verifyRows[0].step3_additional_doc);
        console.log(`✅ Total documents saved: ${savedDocuments.length} documents`);

        // Verify all documents are present
        if (savedDocuments.length !== testAdditionalDocuments.length) {
            console.log(`❌ Document count mismatch. Expected: ${testAdditionalDocuments.length}, Got: ${savedDocuments.length}`);
            return false;
        }

        // Verify each document structure
        for (let i = 0; i < savedDocuments.length; i++) {
            const savedDoc = savedDocuments[i];
            const expectedDoc = testAdditionalDocuments[i];

            if (!savedDoc.title || !savedDoc.name || !savedDoc.url || !savedDoc.filePath || !savedDoc.id) {
                console.log(`❌ Document ${i + 1} structure incomplete:`, savedDoc);
                return false;
            }

            if (savedDoc.title !== expectedDoc.title) {
                console.log(`❌ Document ${i + 1} title mismatch. Expected: ${expectedDoc.title}, Got: ${savedDoc.title}`);
                return false;
            }
        }

        console.log('✅ All multiple additional documents uploaded and saved correctly');
        return true;

    } catch (error) {
        console.error('❌ Error testing multiple additional documents upload:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify admin can manage multiple additional documents
async function testMultipleAdditionalDocumentsManagement() {
    console.log('\n🧪 Test 2: Admin managing multiple additional documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Get current documents
        const [currentRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (currentRows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const currentDocs = JSON.parse(currentRows[0].step3_additional_doc);
        console.log(`📊 Current documents: ${currentDocs.length} documents`);

        // Test adding a new document
        const newDocument = {
            title: 'New Additional Document',
            name: 'new-additional-document.pdf',
            type: 'application/pdf',
            size: 1024000,
            url: '/uploads/documents/new-additional-document.pdf',
            filePath: 'documents/new-additional-document.pdf',
            id: 'admin-doc-005',
            uploadedAt: new Date().toISOString()
        };

        const updatedDocs = [...currentDocs, newDocument];

        // Update with new document
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(updatedDocs), testCompanyId]);

        console.log('✅ New document added to multiple documents');

        // Verify the addition
        const [verifyRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const verifiedDocs = JSON.parse(verifyRows[0].step3_additional_doc);
        console.log(`✅ Document count after addition: ${verifiedDocs.length} documents`);

        // Test removing a document
        const docsAfterRemoval = verifiedDocs.filter(doc => doc.id !== 'admin-doc-002');

        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(docsAfterRemoval), testCompanyId]);

        console.log('✅ Document removed from multiple documents');

        // Verify the removal
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`✅ Final document count: ${finalDocs.length} documents`);

        if (finalDocs.length === 4 && finalDocs.find(doc => doc.id === 'admin-doc-001') && finalDocs.find(doc => doc.id === 'admin-doc-005')) {
            console.log('✅ Multiple document management (add/remove) working correctly');
            return true;
        } else {
            console.log('❌ Multiple document management not working correctly');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing multiple additional documents management:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 3: Verify customer can access multiple additional documents
async function testCustomerAccessMultipleAdditionalDocuments() {
    console.log('\n🧪 Test 3: Customer accessing multiple additional documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Update the registration to mark documents as published
        await connection.execute(`
            UPDATE registrations 
            SET documents_published = true, 
                documents_published_at = CURRENT_TIMESTAMP,
                status = 'documents-published',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [testCompanyId]);

        // Fetch the registration as a customer would
        const [rows] = await connection.execute(`
            SELECT step3_additional_doc, documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const registration = rows[0];
        const step3Documents = JSON.parse(registration.step3_additional_doc);
        const isPublished = registration.documents_published;
        const status = registration.status;

        console.log(`📊 Customer access check:`, {
            documentsPublished: isPublished,
            status: status,
            documentCount: step3Documents.length
        });

        // Verify customer can access documents when published
        if (isPublished && status === 'documents-published' && step3Documents.length > 0) {
            console.log('✅ Customer can access multiple additional documents');

            // Verify each document is accessible
            for (const doc of step3Documents) {
                const filePath = path.join(process.cwd(), 'public', doc.url);
                if (fs.existsSync(filePath)) {
                    console.log(`✅ Document file accessible: ${doc.name} (${doc.title})`);
                } else {
                    console.log(`❌ Document file not accessible: ${doc.name}`);
                    return false;
                }
            }

            return true;
        } else {
            console.log('❌ Customer cannot access documents - not published or no documents');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing customer access:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 4: Verify API endpoints work correctly for multiple additional documents
async function testAPIEndpointsMultipleAdditionalDocuments() {
    console.log('\n🧪 Test 4: API endpoints functionality for multiple additional documents');

    try {
        // Test GET endpoint
        const getResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`);
        if (!getResponse.ok) {
            console.log(`❌ GET API failed: ${getResponse.status} ${getResponse.statusText}`);
            return false;
        }

        const registration = await getResponse.json();
        console.log('✅ GET API working correctly');

        // Verify step3 additional documents are included in response
        if (registration.step3AdditionalDoc && Array.isArray(registration.step3AdditionalDoc)) {
            console.log(`✅ Step3 additional documents included in API response: ${registration.step3AdditionalDoc.length} documents`);

            // Verify document titles
            for (const doc of registration.step3AdditionalDoc) {
                console.log(`  - ${doc.title} (${doc.name})`);
            }
        } else {
            console.log('❌ Step3 additional documents not included in API response');
            return false;
        }

        // Test PUT endpoint
        const updateData = {
            ...registration,
            step3AdditionalDoc: registration.step3AdditionalDoc,
            updatedAt: new Date().toISOString()
        };

        const putResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (!putResponse.ok) {
            console.log(`❌ PUT API failed: ${putResponse.status} ${putResponse.statusText}`);
            return false;
        }

        console.log('✅ PUT API working correctly');
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

        // Remove test registration
        await connection.execute(`
            DELETE FROM registrations WHERE id = ?
        `, [testCompanyId]);

        console.log('✅ Test registration removed from database');

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }

    // Clean up test files
    await cleanupTestFiles();
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Multiple Additional Documents Tests\n');

    // Create test files first
    await createTestUploadFiles();

    const tests = [
        { name: 'Multiple Additional Documents Upload', fn: testMultipleAdditionalDocumentsUpload },
        { name: 'Multiple Additional Documents Management', fn: testMultipleAdditionalDocumentsManagement },
        { name: 'Customer Access Multiple Additional Documents', fn: testCustomerAccessMultipleAdditionalDocuments },
        { name: 'API Endpoints for Multiple Additional Documents', fn: testAPIEndpointsMultipleAdditionalDocuments }
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
        console.log('🎉 All tests passed! Multiple additional documents functionality is working correctly.');
        console.log('✅ Admin can upload multiple additional documents sequentially.');
        console.log('✅ Multiple additional documents are correctly saved to MySQL database.');
        console.log('✅ Customer can access multiple additional documents when published.');
    } else {
        console.log('⚠️ Some tests failed. Please review the multiple additional documents implementation.');
    }

    // Cleanup
    await cleanup();
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    cleanup
}; 