const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testForm18APICall() {
    let connection;

    try {
        console.log('🔍 Testing Form 18 API call simulation...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE directors IS NOT NULL 
      AND JSON_LENGTH(directors) > 0 
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies with directors found');
            return;
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');

        // Simulate the exact data structure that the frontend sends
        const mockForm18Document = {
            name: 'test_form18.pdf',
            type: 'application/pdf',
            size: 1024000,
            url: '/uploads/documents/test_form18.pdf',
            filePath: 'documents/test_form18.pdf',
            id: 'test_form18_123',
            uploadedAt: new Date().toISOString()
        };

        // Simulate the updateData object that the frontend creates
        const updateData = {
            ...testCompany,
            form18: [mockForm18Document], // Array with one document
            updated_at: new Date().toISOString()
        };

        console.log('📄 Update data being sent:');
        console.log('Form 18 field:', updateData.form18);
        console.log('Form 18 type:', typeof updateData.form18);
        console.log('Form 18 is array:', Array.isArray(updateData.form18));

        // Simulate the API call by directly updating the database
        const [updateResult] = await connection.execute(`
      UPDATE registrations 
      SET form18 = ?, updated_at = ?
      WHERE id = ?
    `, [
            JSON.stringify(updateData.form18),
            new Date().toISOString().slice(0, 19).replace('T', ' '),
            testCompany.id
        ]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Database update successful');
        } else {
            console.log('❌ Database update failed');
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

            const form18Array = JSON.parse(company.form18 || '[]');
            console.log('📄 Form 18 array after update:', form18Array);
            console.log('📄 Form 18 array length:', form18Array.length);
            console.log('📄 Form 18 array type:', typeof form18Array);
            console.log('📄 Form 18 is array:', Array.isArray(form18Array));

            if (form18Array.length > 0 && form18Array[0].name === mockForm18Document.name) {
                console.log('✅ Form 18 document saved correctly!');
            } else {
                console.log('❌ Form 18 document not saved correctly!');
            }
        }

    } catch (error) {
        console.error('❌ Error in testForm18APICall:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testForm18APICall().then(() => {
    console.log('🏁 Form 18 API call test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
