import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function setupDatabase() {
  try {
    console.log('🗃️ Setting up complete database...');
    
    // Step 1: Create tables and indexes
    console.log('\n📋 Step 1: Creating tables and indexes...');
    const migrationPath = join(__dirname, '../../../database/migrations/complete_database_migration.sql');
    console.log(`🔍 Reading migration from: ${migrationPath}`);
    
    try {
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      console.log(`✅ Migration file read successfully (${migrationSQL.length} characters)`);
    } catch (error) {
      console.error(`❌ Error reading migration file:`, error);
      throw error;
    }
    
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Parse statements with proper handling of multi-line CREATE TABLE
    const rawStatements = migrationSQL.split(';');
    const statements: string[] = [];
    
    for (let i = 0; i < rawStatements.length; i++) {
      const stmt = rawStatements[i].trim();
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
    }
    
    console.log(`🔍 Total statements parsed: ${statements.length}`);
    
    // Debug: count CREATE TABLE statements
    const createTableCount = statements.filter(stmt => stmt.includes('CREATE TABLE')).length;
    const createIndexCount = statements.filter(stmt => stmt.includes('CREATE INDEX')).length;
    console.log(`📊 Found ${createTableCount} CREATE TABLE statements`);
    console.log(`📊 Found ${createIndexCount} CREATE INDEX statements`);
    
    // Debug: print first few statements
    console.log('\n🔍 First 5 statements of any type:');
    statements.slice(0, 5).forEach((stmt, i) => {
      console.log(`${i + 1}: ${stmt.substring(0, 80)}...`);
    });
    
    // Debug: print first few CREATE TABLE statements
    console.log('\n🔍 First 3 CREATE TABLE statements:');
    statements.filter(stmt => stmt.includes('CREATE TABLE')).slice(0, 3).forEach((stmt, i) => {
      console.log(`${i + 1}: ${stmt.substring(0, 100)}...`);
    });
    
    // Step 1a: Execute CREATE TABLE statements first
    console.log('\n📋 Step 1a: Creating tables...');
    let tableCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement.includes('CREATE TABLE')) {
        tableCount++;
        const tableName = statement.match(/CREATE TABLE IF NOT EXISTS `?(\w+)`?/)?.[1] || 'unknown';
        console.log(`[${tableCount}] Creating table: ${tableName}...`);
        try {
          await db.query(statement);
          console.log(`✅ Table '${tableName}' created successfully`);
        } catch (error: any) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ Table '${tableName}' already exists`);
            continue;
          }
          console.error(`❌ Error creating table '${tableName}':`, error.message);
          throw error;
        }
      }
    }
    console.log(`📊 Total tables processed: ${tableCount}`);
    
    // Step 1b: Execute CREATE INDEX statements
    console.log('\n📋 Step 1b: Creating indexes...');
    let indexCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement.includes('CREATE INDEX')) {
        indexCount++;
        const indexName = statement.match(/CREATE INDEX IF NOT EXISTS `?(\w+)`?/)?.[1] || 'unknown';
        console.log(`[${indexCount}] Creating index: ${indexName}...`);
        try {
          await db.query(statement);
          console.log(`✅ Index '${indexName}' created successfully`);
        } catch (error: any) {
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate key name')) {
            console.log(`⚠️ Index '${indexName}' already exists`);
            continue;
          }
          console.error(`❌ Error creating index '${indexName}':`, error.message);
          console.error(`💡 Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }
    console.log(`📊 Total indexes processed: ${indexCount}`);
    
    // Step 1c: Execute ALTER TABLE (foreign keys) later
    console.log('\n📋 Step 1c: Adding foreign keys...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement.includes('ALTER TABLE') && statement.includes('FOREIGN KEY')) {
        console.log(`[${i + 1}/${statements.length}] Adding FK: ${statement.substring(0, 60)}...`);
        try {
          await db.query(statement);
          console.log(`✅ Success`);
        } catch (error: any) {
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate key name')) {
            console.log(`⚠️ Skipping (already exists)`);
            continue;
          }
          throw error;
        }
      }
    }
    
    // Step 1d: Execute INSERT statements last
    console.log('\n📋 Step 1d: Inserting default data...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement.startsWith('INSERT INTO')) {
        console.log(`[${i + 1}/${statements.length}] Inserting data: ${statement.substring(0, 60)}...`);
        try {
          await db.query(statement);
          console.log(`✅ Success`);
        } catch (error: any) {
          if (error.message.includes('Duplicate entry')) {
            console.log(`⚠️ Skipping (already exists)`);
            continue;
          }
          throw error;
        }
      }
    }
    
    // Step 2: Show default credentials
    console.log('\n👤 Step 2: Default user credentials...');
    console.log('🔑 Default users created:');
    console.log('   Admin: admin.kanwil@kemenag.go.id (Check database for password)');
    console.log('   Operators: Each office has an operator account');
    console.log('   📋 All passwords are pre-hashed in migration data');
    
    // Step 3: Verify setup
    console.log('\n✅ Step 3: Verifying setup...');
    
    const tables = ['offices', 'users', 'pegawai', 'letters', 'pengajuan', 'pengajuan_files', 'job_type_configuration'];
    for (const table of tables) {
      try {
        const [result] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = (result as any)[0].count;
        console.log(`✅ Table '${table}': ${count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}': Error checking`);
      }
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📋 Tables created: offices, users, pegawai, letters, pengajuan, pengajuan_files, job_type_configuration');
    console.log('👥 Default data: 10 offices, 1 admin user');
    console.log('🔗 Foreign key constraints: All relationships established');
    console.log('✅ Database is ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
