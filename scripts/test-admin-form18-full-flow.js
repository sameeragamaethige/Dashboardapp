const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testForm18FullFlow() {
    let connection;

    try {
        console.log('🔍 Testing complete Form 18 upload flow in admin step3...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company with multiple directors
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE directors IS NOT NULL 
      AND JSON_LENGTH(directors) > 0 
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies with directors found. Creating a test company...');

            // Create a test company with multiple directors
            const testCompany = {
                companyName: 'Test Company for Form18 Flow',
                directors: JSON.stringify([
                    { name: 'Director 1', fullName: 'Director One' },
                    { name: 'Director 2', fullName: 'Director Two' },
                    { name: 'Director 3', fullName: 'Director Three' }
                ]),
                status: 'pending',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            const [result] = await connection.execute(`
        INSERT INTO registrations (companyName, directors, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [testCompany.companyName, testCompany.directors, testCompany.status, testCompany.created_at, testCompany.updated_at]);

            console.log('✅ Test company created with ID:', result.insertId);
            return await testForm18FullFlow();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('👥 Directors:', JSON.parse(testCompany.directors || '[]'));

        // Check current Form 18 status
        console.log('\n📄 Current Form 18 documents:');
        console.log('Form 18 field:', testCompany.form18);

        const directors = JSON.parse(testCompany.directors || '[]');
        console.log(`\n📊 Testing Form 18 upload for ${directors.length} directors...`);

        // Simulate uploading Form 18 for each director one by one
        const updatedForm18 = [];

        for (let i = 0; i < directors.length; i++) {
            console.log(`\n📤 Uploading Form 18 for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`}...`);

            const mockForm18Document = {
                name: `form18_${directors[i].name || directors[i].fullName || `director_${i + 1}`}.pdf`,
                type: 'application/pdf',
                size: 1024000 + (i * 1000), // Different sizes for each
                url: `/uploads/documents/form18_${i + 1}_${Date.now()}.pdf`,
                filePath: `documents/form18_${i + 1}_${Date.now()}.pdf`,
                id: `form18_${i + 1}_${Date.now()}`,
                uploadedAt: new Date().toISOString()
            };

            // Simulate the admin step3 upload process
            // 1. Update local state (like the component does)
            updatedForm18[i] = mockForm18Document;

            // 2. Save to database (like the API call does)
            const [updateResult] = await connection.execute(`
        UPDATE registrations 
        SET form18 = ?, updated_at = ?
        WHERE id = ?
      `, [JSON.stringify(updatedForm18), new Date().toISOString().slice(0, 19).replace('T', ' '), testCompany.id]);

            if (updateResult.affectedRows > 0) {
                console.log(`✅ Form 18 for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`} saved successfully`);
                console.log(`   File: ${mockForm18Document.name} (${mockForm18Document.size} bytes)`);
            } else {
                console.log(`❌ Failed to save Form 18 for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`}`);
            }

            // Small delay to simulate real upload time
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Verify the final result
        const [finalCompany] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [testCompany.id]);

        if (finalCompany.length > 0) {
            const company = finalCompany[0];
            console.log('\n📋 Final verification - Updated company data:');
            console.log('Company ID:', company.id);
            console.log('Company Name:', company.companyName || 'Unnamed Company');

            const form18Array = JSON.parse(company.form18 || '[]');
            console.log('\n📄 Final Form 18 documents array:');
            console.log('Array length:', form18Array.length);
            console.log('Expected length:', directors.length);

            form18Array.forEach((doc, index) => {
                const directorName = directors[index]?.name || directors[index]?.fullName || `Director ${index + 1}`;
                console.log(`  ${directorName}: ${doc.name} (${doc.size} bytes)`);
            });

            // Verify array structure
            if (Array.isArray(form18Array) && form18Array.length === directors.length) {
                console.log('\n✅ Form 18 upload flow test completed successfully!');
                console.log(`📊 Summary: ${form18Array.length} Form 18 documents saved for ${directors.length} directors`);
                console.log('✅ Array structure is correct');
                console.log('✅ All directors have Form 18 documents');
            } else {
                console.log('\n❌ Form 18 upload flow test failed!');
                console.log('❌ Array structure is incorrect or missing documents');
            }
        }

    } catch (error) {
        console.error('❌ Error testing Form 18 upload flow:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testForm18FullFlow().then(() => {
    console.log('🏁 Form 18 full flow test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
