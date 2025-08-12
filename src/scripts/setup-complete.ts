import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function runSQLMigration() {
  try {
    console.log('🗃️ Running complete database migration...');
    
    const migrationPath = join(__dirname, '../../../database/migrations/complete_database_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function runOfficeSeeder() {
  try {
    console.log('🏢 Running office seeder (updating kode_kabko)...');
    
    // Import akan menjalankan script seeder otomatis
    await import('./seed-kode-kabko-office');
    
    console.log('✅ Office seeder completed');
  } catch (error) {
    console.error('❌ Office seeder failed:', error);
    throw error;
  }
}

async function runUserSeeder() {
  try {
    console.log('👤 Running user seeder with office linking...');
    
    // Import akan menjalankan script seeder otomatis
    await import('./seed-users-linked-office');
    
    console.log('✅ User seeder completed');
  } catch (error) {
    console.error('❌ User seeder failed:', error);
    throw error;
  }
}

async function setupComplete() {
  try {
    console.log('🚀 Starting complete database setup...');
    console.log('⚠️  Warning: This will reset/update your database!');
    
    // Connect to database
    await db.authenticate();
    console.log('✅ Database connection established');
    
    // 1. Run migration (struktur + data minimal)
    await runSQLMigration();
    
    // 2. Run office seeder (data master lengkap)
    await runOfficeSeeder();
    
    // 3. Run user seeder (dengan office_id konsisten)
    await runUserSeeder();
    
    console.log('🎉 Complete database setup finished successfully!');
    console.log('📋 Ready to use:');
    console.log('   - Database structure created');
    console.log('   - Office/kantor data loaded');
    console.log('   - Admin users created with proper office links');
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupComplete();
}

export default setupComplete;
