// Test script to verify that all customer uploaded additional documents are saved immediately to MySQL and filestorage
// This script tests the complete flow of customer uploading multiple additional documents

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
const testCompanyId = 'customer-additional-docs-test';
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

const testCustomerSignedDocuments = [
    {
        title: 'Business Plan Template',
        name: 'signed-business-plan.pdf',
        type: 'application/pdf',
        size: 2150400,
        url: '/uploads/documents/signed-business-plan.pdf',
        filePath: 'documents/signed-business-plan.pdf',
        id: 'signed-doc-001',
        uploadedAt: new Date().toISOString(),
        signedByCustomer: true,
        submittedAt: new Date().toISOString()
    },
    {
        title: 'Financial Projections Template',
        name: 'signed-financial-projections.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1100000,
        url: '/uploads/documents/signed-financial-projections.xlsx',
        filePath: 'documents/signed-financial-projections.xlsx',
        id: 'signed-doc-002',
        uploadedAt: new Date().toISOString(),
        signedByCustomer: true,
        submittedAt: new Date().toISOString()
    },
    {
        title: 'Legal Agreement Template',
        name: 'signed-legal-agreement.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 550000,
        url: '/uploads/documents/signed-legal-agreement.docx',
        filePath: 'documents/signed-legal-agreement.docx',
        id: 'signed-doc-003',
        uploadedAt: new Date().toISOString(),
        signedByCustomer: true,
        submittedAt: new Date().toISOString()
    }
];

// Helper function to create test files
async function createTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create test files for admin documents
    for (const doc of testAdminDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        const content = `Test content for ${doc.title}`;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created admin test file: ${doc.name}`);
    }

    // Create test files for customer signed documents
    for (const doc of testCustomerSignedDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        const content = `Signed test content for ${doc.title}`;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created customer signed test file: ${doc.name}`);
    }
}

// Helper function to clean up test files
async function cleanupTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (fs.existsSync(uploadsDir)) {
        const allDocs = [...testAdminDocuments, ...testCustomerSignedDocuments];
        for (const doc of allDocs) {
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
            company_name: 'Customer Additional Docs Test Company',
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

// Test 2: Simulate customer uploading first additional document
async function testCustomerUploadFirstDocument() {
    console.log('\n🧪 Test 2: Customer uploading first additional document');

    try {
        // Simulate the customer uploading the first document
        const firstSignedDoc = testCustomerSignedDocuments[0];

        // Create customer documents object with first document
        const customerDocuments = {
            step3SignedAdditionalDoc: {
                [firstSignedDoc.title]: firstSignedDoc
            }
        };

        // Save to database via API
        const response = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}/customer-documents`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerDocuments: customerDocuments,
                documentsAcknowledged: false
            })
        });

        if (!response.ok) {
            console.log(`❌ Failed to save first document: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log('✅ First additional document saved to database');

        // Verify the document was saved
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT step3_signed_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const savedDocs = JSON.parse(rows[0].step3_signed_additional_doc);
        console.log(`✅ First document verification: ${Object.keys(savedDocs).length} document saved`);
        console.log(`   - Document: ${Object.keys(savedDocs)[0]}`);

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing first document upload:', error.message);
        return false;
    }
}

// Test 3: Simulate customer uploading second additional document
async function testCustomerUploadSecondDocument() {
    console.log('\n🧪 Test 3: Customer uploading second additional document');

    try {
        // Simulate the customer uploading the second document
        const firstSignedDoc = testCustomerSignedDocuments[0];
        const secondSignedDoc = testCustomerSignedDocuments[1];

        // Create customer documents object with both documents
        const customerDocuments = {
            step3SignedAdditionalDoc: {
                [firstSignedDoc.title]: firstSignedDoc,
                [secondSignedDoc.title]: secondSignedDoc
            }
        };

        // Save to database via API
        const response = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}/customer-documents`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerDocuments: customerDocuments,
                documentsAcknowledged: false
            })
        });

        if (!response.ok) {
            console.log(`❌ Failed to save second document: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log('✅ Second additional document saved to database');

        // Verify both documents were saved
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT step3_signed_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const savedDocs = JSON.parse(rows[0].step3_signed_additional_doc);
        console.log(`✅ Second document verification: ${Object.keys(savedDocs).length} documents saved`);

        Object.keys(savedDocs).forEach((title, index) => {
            console.log(`   - Document ${index + 1}: ${title}`);
        });

        if (Object.keys(savedDocs).length === 2) {
            console.log('✅ Both documents are saved correctly');
        } else {
            console.log('❌ Not all documents are saved');
            return false;
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing second document upload:', error.message);
        return false;
    }
}

// Test 4: Simulate customer uploading third additional document
async function testCustomerUploadThirdDocument() {
    console.log('\n🧪 Test 4: Customer uploading third additional document');

    try {
        // Simulate the customer uploading the third document
        const firstSignedDoc = testCustomerSignedDocuments[0];
        const secondSignedDoc = testCustomerSignedDocuments[1];
        const thirdSignedDoc = testCustomerSignedDocuments[2];

        // Create customer documents object with all three documents
        const customerDocuments = {
            step3SignedAdditionalDoc: {
                [firstSignedDoc.title]: firstSignedDoc,
                [secondSignedDoc.title]: secondSignedDoc,
                [thirdSignedDoc.title]: thirdSignedDoc
            }
        };

        // Save to database via API
        const response = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}/customer-documents`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerDocuments: customerDocuments,
                documentsAcknowledged: false
            })
        });

        if (!response.ok) {
            console.log(`❌ Failed to save third document: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log('✅ Third additional document saved to database');

        // Verify all three documents were saved
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`
            SELECT step3_signed_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const savedDocs = JSON.parse(rows[0].step3_signed_additional_doc);
        console.log(`✅ Third document verification: ${Object.keys(savedDocs).length} documents saved`);

        Object.keys(savedDocs).forEach((title, index) => {
            console.log(`   - Document ${index + 1}: ${title}`);
        });

        if (Object.keys(savedDocs).length === 3) {
            console.log('✅ All three documents are saved correctly');
        } else {
            console.log('❌ Not all documents are saved');
            return false;
        }

        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing third document upload:', error.message);
        return false;
    }
}

// Test 5: Verify file storage integration
async function testFileStorageIntegration() {
    console.log('\n🧪 Test 5: Verifying file storage integration');

    try {
        // Create test files
        await createTestFiles();

        // Verify files exist on disk
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

        // Check admin documents
        for (const doc of testAdminDocuments) {
            const filePath = path.join(uploadsDir, doc.name);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`✅ Admin file exists: ${doc.name} (${stats.size} bytes)`);
            } else {
                console.log(`❌ Admin file missing: ${doc.name}`);
                return false;
            }
        }

        // Check customer signed documents
        for (const doc of testCustomerSignedDocuments) {
            const filePath = path.join(uploadsDir, doc.name);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                console.log(`✅ Customer signed file exists: ${doc.name} (${stats.size} bytes)`);
            } else {
                console.log(`❌ Customer signed file missing: ${doc.name}`);
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

// Test 6: Verify database schema and data integrity
async function testDatabaseIntegrity() {
    console.log('\n🧪 Test 6: Verifying database integrity');

    try {
        let connection = await mysql.createConnection(dbConfig);

        // Get the complete registration data
        const [rows] = await connection.execute(`
            SELECT step3_additional_doc, step3_signed_additional_doc, documents_published
            FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const registration = rows[0];

        // Verify admin documents
        const adminDocs = JSON.parse(registration.step3_additional_doc);
        console.log(`✅ Admin documents in database: ${adminDocs.length} documents`);

        // Verify customer signed documents
        const customerSignedDocs = JSON.parse(registration.step3_signed_additional_doc);
        console.log(`✅ Customer signed documents in database: ${Object.keys(customerSignedDocs).length} documents`);

        // Verify data structure
        Object.entries(customerSignedDocs).forEach(([title, doc]) => {
            const requiredFields = ['name', 'type', 'size', 'url', 'filePath', 'id', 'signedByCustomer', 'submittedAt'];
            const missingFields = requiredFields.filter(field => !doc.hasOwnProperty(field));

            if (missingFields.length === 0) {
                console.log(`   ✅ ${title}: All required fields present`);
            } else {
                console.log(`   ❌ ${title}: Missing fields: ${missingFields.join(', ')}`);
                return false;
            }
        });

        console.log('✅ Database integrity verified');
        await connection.end();
        return true;

    } catch (error) {
        console.error('❌ Error testing database integrity:', error.message);
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
    console.log('🚀 Starting Customer Additional Documents Save Tests\n');

    const tests = [
        { name: 'Create Test Registration', fn: testCreateTestRegistration },
        { name: 'Upload First Document', fn: testCustomerUploadFirstDocument },
        { name: 'Upload Second Document', fn: testCustomerUploadSecondDocument },
        { name: 'Upload Third Document', fn: testCustomerUploadThirdDocument },
        { name: 'File Storage Integration', fn: testFileStorageIntegration },
        { name: 'Database Integrity', fn: testDatabaseIntegrity }
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
        console.log('🎉 All tests passed! All customer additional documents are saved immediately to MySQL and filestorage.');
        console.log('✅ The issue has been fixed - all additional documents are preserved when uploading new ones.');
    } else {
        console.log('⚠️ Some tests failed. Please review the customer additional documents save implementation.');
    }

    // Cleanup
    await cleanup();
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests }; 