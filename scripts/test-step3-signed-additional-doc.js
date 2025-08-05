// Test script to verify step3_signed_additional_doc column functionality
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testStep3SignedAdditionalDoc() {
    let connection;

    try {
        console.log('🧪 Testing step3_signed_additional_doc column functionality...');

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

        // Test 1: Check if column exists
        console.log('\n📋 Test 1: Checking if column exists...');
        const [columns] = await connection.execute('DESCRIBE registrations');
        const columnExists = columns.some(col => col.Field === 'step3_signed_additional_doc');

        if (columnExists) {
            console.log('✅ Column step3_signed_additional_doc exists');
        } else {
            console.log('❌ Column step3_signed_additional_doc not found');
            return;
        }

        // Test 2: Check column type
        console.log('\n📋 Test 2: Checking column type...');
        const columnInfo = columns.find(col => col.Field === 'step3_signed_additional_doc');
        console.log(`Column type: ${columnInfo.Type}`);

        if (columnInfo.Type.includes('json')) {
            console.log('✅ Column type is JSON (correct)');
        } else {
            console.log('❌ Column type is not JSON');
        }

        // Test 3: Insert test data
        console.log('\n📋 Test 3: Testing data insertion...');
        const testId = 'test-step3-signed-' + Date.now();
        const testData = {
            fileName: 'test-signed-document.pdf',
            fileUrl: '/uploads/documents/test-signed-document.pdf',
            uploadedAt: new Date().toISOString(),
            fileSize: 1024000,
            mimeType: 'application/pdf'
        };

        // Insert test registration
        await connection.execute(`
      INSERT INTO registrations (id, company_name, contact_person_name, contact_person_email, contact_person_phone, selected_package, step3_signed_additional_doc)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [testId, 'Test Company', 'Test Person', 'test@example.com', '1234567890', 'Basic Package', JSON.stringify(testData)]);

        console.log('✅ Test data inserted successfully');

        // Test 4: Retrieve test data
        console.log('\n📋 Test 4: Testing data retrieval...');
        const [rows] = await connection.execute(`
      SELECT step3_signed_additional_doc FROM registrations WHERE id = ?
    `, [testId]);

        if (rows.length > 0) {
            const retrievedData = JSON.parse(rows[0].step3_signed_additional_doc);
            console.log('✅ Data retrieved successfully:');
            console.log('   File Name:', retrievedData.fileName);
            console.log('   File URL:', retrievedData.fileUrl);
            console.log('   Uploaded At:', retrievedData.uploadedAt);
            console.log('   File Size:', retrievedData.fileSize);
            console.log('   MIME Type:', retrievedData.mimeType);
        } else {
            console.log('❌ No data retrieved');
        }

        // Test 5: Update test data
        console.log('\n📋 Test 5: Testing data update...');
        const updatedData = {
            ...testData,
            fileName: 'updated-signed-document.pdf',
            updatedAt: new Date().toISOString()
        };

        await connection.execute(`
      UPDATE registrations 
      SET step3_signed_additional_doc = ? 
      WHERE id = ?
    `, [JSON.stringify(updatedData), testId]);

        console.log('✅ Data updated successfully');

        // Test 6: Verify update
        const [updatedRows] = await connection.execute(`
      SELECT step3_signed_additional_doc FROM registrations WHERE id = ?
    `, [testId]);

        if (updatedRows.length > 0) {
            const finalData = JSON.parse(updatedRows[0].step3_signed_additional_doc);
            console.log('✅ Update verified:');
            console.log('   Updated File Name:', finalData.fileName);
            console.log('   Updated At:', finalData.updatedAt);
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await connection.execute('DELETE FROM registrations WHERE id = ?', [testId]);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
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
    testStep3SignedAdditionalDoc()
        .then(() => {
            console.log('✅ Column functionality test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Column functionality test failed:', error);
            process.exit(1);
        });
}

module.exports = testStep3SignedAdditionalDoc; 