const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

// Simulate file upload to storage
async function simulateFileUpload(file, companyId) {
    console.log(`📁 Simulating file upload: ${file.name} for company ${companyId}`);

    // Create a mock upload result
    const uploadResult = {
        success: true,
        file: {
            url: `/uploads/documents/${file.name}`,
            filePath: `documents/${file.name}`,
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            uploadedAt: new Date().toISOString()
        }
    };

    console.log('✅ File upload simulation successful:', uploadResult);
    return uploadResult;
}

// Simulate the complete handleDocumentUpload function
async function simulateHandleDocumentUpload(companyId, documentType, file, index) {
    let connection;

    try {
        console.log(`\n📁 Simulating handleDocumentUpload: ${documentType}, file: ${file.name}, index: ${index}`);

        // Step 1: Upload file to storage
        const uploadResult = await simulateFileUpload(file, companyId);

        if (!uploadResult.success || !uploadResult.file) {
            throw new Error(`Failed to upload file to storage: ${uploadResult.error}`);
        }

        console.log(`✅ File uploaded to storage successfully: ${file.name}`);

        // Step 2: Create document object
        const document = {
            name: file.name,
            type: file.type,
            size: file.size,
            url: uploadResult.file.url,
            filePath: uploadResult.file.filePath,
            id: uploadResult.file.id,
            uploadedAt: uploadResult.file.uploadedAt,
        };

        console.log('📄 Document object created:', document);

        // Step 3: Get current company data
        connection = await mysql.createConnection(DB_CONFIG);
        const [companies] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [companyId]);

        if (companies.length === 0) {
            throw new Error('Company not found');
        }

        const selectedCompany = companies[0];
        console.log('📋 Current company data loaded');

        // Step 4: Prepare update data
        const updateData = {
            ...selectedCompany,
            updated_at: new Date().toISOString()
        };

        // Step 5: Handle Form 18 as an array, other documents as single objects
        if (documentType === "form18" && typeof index === "number") {
            const currentForm18 = selectedCompany.form18 ? JSON.parse(selectedCompany.form18) : [];
            const updatedForm18 = [...currentForm18];
            updatedForm18[index] = document;
            updateData.form18 = updatedForm18;

            console.log('📝 Saving Form 18 to database:', {
                index,
                currentForm18Length: currentForm18.length,
                updatedForm18Length: updatedForm18.length,
                document: document
            });
        } else {
            updateData[documentType] = document;
            console.log('📝 Saving document to database:', {
                documentType,
                document: document
            });
        }

        // Step 6: Send API request (simulate with direct database update)
        console.log('📤 Simulating API request to save document...');

        const updateFields = [];
        const updateValues = [];

        if (documentType === "form18" && typeof index === "number") {
            updateFields.push('form18 = ?');
            updateValues.push(JSON.stringify(updateData.form18));
        } else {
            updateFields.push(`${documentType} = ?`);
            updateValues.push(JSON.stringify(updateData[documentType]));
        }

        updateFields.push('updated_at = ?');
        updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
        updateValues.push(companyId);

        const updateQuery = `
      UPDATE registrations 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

        console.log('📝 Executing database update:', updateQuery);
        console.log('📝 Update values:', updateValues);

        const [updateResult] = await connection.execute(updateQuery, updateValues);

        console.log('📥 Database update response:', {
            affectedRows: updateResult.affectedRows,
            insertId: updateResult.insertId,
            warningStatus: updateResult.warningStatus
        });

        if (updateResult.affectedRows > 0) {
            console.log('✅ Database update successful');
        } else {
            throw new Error('Database update failed - no rows affected');
        }

        // Step 7: Verify the update
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

async function testCompleteForm18Flow() {
    try {
        console.log('🔍 Testing complete admin Form 18 upload flow...');

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
        const results = [];

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

            results.push({
                director: directors[i].name || directors[i].fullName || `Director ${i + 1}`,
                success: success,
                file: mockFile.name
            });

            if (success) {
                console.log(`✅ Form 18 upload for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`} successful`);
            } else {
                console.log(`❌ Form 18 upload for ${directors[i].name || directors[i].fullName || `Director ${i + 1}`} failed`);
            }

            // Small delay between uploads
            await new Promise(resolve => setTimeout(resolve, 300));
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

            console.log('\n📊 Test Results Summary:');
            results.forEach(result => {
                console.log(`  ${result.success ? '✅' : '❌'} ${result.director}: ${result.file}`);
            });

            if (allUploaded) {
                console.log('\n✅ All Form 18 documents uploaded successfully!');
                console.log('🎉 Form 18 upload flow is working correctly!');
            } else {
                console.log('\n❌ Some Form 18 documents failed to upload!');
                console.log('🔧 There may be an issue with the Form 18 upload flow.');
            }
        }

        await connection.end();

    } catch (error) {
        console.error('❌ Error in testCompleteForm18Flow:', error);
    }
}

// Run the test
testCompleteForm18Flow().then(() => {
    console.log('🏁 Complete Form 18 flow test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
