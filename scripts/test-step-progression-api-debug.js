const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

async function testStepProgressionAPIDebug() {
    let connection;

    try {
        console.log('🔍 Testing step progression API debug...');

        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database successfully');

        // Find a test company
        const [companies] = await connection.execute(`
      SELECT * FROM registrations 
      WHERE current_step = 'documentation' 
      LIMIT 1
    `);

        if (companies.length === 0) {
            console.log('❌ No companies found in step 3');
            return;
        }

        const testCompany = companies[0];
        console.log('📋 Found test company:', testCompany.id);
        console.log('📊 Current step:', testCompany.current_step);
        console.log('📊 Current status:', testCompany.status);

        // Check if documents_acknowledged column exists
        console.log('\n🔍 Checking database schema...');
        const [columns] = await connection.execute(`
      DESCRIBE registrations
    `);

        const columnNames = columns.map(col => col.Field);
        console.log('📄 Available columns:', columnNames);

        const hasDocumentsAcknowledged = columnNames.includes('documents_acknowledged');
        console.log('📄 Has documents_acknowledged column:', hasDocumentsAcknowledged);

        // Simulate the exact data that would be sent to the API
        const stepProgressionData = {
            currentStep: 'incorporate',
            status: 'incorporation-processing',
            documentsAcknowledged: true,
            customerDocuments: {
                form1: {
                    name: 'signed_form1.pdf',
                    type: 'application/pdf',
                    size: 1024000,
                    url: '/uploads/documents/signed_form1.pdf',
                    signedByCustomer: true,
                    submittedAt: new Date().toISOString()
                }
            }
        };

        console.log('\n📄 Step progression data to be sent:');
        console.log(JSON.stringify(stepProgressionData, null, 2));

        // Check what fields the API expects vs what we're sending
        console.log('\n🔍 API field mapping analysis:');

        const apiExpectedFields = [
            'companyName', 'contactPersonName', 'contactPersonEmail', 'contactPersonPhone',
            'selectedPackage', 'paymentMethod', 'currentStep', 'status', 'paymentApproved',
            'detailsApproved', 'documentsApproved', 'documentsPublished', 'paymentReceipt',
            'balancePaymentReceipt', 'form1', 'letterOfEngagement', 'aoa', 'form18',
            'addressProof', 'customerDocuments', 'incorporationCertificate',
            'step3AdditionalDoc', 'step3SignedAdditionalDoc', 'companyNameEnglish',
            'companyNameSinhala', 'isForeignOwned', 'businessAddressNumber',
            'businessAddressStreet', 'businessAddressCity', 'postalCode', 'sharePrice',
            'numberOfShareholders', 'shareholders', 'makeSimpleBooksSecretary',
            'numberOfDirectors', 'directors', 'importExportStatus', 'importsToAdd',
            'exportsToAdd', 'otherBusinessActivities', 'dramaSedakaDivision',
            'businessEmail', 'businessContactNumber'
        ];

        console.log('📄 API expected fields:', apiExpectedFields);
        console.log('📄 Fields we are sending:', Object.keys(stepProgressionData));

        const missingFields = apiExpectedFields.filter(field => !(field in stepProgressionData));
        const extraFields = Object.keys(stepProgressionData).filter(field => !apiExpectedFields.includes(field));

        console.log('📄 Missing fields (will be set to null):', missingFields);
        console.log('📄 Extra fields (will be ignored):', extraFields);

        // Test the actual database update that the API would perform
        console.log('\n🧪 Testing database update directly...');

        try {
            const [updateResult] = await connection.execute(`
        UPDATE registrations 
        SET current_step = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
                stepProgressionData.currentStep,
                stepProgressionData.status,
                testCompany.id
            ]);

            if (updateResult.affectedRows > 0) {
                console.log('✅ Direct database update successful');
            } else {
                console.log('❌ Direct database update failed');
            }
        } catch (dbError) {
            console.error('❌ Direct database update error:', dbError.message);
        }

        // Check if we need to add the documents_acknowledged column
        if (!hasDocumentsAcknowledged) {
            console.log('\n⚠️ documents_acknowledged column missing. Adding it...');

            try {
                await connection.execute(`
          ALTER TABLE registrations 
          ADD COLUMN documents_acknowledged BOOLEAN DEFAULT FALSE
        `);
                console.log('✅ Added documents_acknowledged column');
            } catch (alterError) {
                console.error('❌ Error adding documents_acknowledged column:', alterError.message);
            }
        }

        // Test update with documents_acknowledged
        if (hasDocumentsAcknowledged || columnNames.includes('documents_acknowledged')) {
            console.log('\n🧪 Testing update with documents_acknowledged...');

            try {
                const [updateResult] = await connection.execute(`
          UPDATE registrations 
          SET current_step = ?, status = ?, documents_acknowledged = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
                    stepProgressionData.currentStep,
                    stepProgressionData.status,
                    stepProgressionData.documentsAcknowledged,
                    testCompany.id
                ]);

                if (updateResult.affectedRows > 0) {
                    console.log('✅ Update with documents_acknowledged successful');
                } else {
                    console.log('❌ Update with documents_acknowledged failed');
                }
            } catch (dbError) {
                console.error('❌ Update with documents_acknowledged error:', dbError.message);
            }
        }

        // Verify the update
        const [updatedCompany] = await connection.execute(`
      SELECT * FROM registrations WHERE id = ?
    `, [testCompany.id]);

        if (updatedCompany.length > 0) {
            const company = updatedCompany[0];
            console.log('\n📋 Final verification:');
            console.log('Current Step:', company.current_step);
            console.log('Status:', company.status);
            if (hasDocumentsAcknowledged) {
                console.log('Documents Acknowledged:', company.documents_acknowledged);
            }
        }

    } catch (error) {
        console.error('❌ Error in testStepProgressionAPIDebug:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testStepProgressionAPIDebug().then(() => {
    console.log('🏁 Step progression API debug test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
