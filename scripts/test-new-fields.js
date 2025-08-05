const mysql = require('mysql2/promise');

async function testNewFields() {
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
        console.log('🧪 Testing new fields in database...');
        pool = mysql.createPool(dbConfig);
        connection = await pool.getConnection();

        // Test 1: Check if new columns exist
        console.log('\n1️⃣ Checking if new columns exist...');
        const [columns] = await connection.execute('DESCRIBE registrations');
        const columnNames = columns.map(col => col.Field);

        const requiredColumns = ['drama_sedaka_division', 'business_email', 'business_contact_number'];
        for (const column of requiredColumns) {
            if (columnNames.includes(column)) {
                console.log(`✅ Column exists: ${column}`);
            } else {
                console.log(`❌ Column missing: ${column}`);
            }
        }

        // Test 2: Try to insert test data
        console.log('\n2️⃣ Testing data insertion...');
        const testId = 'test-' + Date.now();
        const testData = {
            id: testId,
            company_name: 'Test Company',
            contact_person_name: 'Test Contact',
            contact_person_email: 'test@example.com',
            contact_person_phone: '1234567890',
            selected_package: 'test-package',
            drama_sedaka_division: 'Test Division',
            business_email: 'business@testcompany.com',
            business_contact_number: '0987654321'
        };

        try {
            await connection.execute(
                `INSERT INTO registrations (
                    id, company_name, contact_person_name, contact_person_email, 
                    contact_person_phone, selected_package, drama_sedaka_division, 
                    business_email, business_contact_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    testData.id, testData.company_name, testData.contact_person_name,
                    testData.contact_person_email, testData.contact_person_phone,
                    testData.selected_package, testData.drama_sedaka_division,
                    testData.business_email, testData.business_contact_number
                ]
            );
            console.log('✅ Test data inserted successfully');

            // Test 3: Retrieve the test data
            console.log('\n3️⃣ Testing data retrieval...');
            const [rows] = await connection.execute(
                'SELECT * FROM registrations WHERE id = ?',
                [testId]
            );

            if (rows.length > 0) {
                const row = rows[0];
                console.log('✅ Test data retrieved successfully:');
                console.log(`   - Drama Sedaka Division: ${row.drama_sedaka_division}`);
                console.log(`   - Business Email: ${row.business_email}`);
                console.log(`   - Business Contact Number: ${row.business_contact_number}`);
            } else {
                console.log('❌ Test data not found');
            }

            // Test 4: Update the test data
            console.log('\n4️⃣ Testing data update...');
            const updatedData = {
                drama_sedaka_division: 'Updated Division',
                business_email: 'updated@testcompany.com',
                business_contact_number: '1111111111'
            };

            await connection.execute(
                `UPDATE registrations SET 
                    drama_sedaka_division = ?, 
                    business_email = ?, 
                    business_contact_number = ?
                WHERE id = ?`,
                [
                    updatedData.drama_sedaka_division,
                    updatedData.business_email,
                    updatedData.business_contact_number,
                    testId
                ]
            );
            console.log('✅ Test data updated successfully');

            // Test 5: Verify the update
            const [updatedRows] = await connection.execute(
                'SELECT * FROM registrations WHERE id = ?',
                [testId]
            );

            if (updatedRows.length > 0) {
                const row = updatedRows[0];
                console.log('✅ Updated data verified:');
                console.log(`   - Drama Sedaka Division: ${row.drama_sedaka_division}`);
                console.log(`   - Business Email: ${row.business_email}`);
                console.log(`   - Business Contact Number: ${row.business_contact_number}`);
            }

            // Clean up: Delete test data
            console.log('\n5️⃣ Cleaning up test data...');
            await connection.execute('DELETE FROM registrations WHERE id = ?', [testId]);
            console.log('✅ Test data cleaned up');

        } catch (error) {
            console.error('❌ Error during data operations:', error.message);
        }

        console.log('\n🎉 All tests completed!');

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

// Run tests
testNewFields(); 