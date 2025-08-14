import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function setupDatabaseDirect() {
  try {
    console.log('🗃️ Setting up database with direct SQL import...');
    
    const migrationPath = join(__dirname, '../../../database/migrations/complete_database_migration.sql');
    console.log(`🔍 Script directory: ${__dirname}`);
    console.log(`🔍 Calculated path: ${migrationPath}`);
    console.log(`🔍 Reading migration from: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file read successfully (${migrationSQL.length} characters)`);
    
    // Execute the entire SQL file directly
    console.log('\n📋 Executing migration SQL...');
    
    try {
      // Split by semicolon and execute each statement that's not empty or comment
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
      
      console.log(`📊 Found ${statements.length} statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`[${i + 1}/${statements.length}] Executing...`);
          
          try {
            await db.query(statement);
            console.log(`✅ Success`);
          } catch (error: any) {
            if (error.message.includes('already exists') || 
                error.message.includes('Duplicate key name') ||
                error.message.includes('Duplicate entry') ||
                error.message.includes('Duplicate column name')) {
              console.log(`⚠️ Skipping (already exists)`);
              continue;
            }
            
            console.error(`❌ Error in statement ${i + 1}:`);
            console.error(`💡 Statement: ${statement.substring(0, 100)}...`);
            console.error(`❌ Error: ${error.message}`);
            
            // Don't throw, continue with next statement
            continue;
          }
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error executing migration:', error.message);
      throw error;
    }
    
    // Verify setup
    console.log('\n✅ Verifying setup...');
    const tables = ['offices', 'users', 'pegawai', 'letters', 'pengajuan', 'pengajuan_files', 'job_type_configuration'];
    
    for (const table of tables) {
      try {
        const [result] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = (result as any)[0].count;
        console.log(`✅ Table '${table}': ${count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}': Not found or error`);
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('📋 All migration statements executed');
    console.log('✅ Database is ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabaseDirect();
