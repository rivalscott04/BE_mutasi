import db from '../utils/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runAddRejectionFieldsMigration() {
  try {
    console.log('🚀 Running Add Rejection Fields Migration...');
    console.log('=====================================');

    // Read the SQL migration file
    const migrationPath = join(__dirname, '../../../database/migrations/add_rejection_fields.sql');
    const sqlContent = readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration SQL:');
    console.log(sqlContent);
    console.log('=====================================');

    // Split SQL into individual statements and filter out comments
    const lines = sqlContent.split('\n');
    const statements: string[] = [];
    let currentStatement = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue; // Skip comments and empty lines
      }
      
      currentStatement += line + '\n';
      
      if (trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
        console.log(statement);
        
        try {
          await db.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          throw error;
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Added rejection_reason, rejected_by, and rejected_at columns to pengajuan table');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

runAddRejectionFieldsMigration();
