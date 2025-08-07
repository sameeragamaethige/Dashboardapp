const fs = require('fs');
const path = require('path');

// Test admin step3 immediate document upload
async function testAdminStep3ImmediateUpload() {
    console.log('🧪 Testing Admin Step3 Immediate Document Upload...\n');

    try {
        // First, create a test company registration
        console.log('📝 Step 1: Creating test company registration...');
        const testCompany = {
            companyNameEnglish: 'Test Company for Immediate Upload',
            customerName: 'Test Customer',
            contactPersonEmail: 'test@example.com',
            contactPersonPhone: '1234567890',
            status: 'pending_payment',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const createResponse = await fetch('http://localhost:3000/api/registrations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCompany)
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create test company: ${createResponse.statusText}`);
        }

        const createdCompany = await createResponse.json();
        const companyId = createdCompany.id || createdCompany._id;
        console.log('✅ Test company created:', companyId);

        // Test uploading Form 1 document
        console.log('\n📁 Step 2: Testing Form 1 immediate upload...');
        const form1Content = 'This is a test Form 1 document for immediate upload.';
        const form1FormData = new FormData();
        form1FormData.append('file', new Blob([form1Content], { type: 'application/pdf' }), 'test-form1.pdf');

        const form1Response = await fetch(`http://localhost:3000/api/upload`, {
            method: 'POST',
            body: form1FormData
        });

        if (!form1Response.ok) {
            throw new Error(`Failed to upload Form 1: ${form1Response.statusText}`);
        }

        const form1Result = await form1Response.json();
        console.log('✅ Form 1 uploaded to file storage:', form1Result);

        // Update company with Form 1 document
        const updateForm1Response = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                form1: {
                    name: 'test-form1.pdf',
                    type: 'application/pdf',
                    size: form1Content.length,
                    url: form1Result.file.url,
                    filePath: form1Result.file.filePath,
                    id: form1Result.file.id,
                    uploadedAt: form1Result.file.uploadedAt,
                },
                updatedAt: new Date().toISOString()
            })
        });

        if (!updateForm1Response.ok) {
            throw new Error(`Failed to update company with Form 1: ${updateForm1Response.statusText}`);
        }

        console.log('✅ Form 1 saved to database');

        // Test uploading Letter of Engagement
        console.log('\n📁 Step 3: Testing Letter of Engagement immediate upload...');
        const letterContent = 'This is a test Letter of Engagement for immediate upload.';
        const letterFormData = new FormData();
        letterFormData.append('file', new Blob([letterContent], { type: 'text/plain' }), 'test-letter.txt');

        const letterResponse = await fetch(`http://localhost:3000/api/upload`, {
            method: 'POST',
            body: letterFormData
        });

        if (!letterResponse.ok) {
            throw new Error(`Failed to upload Letter: ${letterResponse.statusText}`);
        }

        const letterResult = await letterResponse.json();
        console.log('✅ Letter uploaded to file storage:', letterResult);

        // Update company with Letter document
        const updateLetterResponse = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                letterOfEngagement: {
                    name: 'test-letter.txt',
                    type: 'text/plain',
                    size: letterContent.length,
                    url: letterResult.file.url,
                    filePath: letterResult.file.filePath,
                    id: letterResult.file.id,
                    uploadedAt: letterResult.file.uploadedAt,
                },
                updatedAt: new Date().toISOString()
            })
        });

        if (!updateLetterResponse.ok) {
            throw new Error(`Failed to update company with Letter: ${updateLetterResponse.statusText}`);
        }

        console.log('✅ Letter saved to database');

        // Test uploading AOA
        console.log('\n📁 Step 4: Testing AOA immediate upload...');
        const aoaContent = 'This is a test Articles of Association for immediate upload.';
        const aoaFormData = new FormData();
        aoaFormData.append('file', new Blob([aoaContent], { type: 'text/plain' }), 'test-aoa.txt');

        const aoaResponse = await fetch(`http://localhost:3000/api/upload`, {
            method: 'POST',
            body: aoaFormData
        });

        if (!aoaResponse.ok) {
            throw new Error(`Failed to upload AOA: ${aoaResponse.statusText}`);
        }

        const aoaResult = await aoaResponse.json();
        console.log('✅ AOA uploaded to file storage:', aoaResult);

        // Update company with AOA document
        const updateAoaResponse = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aoa: {
                    name: 'test-aoa.txt',
                    type: 'text/plain',
                    size: aoaContent.length,
                    url: aoaResult.file.url,
                    filePath: aoaResult.file.filePath,
                    id: aoaResult.file.id,
                    uploadedAt: aoaResult.file.uploadedAt,
                },
                updatedAt: new Date().toISOString()
            })
        });

        if (!updateAoaResponse.ok) {
            throw new Error(`Failed to update company with AOA: ${updateAoaResponse.statusText}`);
        }

        console.log('✅ AOA saved to database');

        // Test uploading Form 18 for directors
        console.log('\n📁 Step 5: Testing Form 18 immediate upload...');
        const directors = [
            { name: 'Director 1', fullName: 'Director One' },
            { name: 'Director 2', fullName: 'Director Two' }
        ];

        const form18Array = [];
        for (let i = 0; i < directors.length; i++) {
            const form18Content = `This is Form 18 for ${directors[i].name} - immediate upload test.`;
            const form18FormData = new FormData();
            form18FormData.append('file', new Blob([form18Content], { type: 'text/plain' }), `test-form18-director${i + 1}.txt`);

            const form18Response = await fetch(`http://localhost:3000/api/upload`, {
                method: 'POST',
                body: form18FormData
            });

            if (!form18Response.ok) {
                throw new Error(`Failed to upload Form 18 for director ${i + 1}: ${form18Response.statusText}`);
            }

            const form18Result = await form18Response.json();
            console.log(`✅ Form 18 for director ${i + 1} uploaded to file storage:`, form18Result);

            form18Array.push({
                name: `test-form18-director${i + 1}.txt`,
                type: 'text/plain',
                size: form18Content.length,
                url: form18Result.file.url,
                filePath: form18Result.file.filePath,
                id: form18Result.file.id,
                uploadedAt: form18Result.file.uploadedAt,
            });
        }

        // Update company with Form 18 documents
        const updateForm18Response = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                form18: form18Array,
                directors: directors,
                updatedAt: new Date().toISOString()
            })
        });

        if (!updateForm18Response.ok) {
            throw new Error(`Failed to update company with Form 18: ${updateForm18Response.statusText}`);
        }

        console.log('✅ Form 18 documents saved to database');

        // Verify all documents are saved
        console.log('\n📋 Step 6: Verifying all documents are saved...');
        const verifyResponse = await fetch(`http://localhost:3000/api/registrations/${companyId}`);

        if (!verifyResponse.ok) {
            throw new Error(`Failed to fetch company data: ${verifyResponse.statusText}`);
        }

        const companyData = await verifyResponse.json();
        console.log('✅ Company data retrieved successfully');

        // Check if all documents are present
        const documents = {
            form1: companyData.form1,
            letterOfEngagement: companyData.letterOfEngagement,
            aoa: companyData.aoa,
            form18: companyData.form18
        };

        console.log('\n📊 Document Status:');
        console.log(`Form 1: ${documents.form1 ? '✅ Uploaded' : '❌ Missing'}`);
        console.log(`Letter of Engagement: ${documents.letterOfEngagement ? '✅ Uploaded' : '❌ Missing'}`);
        console.log(`AOA: ${documents.aoa ? '✅ Uploaded' : '❌ Missing'}`);
        console.log(`Form 18: ${documents.form18 && documents.form18.length > 0 ? `✅ Uploaded (${documents.form18.length} directors)` : '❌ Missing'}`);

        // Check file storage
        console.log('\n📁 File Storage Verification:');
        for (const [docType, doc] of Object.entries(documents)) {
            if (doc) {
                if (Array.isArray(doc)) {
                    doc.forEach((d, index) => {
                        console.log(`${docType}[${index}]: ${d.name} - ${d.url}`);
                    });
                } else {
                    console.log(`${docType}: ${doc.name} - ${doc.url}`);
                }
            }
        }

        console.log('\n🎉 Admin Step3 Immediate Upload Test Completed Successfully!');
        console.log(`📝 Test Company ID: ${companyId}`);

    } catch (error) {
        console.error('💥 Test failed:', error);
        throw error;
    }
}

// Run the test
testAdminStep3ImmediateUpload()
    .then(() => {
        console.log('✅ All tests completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
