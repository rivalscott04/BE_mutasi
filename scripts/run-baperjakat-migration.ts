import { QueryInterface } from 'sequelize';
import db from '../src/utils/db';
import fs from 'fs';
import path from 'path';

async function runBaperjakatMigration() {
  try {
    console.log('🔄 Starting BAPERJAKAT migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../database/migrations/replace_surat_keterangan_kanwil_with_baperjakat.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
        await db.query(statement);
      }
    }
    
    console.log('✅ BAPERJAKAT migration completed successfully!');
    
    // Show results
    const results = await db.query(`
      SELECT 'admin_wilayah_file_configuration' as table_name, COUNT(*) as affected_records 
      FROM admin_wilayah_file_configuration 
      WHERE file_type = 'hasil_evaluasi_pertimbangan_baperjakat'
      UNION ALL
      SELECT 'pengajuan_files' as table_name, COUNT(*) as affected_records 
      FROM pengajuan_files 
      WHERE file_type = 'hasil_evaluasi_pertimbangan_baperjakat'
    `);
    
    console.log('📊 Migration Results:');
    console.table(results[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runBaperjakatMigration()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default runBaperjakatMigration;
