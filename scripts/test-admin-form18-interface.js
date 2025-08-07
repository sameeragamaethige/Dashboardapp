const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

// Simulate the handleDocumentUpload function logic
async function simulateHandleDocumentUpload(companyId, documentType, file, index) {
    let connection;

    try {
        console.log(`📁 Simulating admin interface upload: ${documentType}, file: ${file.name}, index: ${index}`);

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);

        // Get current company data
        const [companies] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [companyId]);

        if (companies.length === 0) {
            throw new Error('Company not found');
        }

        const selectedCompany = companies[0];
        console.log('📋 Current company data loaded');

        // Simulate file upload to storage (mock)
        const mockUploadResult = {
            success: true,
            file: {
                url: `/uploads/documents/${file.name}`,
                filePath: `documents/${file.name}`,
                id: `doc_${Date.now()}`,
                uploadedAt: new Date().toISOString()
            }
        };

        console.log('✅ File upload to storage simulated');

        // Create document object with file storage data
        const document = {
            name: file.name,
            type: file.type,
            size: file.size,
            url: mockUploadResult.file.url,
            filePath: mockUploadResult.file.filePath,
            id: mockUploadResult.file.id,
            uploadedAt: mockUploadResult.file.uploadedAt,
        };

        console.log('📄 Document object created:', document);

        // Simulate local state update (like setSelectedCompany)
        let updatedCompany = { ...selectedCompany };

        if (documentType === "form18" && typeof index === "number") {
            console.log('🔄 Updating Form 18 array at index:', index);

            // Get current Form 18 array
            const currentForm18 = selectedCompany.form18 ? JSON.parse(selectedCompany.form18) : [];
            console.log('📄 Current Form 18 array:', currentForm18);

            // Ensure array has enough elements
            while (currentForm18.length <= index) {
                currentForm18.push(null);
            }

            // Update the specific index
            currentForm18[index] = document;
            updatedCompany.form18 = JSON.stringify(currentForm18);

            console.log('📄 Updated Form 18 array:', currentForm18);
        } else {
            console.log('🔄 Updating single document:', documentType);
            updatedCompany[documentType] = JSON.stringify(document);
        }

        // Update timestamp
        updatedCompany.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Save to database
        const updateFields = [];
        const updateValues = [];

        if (documentType === "form18" && typeof index === "number") {
            updateFields.push('form18 = ?');
            updateValues.push(updatedCompany.form18);
        } else {
            updateFields.push(`${documentType} = ?`);
            updateValues.push(updatedCompany[documentType]);
        }

        updateFields.push('updated_at = ?');
        updateValues.push(updatedCompany.updated_at);
        updateValues.push(companyId);

        const updateQuery = `
      UPDATE registrations 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

        console.log('📝 Executing database update:', updateQuery);
        console.log('📝 Update values:', updateValues);

        const [updateResult] = await connection.execute(updateQuery, updateValues);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Database update successful');
        } else {
            throw new Error('Database update failed');
        }

        // Verify the update
        const [updatedCompanies] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [companyId]);

        if (updatedCompanies.length > 0) {
            const updatedCompanyData = updatedCompanies[0];
            console.log('\n📋 Verification - Updated company data:');
            console.log('Company ID:', updatedCompanyData.id);

            if (documentType === "form18") {
                const form18Array = JSON.parse(updatedCompanyData.form18 || '[]');
                console.log('📄 Form 18 array after update:', form18Array);
                console.log(`📄 Form 18 at index ${index}:`, form18Array[index]);

                if (form18Array[index] && form18Array[index].name === file.name) {
                    console.log('✅ Form 18 document saved correctly!');
                    return true;
                } else {
                    console.log('❌ Form 18 document not saved correctly!');
                    return false;
                }
            } else {
                const savedDocument = JSON.parse(updatedCompanyData[documentType] || '{}');
                console.log(`📄 ${documentType} after update:`, savedDocument);

                if (savedDocument.name === file.name) {
                    console.log(`✅ ${documentType} document saved correctly!`);
                    return true;
                } else {
                    console.log(`❌ ${documentType} document not saved correctly!`);
                    return false;
                }
            }
        }

    } catch (error) {
        console.error('❌ Error in simulateHandleDocumentUpload:', error);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function testAdminInterfaceUpload() {
    try {
        console.log('🔍 Testing admin interface Form 18 upload simulation...');

        // Find a test company
        let connection = await mysql.createConnection(DB_CONFIG);

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
        console.log('👥 Directors:', JSON.parse(testCompany.directors || '[]'));

        await connection.end();

        const directors = JSON.parse(testCompany.directors || '[]');

        // Test Form 18 upload for each director
        for (let i = 0; i < directors.length; i++) {
            console.log(`\n📤 Testing Form 18 upload for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`}...`);

            const mockFile = {
                name: `form18_${directors[i].name || directors[i].fullName || `director_${i + 1}`}.pdf`,
                type: 'application/pdf',
                size: 1024000 + (i * 1000)
            };

            const success = await simulateHandleDocumentUpload(
                testCompany.id,
                "form18",
                mockFile,
                i
            );

            if (success) {
                console.log(`✅ Form 18 upload for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`} successful`);
            } else {
                console.log(`❌ Form 18 upload for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`} failed`);
            }

            // Small delay between uploads
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Final verification
        connection = await mysql.createConnection(DB_CONFIG);
        const [finalCompany] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [testCompany.id]);

        if (finalCompany.length > 0) {
            const company = finalCompany[0];
            const form18Array = JSON.parse(company.form18 || '[]');

            console.log('\n📋 Final verification:');
            console.log('Form 18 array length:', form18Array.length);
            console.log('Expected length:', directors.length);

            form18Array.forEach((doc, index) => {
                const directorName = directors[index]?.name || directors[index]?.fullName || `Director ${index + 1}`;
                if (doc) {
                    console.log(`  ✅ ${directorName}: ${doc.name}`);
                } else {
                    console.log(`  ❌ ${directorName}: No document`);
                }
            });

            const allUploaded = form18Array.length === directors.length && form18Array.every(doc => doc !== null);

            if (allUploaded) {
                console.log('\n✅ All Form 18 documents uploaded successfully!');
            } else {
                console.log('\n❌ Some Form 18 documents failed to upload!');
            }
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Error in testAdminInterfaceUpload:', error);
    }
}

// Run the test
testAdminInterfaceUpload().then(() => {
    console.log('🏁 Admin interface Form 18 upload test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
