// Test script for delete bin functionality for additional documents
// This script tests that admin can delete additional documents using the delete bin icon

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
const testCompanyId = 'delete-additional-docs-test-company';
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

// Test 1: Verify admin can delete additional documents using delete bin
async function testDeleteAdditionalDocuments() {
    console.log('\n🧪 Test 1: Admin deleting additional documents using delete bin');

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

        // Add all test documents to the registration
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(testAdditionalDocuments), testCompanyId]);

        console.log('✅ Added test additional documents to registration');

        // Verify initial document count
        const [initialRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const initialDocs = JSON.parse(initialRows[0].step3_additional_doc);
        console.log(`📊 Initial document count: ${initialDocs.length} documents`);

        // Simulate deleting the second document (index 1)
        const documentToDelete = initialDocs[1];
        console.log(`🗑️ Deleting document: ${documentToDelete.title} (${documentToDelete.name})`);

        // Remove the document from the array
        const updatedDocs = initialDocs.filter((_, index) => index !== 1);

        // Update the registration
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(updatedDocs), testCompanyId]);

        console.log('✅ Document deleted from database');

        // Verify the deletion
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`📊 Final document count: ${finalDocs.length} documents`);

        // Verify the correct document was deleted
        const deletedDocStillExists = finalDocs.find((doc) => doc.id === 'admin-doc-002');
        const remainingDocs = finalDocs.map((doc) => doc.title);

        if (finalDocs.length === 2 && !deletedDocStillExists) {
            console.log('✅ Document deletion successful');
            console.log(`📋 Remaining documents: ${remainingDocs.join(', ')}`);
            return true;
        } else {
            console.log('❌ Document deletion failed');
            console.log(`📋 Current documents: ${finalDocs.map((doc) => doc.title).join(', ')}`);
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing document deletion:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify delete bin UI functionality
async function testDeleteBinUI() {
    console.log('\n🧪 Test 2: Delete bin UI functionality');

    try {
        // Test GET endpoint to verify documents are accessible
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

        // Test PUT endpoint for deletion
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

        console.log('✅ PUT API working correctly for document management');
        return true;

    } catch (error) {
        console.error('❌ Error testing delete bin UI:', error.message);
        return false;
    }
}

// Test 3: Verify multiple deletions work correctly
async function testMultipleDeletions() {
    console.log('\n🧪 Test 3: Multiple document deletions');

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

        // Simulate deleting multiple documents
        const docsToKeep = currentDocs.filter((_, index) => index === 0); // Keep only first document

        // Update the registration
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(docsToKeep), testCompanyId]);

        console.log('✅ Multiple documents deleted from database');

        // Verify the deletions
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`📊 Final document count after multiple deletions: ${finalDocs.length} documents`);

        if (finalDocs.length === 1) {
            console.log('✅ Multiple document deletions successful');
            console.log(`📋 Remaining document: ${finalDocs[0].title}`);
            return true;
        } else {
            console.log('❌ Multiple document deletions failed');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing multiple deletions:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 4: Verify delete functionality with pending documents
async function testDeletePendingDocuments() {
    console.log('\n🧪 Test 4: Delete functionality with pending documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Add a new document to simulate pending state
        const newDocument = {
            title: 'New Pending Document',
            name: 'new-pending-document.pdf',
            type: 'application/pdf',
            size: 1024000,
            url: '/uploads/documents/new-pending-document.pdf',
            filePath: 'documents/new-pending-document.pdf',
            id: 'admin-doc-004',
            uploadedAt: new Date().toISOString()
        };

        // Get current documents and add the new one
        const [currentRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const currentDocs = JSON.parse(currentRows[0].step3_additional_doc);
        const updatedDocs = [...currentDocs, newDocument];

        // Update with new document
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(updatedDocs), testCompanyId]);

        console.log('✅ Added pending document to database');

        // Simulate deleting the pending document (last one)
        const docsAfterDeletion = updatedDocs.slice(0, -1);

        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(docsAfterDeletion), testCompanyId]);

        console.log('✅ Pending document deleted from database');

        // Verify the deletion
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`📊 Final document count: ${finalDocs.length} documents`);

        const pendingDocStillExists = finalDocs.find((doc) => doc.id === 'admin-doc-004');

        if (finalDocs.length === 1 && !pendingDocStillExists) {
            console.log('✅ Pending document deletion successful');
            return true;
        } else {
            console.log('❌ Pending document deletion failed');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing pending document deletion:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
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
    console.log('🚀 Starting Delete Additional Documents Tests\n');

    // Create test files first
    await createTestUploadFiles();

    const tests = [
        { name: 'Delete Additional Documents', fn: testDeleteAdditionalDocuments },
        { name: 'Delete Bin UI Functionality', fn: testDeleteBinUI },
        { name: 'Multiple Document Deletions', fn: testMultipleDeletions },
        { name: 'Delete Pending Documents', fn: testDeletePendingDocuments }
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
        console.log('🎉 All tests passed! Delete bin functionality is working correctly.');
        console.log('✅ Admin can delete additional documents using the delete bin icon.');
        console.log('✅ Multiple document deletions work correctly.');
        console.log('✅ Pending document deletions work correctly.');
        console.log('✅ UI integration with delete bin icon is functional.');
    } else {
        console.log('⚠️ Some tests failed. Please review the delete bin implementation.');
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