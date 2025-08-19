import db from '../utils/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Starting verification fields migration...');
    
    // Baca file SQL
    const sqlFilePath = path.join(__dirname, '../../../database/migrations/add_verification_fields.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL content berdasarkan baris dan semicolon
    const statements = sqlContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('--'))
      .join('\n')
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Eksekusi setiap statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        console.log(`SQL: ${statement.substring(0, 50)}...`);
        
        await db.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Verification fields migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await db.close();
    console.log('🔌 Database connection closed');
  }
}

// Jalankan migration
runMigration().catch(console.error);
