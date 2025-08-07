const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testForm18Upload() {
    let connection;

    try {
        console.log('🔍 Testing Form 18 document upload and saving...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company with directors
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE directors IS NOT NULL 
      AND JSON_LENGTH(directors) > 0 
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies with directors found. Creating a test company...');

            // Create a test company with directors
            const testCompany = {
                companyName: 'Test Company for Form18',
                directors: JSON.stringify([
                    { name: 'Director 1', fullName: 'Director One' },
                    { name: 'Director 2', fullName: 'Director Two' }
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
            return await testForm18Upload();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName);
        console.log('👥 Directors:', JSON.parse(testCompany.directors || '[]'));

        // Check current Form 18 status
        console.log('\n📄 Current Form 18 documents:');
        console.log('Form 18 field:', testCompany.form18);

        // Simulate Form 18 upload for each director
        const directors = JSON.parse(testCompany.directors || '[]');
        const updatedForm18 = [];

        for (let i = 0; i < directors.length; i++) {
            const mockForm18Document = {
                name: `form18_director_${i + 1}.pdf`,
                type: 'application/pdf',
                size: 1024000 + (i * 1000), // Different sizes for each
                url: `/uploads/documents/form18_director_${i + 1}_${Date.now()}.pdf`,
                filePath: `documents/form18_director_${i + 1}_${Date.now()}.pdf`,
                id: `form18_${i + 1}_${Date.now()}`,
                uploadedAt: new Date().toISOString()
            };

            updatedForm18.push(mockForm18Document);
            console.log(`✅ Simulated Form 18 upload for ${directors[i].name || `Director ${i + 1}`}:`, mockForm18Document.name);
        }

        // Update the company with Form 18 documents
        const [updateResult] = await connection.execute(`
      UPDATE registrations 
      SET form18 = ?, updated_at = ?
      WHERE id = ?
    `, [JSON.stringify(updatedForm18), new Date().toISOString().slice(0, 19).replace('T', ' '), testCompany.id]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Form 18 documents saved to database successfully');
        } else {
            console.log('❌ Failed to save Form 18 documents');
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
            console.log('Company Name:', company.companyName);
            console.log('Form 18 documents:', company.form18);

            const form18Array = JSON.parse(company.form18 || '[]');
            console.log('\n📄 Form 18 documents array:');
            form18Array.forEach((doc, index) => {
                console.log(`  Director ${index + 1}: ${doc.name} (${doc.size} bytes)`);
            });

            console.log('\n✅ Form 18 upload test completed successfully!');
            console.log(`📊 Summary: ${form18Array.length} Form 18 documents saved for ${directors.length} directors`);
        }

    } catch (error) {
        console.error('❌ Error testing Form 18 upload:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testForm18Upload().then(() => {
    console.log('🏁 Form 18 upload test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
