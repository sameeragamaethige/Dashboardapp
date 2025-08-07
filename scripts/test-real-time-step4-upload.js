const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testRealTimeStep4Upload() {
    let connection;

    try {
        console.log('🔍 Real-time monitoring of step 4 additional documents upload...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company that's ready for step 4
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'incorporate' 
      OR status = 'incorporation-processing'
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found ready for step 4. Creating a test company...');

            // Create a test company ready for step 4
            const testCompany = {
                companyName: 'Real-Time Test Company',
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
            return await testRealTimeStep4Upload();
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);

        // Check initial state
        console.log('\n📄 Initial step 4 additional documents status:');
        if (testCompany.step4_final_additional_doc) {
            const docs = JSON.parse(testCompany.step4_final_additional_doc);
            console.log('✅ Step 4 additional documents exist:', docs.length, 'documents');
            docs.forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
            });
        } else {
            console.log('❌ No step 4 additional documents found');
        }

        // Monitor for changes
        console.log('\n🔄 Starting real-time monitoring...');
        console.log('📝 Instructions:');
        console.log('1. Go to the admin interface');
        console.log('2. Navigate to step 4 for this company');
        console.log('3. Try to upload an additional document');
        console.log('4. Watch this console for real-time updates');
        console.log('5. Press Ctrl+C to stop monitoring');

        let lastCheck = Date.now();
        let checkCount = 0;

        const monitorInterval = setInterval(async () => {
            try {
                checkCount++;
                console.log(`\n🔍 Check #${checkCount} - ${new Date().toLocaleTimeString()}`);

                // Check current state
                const [currentCompany] = await connection.execute(`
          SELECT * FROM registrations WHERE id = ?
        `, [testCompany.id]);

                if (currentCompany.length > 0) {
                    const company = currentCompany[0];
                    const lastModified = new Date(company.updated_at).getTime();

                    if (lastModified > lastCheck) {
                        console.log('🔄 Database was updated!');
                        lastCheck = lastModified;
                    }

                    // Check step 4 additional documents
                    if (company.step4_final_additional_doc) {
                        const docs = JSON.parse(company.step4_final_additional_doc);
                        console.log(`📄 Step 4 additional documents: ${docs.length} documents`);
                        docs.forEach((doc, index) => {
                            console.log(`   ${index + 1}. ${doc.title}: ${doc.name} (${doc.uploadedAt})`);
                        });
                    } else {
                        console.log('📄 Step 4 additional documents: None');
                    }

                    // Check if there are any recent uploads (within last 30 seconds)
                    const thirtySecondsAgo = Date.now() - 30000;
                    if (company.step4_final_additional_doc) {
                        const docs = JSON.parse(company.step4_final_additional_doc);
                        const recentDocs = docs.filter(doc => {
                            const uploadTime = new Date(doc.uploadedAt).getTime();
                            return uploadTime > thirtySecondsAgo;
                        });

                        if (recentDocs.length > 0) {
                            console.log('🎉 Recent uploads detected!');
                            recentDocs.forEach((doc, index) => {
                                console.log(`   🆕 ${doc.title}: ${doc.name}`);
                            });
                        }
                    }
                }

            } catch (error) {
                console.error('❌ Error during monitoring:', error);
            }
        }, 2000); // Check every 2 seconds

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping monitoring...');
            clearInterval(monitorInterval);
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error in testRealTimeStep4Upload:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testRealTimeStep4Upload().then(() => {
    console.log('🏁 Real-time monitoring finished');
}).catch((error) => {
    console.error('💥 Real-time test failed:', error);
    process.exit(1);
});
