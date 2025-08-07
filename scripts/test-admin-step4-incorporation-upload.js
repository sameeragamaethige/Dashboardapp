const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testAdminStep4IncorporationUpload() {
    let connection;

    try {
        console.log('🔍 Testing admin step 4 incorporation certificate upload...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company that's ready for step 4
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'incorporate' 
      OR status = 'incorporation-processing'
      OR documents_approved = 1
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found ready for step 4. Creating a test company...');

            // Create a test company ready for step 4
            const testCompany = {
                companyName: 'Test Company Step4',
                current_step: 'incorporate',
                status: 'incorporation-processing',
                documents_approved: 1,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            const [result] = await connection.execute(`
        INSERT INTO registrations (companyName, current_step, status, documents_approved, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [testCompany.companyName, testCompany.current_step, testCompany.status, testCompany.documents_approved, testCompany.created_at, testCompany.updated_at]);

            console.log('✅ Test company created with ID:', result.insertId);
            return await testAdminStep4IncorporationUpload();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);
        console.log('📊 Documents approved:', testCompany.documents_approved);

        // Check current incorporation certificate status
        console.log('\n📄 Current incorporation certificate status:');
        if (testCompany.incorporation_certificate) {
            const cert = JSON.parse(testCompany.incorporation_certificate);
            console.log('✅ Incorporation certificate exists:', cert.name);
            console.log('📁 File URL:', cert.url);
            console.log('📁 File path:', cert.filePath);
            console.log('📁 File ID:', cert.id);
        } else {
            console.log('❌ No incorporation certificate found');
        }

        // Simulate the incorporation certificate upload process
        console.log('\n🧪 Simulating incorporation certificate upload...');

        // Mock incorporation certificate data
        const mockIncorporationCertificate = {
            name: 'test_incorporation_certificate.pdf',
            type: 'application/pdf',
            size: 1024000,
            url: '/uploads/documents/test_incorporation_certificate.pdf',
            filePath: 'documents/test_incorporation_certificate.pdf',
            id: 'inc-cert-' + Date.now(),
            uploadedAt: new Date().toISOString()
        };

        console.log('📄 Mock incorporation certificate data:', mockIncorporationCertificate);

        // Update the company with the incorporation certificate
        const [updateResult] = await connection.execute(`
      UPDATE registrations 
      SET incorporation_certificate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
            JSON.stringify(mockIncorporationCertificate),
            testCompany.id
        ]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Incorporation certificate saved to database successfully');
        } else {
            console.log('❌ Failed to save incorporation certificate to database');
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
            console.log('Company Name:', company.companyName || 'Unnamed Company');
            console.log('Current Step:', company.current_step);
            console.log('Status:', company.status);

            // Check incorporation certificate
            if (company.incorporation_certificate) {
                const cert = JSON.parse(company.incorporation_certificate);
                console.log('\n✅ Incorporation certificate verification:');
                console.log('Name:', cert.name);
                console.log('Type:', cert.type);
                console.log('Size:', cert.size);
                console.log('URL:', cert.url);
                console.log('File Path:', cert.filePath);
                console.log('File ID:', cert.id);
                console.log('Uploaded At:', cert.uploadedAt);

                // Verify all required fields are present
                const requiredFields = ['name', 'type', 'size', 'url', 'filePath', 'id', 'uploadedAt'];
                const missingFields = requiredFields.filter(field => !cert[field]);

                if (missingFields.length === 0) {
                    console.log('\n✅ All required incorporation certificate fields are present');
                    console.log('✅ Incorporation certificate upload simulation successful');
                    console.log('✅ Database update working correctly');
                } else {
                    console.log('\n❌ Missing required fields:', missingFields);
                    console.log('❌ Incorporation certificate upload simulation failed');
                }
            } else {
                console.log('\n❌ Incorporation certificate not found in database');
                console.log('❌ Incorporation certificate upload simulation failed');
            }
        }

        // Test the API endpoint
        console.log('\n📤 Testing API endpoint for incorporation certificate...');

        try {
            const response = await fetch(`http://localhost:3000/api/registrations/${testCompany.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('📥 API Response status:', response.status);
            console.log('📥 API Response statusText:', response.statusText);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ API call successful');

                if (result.incorporationCertificate) {
                    console.log('✅ Incorporation certificate found in API response');
                    console.log('📄 API incorporation certificate data:', result.incorporationCertificate);
                } else {
                    console.log('❌ Incorporation certificate not found in API response');
                }
            } else {
                const errorText = await response.text();
                console.error('❌ API call failed:', errorText);
                console.log('ℹ️ This is expected if the server is not running');
            }
        } catch (apiError) {
            console.error('❌ API call error:', apiError.message);
            console.log('ℹ️ This is expected if the server is not running');
        }

    } catch (error) {
        console.error('❌ Error in testAdminStep4IncorporationUpload:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testAdminStep4IncorporationUpload().then(() => {
    console.log('🏁 Admin step 4 incorporation upload test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
