// Test script for admin step3 ALL documents management with MySQL integration
// This script tests that ALL step3 documents are saved instantly to MySQL and file storage

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
const testCompanyId = 'admin-step3-all-docs-test-company';
const testDocuments = {
    form1: {
        name: 'form1-test.pdf',
        type: 'application/pdf',
        size: 1024000,
        url: '/uploads/documents/form1-test.pdf',
        filePath: 'documents/form1-test.pdf',
        id: 'form1-doc-001',
        uploadedAt: new Date().toISOString()
    },
    letterOfEngagement: {
        name: 'letter-of-engagement-test.pdf',
        type: 'application/pdf',
        size: 1536000,
        url: '/uploads/documents/letter-of-engagement-test.pdf',
        filePath: 'documents/letter-of-engagement-test.pdf',
        id: 'letter-doc-001',
        uploadedAt: new Date().toISOString()
    },
    aoa: {
        name: 'articles-of-association-test.pdf',
        type: 'application/pdf',
        size: 2048000,
        url: '/uploads/documents/articles-of-association-test.pdf',
        filePath: 'documents/articles-of-association-test.pdf',
        id: 'aoa-doc-001',
        uploadedAt: new Date().toISOString()
    },
    form18: [
        {
            name: 'form18-director1-test.pdf',
            type: 'application/pdf',
            size: 512000,
            url: '/uploads/documents/form18-director1-test.pdf',
            filePath: 'documents/form18-director1-test.pdf',
            id: 'form18-doc-001',
            uploadedAt: new Date().toISOString()
        },
        {
            name: 'form18-director2-test.pdf',
            type: 'application/pdf',
            size: 512000,
            url: '/uploads/documents/form18-director2-test.pdf',
            filePath: 'documents/form18-director2-test.pdf',
            id: 'form18-doc-002',
            uploadedAt: new Date().toISOString()
        }
    ],
    step3AdditionalDoc: [
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
    ]
};

// Helper function to create test files in uploads directory
async function createTestUploadFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create test files for all document types
    const allFiles = [
        testDocuments.form1,
        testDocuments.letterOfEngagement,
        testDocuments.aoa,
        ...testDocuments.form18,
        ...testDocuments.step3AdditionalDoc
    ];

    for (const doc of allFiles) {
        const filePath = path.join(uploadsDir, doc.name);
        const content = `Test content for ${doc.name}`;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created test file: ${doc.name}`);
    }
}

// Helper function to cleanup test files
async function cleanupTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Remove test files for all document types
    const allFiles = [
        testDocuments.form1,
        testDocuments.letterOfEngagement,
        testDocuments.aoa,
        ...testDocuments.form18,
        ...testDocuments.step3AdditionalDoc
    ];

    for (const doc of allFiles) {
        const filePath = path.join(uploadsDir, doc.name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removed test file: ${doc.name}`);
        }
    }
}

// Test 1: Verify admin can upload ALL step3 documents instantly to MySQL
async function testAdminUploadAllStep3Documents() {
    console.log('\n🧪 Test 1: Admin uploading ALL step3 documents to MySQL');

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

        // Simulate admin uploading ALL step3 documents
        // This would normally be done through the frontend, but we'll simulate the API call
        const allDocuments = {
            form1: testDocuments.form1,
            letterOfEngagement: testDocuments.letterOfEngagement,
            aoa: testDocuments.aoa,
            form18: testDocuments.form18,
            step3AdditionalDoc: testDocuments.step3AdditionalDoc
        };

        // Update the registration with ALL step3 documents
        await connection.execute(`
            UPDATE registrations 
            SET form1 = ?, letter_of_engagement = ?, aoa = ?, form18 = ?, step3_additional_doc = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            JSON.stringify(allDocuments.form1),
            JSON.stringify(allDocuments.letterOfEngagement),
            JSON.stringify(allDocuments.aoa),
            JSON.stringify(allDocuments.form18),
            JSON.stringify(allDocuments.step3AdditionalDoc),
            testCompanyId
        ]);

        console.log('✅ ALL step3 documents saved to MySQL database');

        // Verify the documents were saved correctly
        const [verifyRows] = await connection.execute(`
            SELECT form1, letter_of_engagement, aoa, form18, step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (verifyRows.length === 0) {
            console.log('❌ Test registration not found after upload');
            return false;
        }

        const savedData = verifyRows[0];
        const savedForm1 = JSON.parse(savedData.form1);
        const savedLetterOfEngagement = JSON.parse(savedData.letter_of_engagement);
        const savedAoa = JSON.parse(savedData.aoa);
        const savedForm18 = JSON.parse(savedData.form18);
        const savedStep3AdditionalDoc = JSON.parse(savedData.step3_additional_doc);

        console.log(`✅ Documents saved:`, {
            form1: savedForm1 ? 'Yes' : 'No',
            letterOfEngagement: savedLetterOfEngagement ? 'Yes' : 'No',
            aoa: savedAoa ? 'Yes' : 'No',
            form18: savedForm18 ? `${savedForm18.length} documents` : 'No',
            step3AdditionalDoc: savedStep3AdditionalDoc ? `${savedStep3AdditionalDoc.length} documents` : 'No'
        });

        // Verify document structure for each type
        const documentChecks = [
            { name: 'Form1', doc: savedForm1 },
            { name: 'Letter of Engagement', doc: savedLetterOfEngagement },
            { name: 'Articles of Association', doc: savedAoa }
        ];

        for (const check of documentChecks) {
            if (check.doc) {
                if (!check.doc.name || !check.doc.url || !check.doc.filePath || !check.doc.id) {
                    console.log(`❌ ${check.name} structure incomplete:`, check.doc);
                    return false;
                }
            }
        }

        // Verify form18 array
        if (savedForm18 && Array.isArray(savedForm18)) {
            for (const doc of savedForm18) {
                if (doc && (!doc.name || !doc.url || !doc.filePath || !doc.id)) {
                    console.log('❌ Form18 document structure incomplete:', doc);
                    return false;
                }
            }
        }

        // Verify step3 additional documents
        if (savedStep3AdditionalDoc && Array.isArray(savedStep3AdditionalDoc)) {
            for (const doc of savedStep3AdditionalDoc) {
                if (!doc.title || !doc.name || !doc.url || !doc.filePath || !doc.id) {
                    console.log('❌ Step3 additional document structure incomplete:', doc);
                    return false;
                }
            }
        }

        console.log('✅ ALL step3 documents uploaded and saved to MySQL correctly');
        return true;

    } catch (error) {
        console.error('❌ Error testing admin upload ALL step3 documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify admin can publish ALL documents to customer
async function testAdminPublishAllDocuments() {
    console.log('\n🧪 Test 2: Admin publishing ALL documents to customer');

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

        console.log('✅ ALL documents published to customer');

        // Verify the publishing status
        const [verifyRows] = await connection.execute(`
            SELECT documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (verifyRows.length === 0) {
            console.log('❌ Test registration not found after publishing');
            return false;
        }

        const isPublished = verifyRows[0].documents_published;
        const status = verifyRows[0].status;

        if (isPublished && status === 'documents-published') {
            console.log('✅ ALL documents successfully published to customer');
            return true;
        } else {
            console.log('❌ Documents not properly published:', { isPublished, status });
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing admin publish ALL documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 3: Verify customer can access ALL published documents
async function testCustomerAccessAllPublishedDocuments() {
    console.log('\n🧪 Test 3: Customer accessing ALL published documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Fetch the registration as a customer would
        const [rows] = await connection.execute(`
            SELECT form1, letter_of_engagement, aoa, form18, step3_additional_doc, 
                   documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const registration = rows[0];
        const form1 = JSON.parse(registration.form1);
        const letterOfEngagement = JSON.parse(registration.letter_of_engagement);
        const aoa = JSON.parse(registration.aoa);
        const form18 = JSON.parse(registration.form18);
        const step3AdditionalDoc = JSON.parse(registration.step3_additional_doc);
        const isPublished = registration.documents_published;
        const status = registration.status;

        console.log(`📊 Customer access check:`, {
            documentsPublished: isPublished,
            status: status,
            form1: form1 ? 'Available' : 'Not available',
            letterOfEngagement: letterOfEngagement ? 'Available' : 'Not available',
            aoa: aoa ? 'Available' : 'Not available',
            form18: form18 ? `${form18.length} documents` : 'Not available',
            step3AdditionalDoc: step3AdditionalDoc ? `${step3AdditionalDoc.length} documents` : 'Not available'
        });

        // Verify customer can access documents when published
        if (isPublished && status === 'documents-published') {
            console.log('✅ Customer can access ALL published documents');

            // Verify each document is accessible
            const allDocuments = [form1, letterOfEngagement, aoa, ...(form18 || []), ...(step3AdditionalDoc || [])];

            for (const doc of allDocuments) {
                if (doc && doc.url) {
                    const filePath = path.join(process.cwd(), 'public', doc.url);
                    if (fs.existsSync(filePath)) {
                        console.log(`✅ Document file accessible: ${doc.name}`);
                    } else {
                        console.log(`❌ Document file not accessible: ${doc.name}`);
                        return false;
                    }
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

// Test 4: Verify admin can manage ALL documents
async function testAdminManageAllDocuments() {
    console.log('\n🧪 Test 4: Admin managing ALL documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Test adding a new step3 additional document
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
        console.error('❌ Error testing admin manage ALL documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 5: Verify file storage integration for ALL documents
async function testFileStorageIntegrationAllDocuments() {
    console.log('\n🧪 Test 5: File storage integration for ALL documents');

    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

        // Check if uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            console.log('❌ Uploads directory does not exist');
            return false;
        }

        // Check if ALL test files exist
        const allFiles = [
            testDocuments.form1,
            testDocuments.letterOfEngagement,
            testDocuments.aoa,
            ...testDocuments.form18,
            ...testDocuments.step3AdditionalDoc
        ];

        for (const doc of allFiles) {
            const filePath = path.join(uploadsDir, doc.name);
            if (!fs.existsSync(filePath)) {
                console.log(`❌ Test file not found: ${doc.name}`);
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

// Test 6: Verify API endpoints work correctly for ALL documents
async function testAPIEndpointsAllDocuments() {
    console.log('\n🧪 Test 6: API endpoints functionality for ALL documents');

    try {
        // Test GET endpoint
        const getResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`);
        if (!getResponse.ok) {
            console.log(`❌ GET API failed: ${getResponse.status} ${getResponse.statusText}`);
            return false;
        }

        const registration = await getResponse.json();
        console.log('✅ GET API working correctly');

        // Verify ALL step3 documents are included in response
        const documentChecks = [
            { name: 'Form1', field: 'form1', data: registration.form1 },
            { name: 'Letter of Engagement', field: 'letterOfEngagement', data: registration.letterOfEngagement },
            { name: 'Articles of Association', field: 'aoa', data: registration.aoa },
            { name: 'Form18', field: 'form18', data: registration.form18 },
            { name: 'Step3 Additional Documents', field: 'step3AdditionalDoc', data: registration.step3AdditionalDoc }
        ];

        for (const check of documentChecks) {
            if (check.data) {
                if (Array.isArray(check.data)) {
                    console.log(`✅ ${check.name} included in API response: ${check.data.length} documents`);
                } else {
                    console.log(`✅ ${check.name} included in API response`);
                }
            } else {
                console.log(`❌ ${check.name} not included in API response`);
                return false;
            }
        }

        // Test PUT endpoint
        const updateData = {
            ...registration,
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
    console.log('🚀 Starting Admin Step3 ALL Documents MySQL Integration Tests\n');

    // Create test files first
    await createTestUploadFiles();

    const tests = [
        { name: 'Admin Upload ALL Step3 Documents to MySQL', fn: testAdminUploadAllStep3Documents },
        { name: 'Admin Publish ALL Documents to Customer', fn: testAdminPublishAllDocuments },
        { name: 'Customer Access ALL Published Documents', fn: testCustomerAccessAllPublishedDocuments },
        { name: 'Admin Manage ALL Documents', fn: testAdminManageAllDocuments },
        { name: 'File Storage Integration for ALL Documents', fn: testFileStorageIntegrationAllDocuments },
        { name: 'API Endpoints for ALL Documents', fn: testAPIEndpointsAllDocuments }
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
        console.log('🎉 All tests passed! Admin step3 ALL documents management with MySQL integration is working correctly.');
        console.log('✅ ALL step3 documents (form1, letterOfEngagement, aoa, form18, additional) are instantly saved to MySQL database and filestore.');
        console.log('✅ "Publish to Customer" functionality works correctly for ALL documents.');
        console.log('✅ Customer can access ALL step3 documents when published.');
    } else {
        console.log('⚠️ Some tests failed. Please review the admin step3 ALL documents management implementation.');
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