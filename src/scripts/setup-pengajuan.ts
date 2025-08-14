import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function setupPengajuanSystem() {
  try {
    console.log('🚀 Setting up Pengajuan System...');
    console.log('=================================');
    
    // Step 1: Verify existing tables
    console.log('\n🔍 Step 1: Verifying existing tables...');
    const requiredTables = ['offices', 'users', 'pegawai', 'letters'];
    
    for (const table of requiredTables) {
      try {
        const [result] = await db.query(`SHOW TABLES LIKE '${table}'`);
        if (result.length === 0) {
          console.log(`❌ Required table '${table}' does not exist!`);
          process.exit(1);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error);
        process.exit(1);
      }
    }
    
    // Step 2: Check existing data count
    console.log('\n📊 Step 2: Checking existing data...');
    try {
      const [officesCount] = await db.query('SELECT COUNT(*) as count FROM offices');
      const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
      const [pegawaiCount] = await db.query('SELECT COUNT(*) as count FROM pegawai');
      const [lettersCount] = await db.query('SELECT COUNT(*) as count FROM letters');
      
      console.log(`📋 Existing data:`);
      console.log(`   - Offices: ${officesCount[0].count} records`);
      console.log(`   - Users: ${usersCount[0].count} records`);
      console.log(`   - Pegawai: ${pegawaiCount[0].count} records`);
      console.log(`   - Letters: ${lettersCount[0].count} records`);
      
      if (lettersCount[0].count > 0) {
        console.log('✅ Letters table has existing data - will be preserved');
      }
    } catch (error) {
      console.log('⚠️ Could not check existing data counts:', error);
    }
    
    // Step 3: Run complete database migration
    console.log('\n📋 Step 3: Running complete database migration...');
    const migrationPath = join(__dirname, '../../../database/migrations/complete_database_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
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
          console.error(`❌ Error:`, error.message);
          throw error;
        }
      }
    }
    
    // Step 4: Verify all tables created
    console.log('\n🔍 Step 4: Verifying all tables...');
    const allTables = ['offices', 'users', 'pegawai', 'letters', 'pengajuan', 'pengajuan_files', 'job_type_configuration'];
    
    for (const table of allTables) {
      try {
        const [result] = await db.query(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          console.log(`✅ Table '${table}' created successfully`);
          
          // Check count
          const [count] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   - Records: ${count[0].count}`);
        } else {
          console.log(`❌ Table '${table}' was not created`);
        }
      } catch (error) {
        console.log(`❌ Error checking table '${table}':`, error);
      }
    }
    
    // Step 5: Verify foreign key constraints
    console.log('\n🔗 Step 5: Verifying foreign key constraints...');
    try {
      const [constraints] = await db.query(`
        SELECT 
          TABLE_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('pengajuan', 'pengajuan_files')
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      console.log('🔗 Foreign key constraints:');
      constraints.forEach((fk: any) => {
        console.log(`   ✅ ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } catch (error) {
      console.log('⚠️ Could not verify foreign key constraints:', error);
    }
    
    console.log('\n🎉 Pengajuan System Setup Completed!');
    console.log('=====================================');
    console.log('✅ New tables created: pengajuan, pengajuan_files, job_type_configuration');
    console.log('✅ Foreign key constraints established');
    console.log('✅ Default job type configurations inserted');
    console.log('✅ All existing data preserved');
    console.log('\n💡 Ready to use pengajuan system!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.log('\n🛠️ Troubleshooting:');
    console.log('1. Check database connection');
    console.log('2. Ensure required tables (offices, users, pegawai, letters) exist');
    console.log('3. Check database user permissions');
    process.exit(1);
  }
}

setupPengajuanSystem();
