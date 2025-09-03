import db from '../utils/db';

async function runWilayahMigration() {
  try {
    console.log('📋 Running migration: Add wilayah field to users...');
    
    await db.authenticate();
    console.log('✅ Database connected\n');

    // Add wilayah column to users table
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN wilayah VARCHAR(100) NULL 
      COMMENT 'Wilayah coverage for admin_wilayah role (e.g., "Lombok Barat", "Sumbawa")'
    `);
    console.log('✅ Wilayah column added successfully\n');

    // Update role enum to include admin_wilayah
    await db.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'operator', 'user', 'admin_wilayah') NOT NULL
    `);
    console.log('✅ Role enum updated successfully\n');

    await db.close();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.close();
    process.exit(1);
  }
}

runWilayahMigration();
