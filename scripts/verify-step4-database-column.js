const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function verifyStep4DatabaseColumn() {
    let connection;

    try {
        console.log('🔍 Verifying step4_final_additional_doc database column...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Check if the column exists
        console.log('\n📋 Checking column existence...');
        const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'registrations'
      AND COLUMN_NAME = 'step4_final_additional_doc'
    `, [DB_CONFIG.database]);

        if (columns.length > 0) {
            const column = columns[0];
            console.log('✅ Column step4_final_additional_doc exists:');
            console.log('   - Data Type:', column.DATA_TYPE);
            console.log('   - Nullable:', column.IS_NULLABLE);
            console.log('   - Default:', column.COLUMN_DEFAULT);
        } else {
            console.log('❌ Column step4_final_additional_doc does not exist');
            console.log('📝 Creating the column...');

            // Create the column
            await connection.execute(`
        ALTER TABLE registrations 
        ADD COLUMN step4_final_additional_doc JSON NULL
      `);

            console.log('✅ Column step4_final_additional_doc created successfully');
        }

        // Test inserting data into the column
        console.log('\n🧪 Testing data insertion...');

        // Find a test company
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'incorporate' 
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No step 4 companies found. Creating a test company...');

            const testCompany = {
                companyName: 'Database Test Company',
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
            return await verifyStep4DatabaseColumn();
        }

        const testCompany = companies[0];
        console.log('📋 Using test company:', testCompany.companyName || 'Unnamed Company');
        console.log('📊 Company ID:', testCompany.id);

        // Test document data
        const testDocument = {
            name: 'test_document.pdf',
            type: 'application/pdf',
            size: 1024000,
            title: 'Test Document',
            url: '/uploads/documents/test_document.pdf',
            filePath: 'documents/test_document.pdf',
            id: 'test-doc-' + Date.now(),
            uploadedAt: new Date().toISOString()
        };

        console.log('📄 Test document:', testDocument);

        // Get existing documents
        const existingDocs = testCompany.step4_final_additional_doc
            ? JSON.parse(testCompany.step4_final_additional_doc)
            : [];

        // Add new document
        const updatedDocs = [...existingDocs, testDocument];

        console.log('📄 Updated documents array:', updatedDocs);

        // Update the database
        console.log('📝 Updating database...');
        const [updateResult] = await connection.execute(`
      UPDATE registrations 
      SET step4_final_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
            JSON.stringify(updatedDocs),
            testCompany.id
        ]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Database update successful');
        } else {
            console.log('❌ Database update failed');
            return;
        }

        // Verify the update
        console.log('\n📋 Verifying the update...');
        const [updatedCompany] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [testCompany.id]);

        if (updatedCompany.length > 0) {
            const company = updatedCompany[0];
            console.log('✅ Verification successful');

            if (company.step4_final_additional_doc) {
                const docs = JSON.parse(company.step4_final_additional_doc);
                console.log('📄 Documents in database:', docs.length, 'documents');
                docs.forEach((doc, index) => {
                    console.log(`   ${index + 1}. ${doc.title}: ${doc.name}`);
                });

                // Check if our test document is there
                const testDocFound = docs.find(doc => doc.title === 'Test Document');
                if (testDocFound) {
                    console.log('🎉 SUCCESS: Test document found in database!');
                    console.log('📄 Found document:', testDocFound);
                } else {
                    console.log('❌ FAILED: Test document not found in database');
                }
            } else {
                console.log('❌ No documents found in database');
            }
        }

        // Show all step 4 companies with their documents
        console.log('\n📊 All Step 4 Companies with Documents:');
        console.log('='.repeat(60));

        const [allStep4Companies] = await connection.execute(`
      SELECT id, company_name, current_step, status, step4_final_additional_doc
      FROM registrations 
      WHERE current_step = 'incorporate'
      ORDER BY created_at DESC
    `);

        allStep4Companies.forEach((company, index) => {
            console.log(`\n${index + 1}. ${company.company_name || 'Unnamed Company'} (${company.id})`);
            console.log(`   Step: ${company.current_step}, Status: ${company.status}`);

            if (company.step4_final_additional_doc) {
                const docs = JSON.parse(company.step4_final_additional_doc);
                console.log(`   Documents: ${docs.length} documents`);
                docs.forEach((doc, docIndex) => {
                    console.log(`     ${docIndex + 1}. ${doc.title}: ${doc.name}`);
                });
            } else {
                console.log(`   Documents: None`);
            }
        });

    } catch (error) {
        console.error('❌ Error verifying step4 database column:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the verification
verifyStep4DatabaseColumn().then(() => {
    console.log('🏁 Step 4 database column verification finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
});
