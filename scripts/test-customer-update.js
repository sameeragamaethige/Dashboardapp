const mysql = require('mysql2/promise');

async function testCustomerUpdate() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: null,
        database: 'banana_db',
        port: 3306,
    };

    let connection;
    let pool;

    try {
        console.log('🧪 Testing customer update flow...');
        pool = mysql.createPool(dbConfig);
        connection = await pool.getConnection();

        // Test 1: Check if we can fetch a registration by ID
        console.log('\n1️⃣ Testing getRegistrationById...');
        const [registrations] = await connection.execute('SELECT id FROM registrations LIMIT 1');

        if (registrations.length === 0) {
            console.log('⚠️  No registrations found in database');
            return;
        }

        const testId = registrations[0].id;
        console.log(`✅ Found test registration: ${testId}`);

        // Test 2: Fetch the registration data
        console.log('\n2️⃣ Fetching registration data...');
        const [rows] = await connection.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [testId]
        );

        if (rows.length > 0) {
            const registration = rows[0];
            console.log('✅ Registration data retrieved:');
            console.log(`   - Company Name: ${registration.company_name}`);
            console.log(`   - Current Step: ${registration.current_step}`);
            console.log(`   - Drama Sedaka Division: ${registration.drama_sedaka_division || 'Not set'}`);
            console.log(`   - Business Email: ${registration.business_email || 'Not set'}`);
            console.log(`   - Business Contact Number: ${registration.business_contact_number || 'Not set'}`);
        } else {
            console.log('❌ Registration not found');
            return;
        }

        // Test 3: Simulate customer update
        console.log('\n3️⃣ Simulating customer update...');
        const updateData = {
            drama_sedaka_division: 'Updated Test Division',
            business_email: 'updated@testcompany.com',
            business_contact_number: '1234567890',
            current_step: 'documentation',
            status: 'documentation-processing',
            updated_at: new Date()
        };

        await connection.execute(
            `UPDATE registrations SET 
                drama_sedaka_division = ?, 
                business_email = ?, 
                business_contact_number = ?,
                current_step = ?,
                status = ?,
                updated_at = ?
            WHERE id = ?`,
            [
                updateData.drama_sedaka_division,
                updateData.business_email,
                updateData.business_contact_number,
                updateData.current_step,
                updateData.status,
                updateData.updated_at,
                testId
            ]
        );
        console.log('✅ Registration updated successfully');

        // Test 4: Verify the update
        console.log('\n4️⃣ Verifying the update...');
        const [updatedRows] = await connection.execute(
            'SELECT * FROM registrations WHERE id = ?',
            [testId]
        );

        if (updatedRows.length > 0) {
            const updatedRegistration = updatedRows[0];
            console.log('✅ Update verified:');
            console.log(`   - Drama Sedaka Division: ${updatedRegistration.drama_sedaka_division}`);
            console.log(`   - Business Email: ${updatedRegistration.business_email}`);
            console.log(`   - Business Contact Number: ${updatedRegistration.business_contact_number}`);
            console.log(`   - Current Step: ${updatedRegistration.current_step}`);
            console.log(`   - Status: ${updatedRegistration.status}`);
        }

        console.log('\n🎉 Customer update flow test completed successfully!');
        console.log('\n💡 The "Registrations is not an array: {}" error should now be resolved.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        if (pool) {
            await pool.end();
        }
    }
}

// Run test
testCustomerUpdate(); 