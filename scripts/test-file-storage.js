const fs = require('fs');
const path = require('path');

async function testFileStorage() {
    try {
        console.log('🔍 Testing file storage system...');

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const subdirectories = ['images', 'documents', 'temp'];

        // Check if main uploads directory exists
        if (fs.existsSync(uploadsDir)) {
            console.log('✅ Main uploads directory exists:', uploadsDir);
        } else {
            console.log('❌ Main uploads directory missing:', uploadsDir);
            return;
        }

        // Check subdirectories
        for (const subdir of subdirectories) {
            const subdirPath = path.join(uploadsDir, subdir);
            if (fs.existsSync(subdirPath)) {
                console.log(`✅ ${subdir} directory exists:`, subdirPath);

                // List files in directory
                const files = fs.readdirSync(subdirPath);
                console.log(`   📁 Files in ${subdir}:`, files.length);
                files.forEach(file => {
                    if (file !== '.gitkeep') {
                        const filePath = path.join(subdirPath, file);
                        const stats = fs.statSync(filePath);
                        console.log(`     - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
                    }
                });
            } else {
                console.log(`❌ ${subdir} directory missing:`, subdirPath);
            }
        }

        // Test file permissions
        const testFile = path.join(uploadsDir, 'test-write-permission.txt');
        try {
            fs.writeFileSync(testFile, 'Test content');
            console.log('✅ Write permission test passed');
            fs.unlinkSync(testFile);
            console.log('✅ Delete permission test passed');
        } catch (error) {
            console.log('❌ Permission test failed:', error.message);
        }

        console.log('\n✅ File storage test completed successfully!');
    } catch (error) {
        console.error('❌ Error testing file storage:', error);
    }
}

testFileStorage(); 