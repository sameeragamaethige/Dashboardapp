const fs = require('fs');
const path = require('path');

// Simple test for file upload
async function testSimpleUpload() {
    console.log('🧪 Testing simple file upload...\n');

    try {
        // Create a simple text file
        const testContent = 'This is a test document template.';
        const testFilePath = path.join(__dirname, 'test-simple.txt');
        fs.writeFileSync(testFilePath, testContent);

        console.log('📁 Created test file:', testFilePath);

        // Test upload to the main upload API
        const formData = new FormData();
        formData.append('file', new Blob([testContent], { type: 'text/plain' }), 'test-simple.txt');
        formData.append('uploadedBy', 'admin-test');

        console.log('📤 Uploading to /api/upload...');
        const uploadResponse = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        console.log('Upload Status:', uploadResponse.status);
        console.log('Upload Response:', await uploadResponse.text());

        // Clean up
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Run the test
testSimpleUpload()
    .then(() => {
        console.log('✅ Simple upload test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Simple upload test failed:', error);
        process.exit(1);
    }); 