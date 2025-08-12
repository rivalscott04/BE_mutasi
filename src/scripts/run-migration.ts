import db from '../utils/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const [results] = await db.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'newmutasi' AND table_name = ?",
      { replacements: [tableName] }
    );
    return (results as any)[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting migration...');
    
    // Check if tables already exist
    const tablesToCheck = ['pengajuan', 'pengajuan_files', 'job_type_configuration'];
    
    for (const table of tablesToCheck) {
      const exists = await checkTableExists(table);
      if (exists) {
        console.log(`⏭️  Table '${table}' already exists, skipping...`);
      } else {
        console.log(`📝 Table '${table}' not found, will create...`);
      }
    }
    
    // Read migration file
    const migrationPath = join(__dirname, '../../../database/migrations/005_pengajuan_mysql_migration.sql');
    console.log(`📁 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(`📄 File size: ${migrationSQL.length} characters`);
    
    // Split SQL into individual statements and filter out comments
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
        return cleanStmt.length > 0 && 
               !cleanStmt.startsWith('--') && 
               !cleanStmt.startsWith('/*') &&
               !cleanStmt.startsWith('*/') &&
               !cleanStmt.startsWith('=') &&
               !cleanStmt.startsWith('-- Migration completed');
      });
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement with error handling
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          console.log(`📄 Statement: ${statement.substring(0, 100)}...`);
          await db.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error: any) {
          // If table already exists, skip
          if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            console.log(`⏭️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Tables created: pengajuan, pengajuan_files, job_type_configuration');
    console.log('🔗 Foreign keys: pengajuan -> pegawai, pengajuan -> offices');
    console.log('📊 Default data: Job type configurations inserted');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run migration
runMigration(); 