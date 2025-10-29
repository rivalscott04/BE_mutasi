const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runTrackingMigration() {
  let connection;
  
  try {
    // Baca konfigurasi database dari env atau gunakan default
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amut',
      multipleStatements: true
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);

    // Baca file migration
    const migrationPath = path.join(__dirname, '../../database/migrations/complete_tracking_setup.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running tracking migration...');
    await connection.execute(migrationSQL);

    console.log('Migration completed successfully!');
    
    // Verifikasi tabel sudah dibuat
    const [tables] = await connection.execute("SHOW TABLES LIKE 'tracking%'");
    console.log('Created tables:', tables.map(t => Object.values(t)[0]));

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runTrackingMigration();
