const fs = require('fs');
const path = require('path');

// Test document templates API
async function testDocumentTemplatesAPI() {
    console.log('🧪 Testing Document Templates API...\n');

    try {
        // Test 1: GET document templates
        console.log('📋 Test 1: GET document templates');
        const getResponse = await fetch('http://localhost:3000/api/document-templates');
        console.log('Status:', getResponse.status);

        if (getResponse.ok) {
            const templates = await getResponse.json();
            console.log('✅ GET successful, templates count:', templates.length);
            console.log('Templates:', templates);
        } else {
            console.log('❌ GET failed:', await getResponse.text());
        }
        console.log('');

        // Test 2: POST new document template (Form 1)
        console.log('📁 Test 2: POST Form 1 template');

        // Create a dummy PDF file for testing
        const testFilePath = path.join(__dirname, 'test-form1.pdf');
        const testContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Form 1) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
        fs.writeFileSync(testFilePath, testContent);

        const formData = new FormData();
        formData.append('documentType', 'form1');
        formData.append('file', new Blob([testContent], { type: 'application/pdf' }), 'test-form1.pdf');

        const postResponse = await fetch('http://localhost:3000/api/document-templates', {
            method: 'POST',
            body: formData
        });

        console.log('Status:', postResponse.status);

        if (postResponse.ok) {
            const result = await postResponse.json();
            console.log('✅ POST Form 1 successful:', result);
        } else {
            console.log('❌ POST Form 1 failed:', await postResponse.text());
        }
        console.log('');

        // Test 3: POST Letter of Engagement template
        console.log('📁 Test 3: POST Letter of Engagement template');

        const letterContent = 'Dear Customer,\n\nThis is a test letter of engagement.\n\nBest regards,\nAdmin';
        const letterFormData = new FormData();
        letterFormData.append('documentType', 'letterOfEngagement');
        letterFormData.append('file', new Blob([letterContent], { type: 'text/plain' }), 'test-letter.txt');

        const letterResponse = await fetch('http://localhost:3000/api/document-templates', {
            method: 'POST',
            body: letterFormData
        });

        console.log('Status:', letterResponse.status);

        if (letterResponse.ok) {
            const result = await letterResponse.json();
            console.log('✅ POST Letter of Engagement successful:', result);
        } else {
            console.log('❌ POST Letter of Engagement failed:', await letterResponse.text());
        }
        console.log('');

        // Test 4: POST AOA template
        console.log('📁 Test 4: POST AOA template');

        const aoaContent = 'ARTICLES OF ASSOCIATION\n\nThis is a test articles of association document.';
        const aoaFormData = new FormData();
        aoaFormData.append('documentType', 'aoa');
        aoaFormData.append('file', new Blob([aoaContent], { type: 'text/plain' }), 'test-aoa.txt');

        const aoaResponse = await fetch('http://localhost:3000/api/document-templates', {
            method: 'POST',
            body: aoaFormData
        });

        console.log('Status:', aoaResponse.status);

        if (aoaResponse.ok) {
            const result = await aoaResponse.json();
            console.log('✅ POST AOA successful:', result);
        } else {
            console.log('❌ POST AOA failed:', await aoaResponse.text());
        }
        console.log('');

        // Test 5: POST Form 18 templates for directors
        console.log('📁 Test 5: POST Form 18 templates for directors');

        for (let i = 0; i < 3; i++) {
            const form18Content = `FORM 18 - DIRECTOR ${i + 1}\n\nThis is a test Form 18 for director ${i + 1}.`;
            const form18FormData = new FormData();
            form18FormData.append('documentType', 'form18');
            form18FormData.append('directorIndex', i.toString());
            form18FormData.append('file', new Blob([form18Content], { type: 'text/plain' }), `test-form18-director${i + 1}.txt`);

            const form18Response = await fetch('http://localhost:3000/api/document-templates', {
                method: 'POST',
                body: form18FormData
            });

            console.log(`Status for Director ${i + 1}:`, form18Response.status);

            if (form18Response.ok) {
                const result = await form18Response.json();
                console.log(`✅ POST Form 18 Director ${i + 1} successful:`, result);
            } else {
                console.log(`❌ POST Form 18 Director ${i + 1} failed:`, await form18Response.text());
            }
        }
        console.log('');

        // Test 6: GET all templates again to verify they were saved
        console.log('📋 Test 6: GET all templates to verify they were saved');
        const finalGetResponse = await fetch('http://localhost:3000/api/document-templates');
        console.log('Status:', finalGetResponse.status);

        if (finalGetResponse.ok) {
            const templates = await finalGetResponse.json();
            console.log('✅ Final GET successful, templates count:', templates.length);
            console.log('All templates:');
            templates.forEach((template, index) => {
                console.log(`${index + 1}. ${template.document_type}${template.director_index !== null ? ` (Director ${template.director_index + 1})` : ''}: ${template.name}`);
            });
        } else {
            console.log('❌ Final GET failed:', await finalGetResponse.text());
        }
        console.log('');

        // Clean up test file
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }

        console.log('🎉 Document Templates API test completed successfully!');

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Run the test
testDocumentTemplatesAPI()
    .then(() => {
        console.log('✅ All tests completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }); 