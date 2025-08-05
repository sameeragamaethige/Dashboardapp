const mysql = require('mysql2/promise');

async function testMySQLConnection() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: null,
        database: 'banana_db',
        port: 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };

    try {
        console.log('Attempting to connect to MySQL database...');
        console.log('Configuration:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port
        });

        const pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();

        console.log('✅ MySQL connection successful!');
        console.log('Database:', dbConfig.database);
        console.log('Server version:', connection.serverVersion);

        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Test query successful:', rows);

        connection.release();
        await pool.end();

        console.log('✅ Connection test completed successfully!');
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.error('Please make sure:');
        console.error('1. XAMPP is running');
        console.error('2. MySQL service is started in XAMPP');
        console.error('3. Database "dashboard_pro" exists');
        console.error('4. User "root" has access to the database');
    }
}

testMySQLConnection(); 