import db from '../utils/db';
import * as fs from 'fs';
import * as path from 'path';

async function runApprovalFieldsMigration() {
  try {
    console.log('🚀 Starting approval fields migration...');
    
    // Baca file SQL
    const sqlFilePath = path.join(__dirname, '../../../database/migrations/add_approval_fields.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL content berdasarkan baris dan semicolon
    const lines = sqlContent.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('--'));
    const statements = lines.join('\n').split(';').filter(stmt => stmt.trim() !== '');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Eksekusi setiap statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          
          await db.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue dengan statement berikutnya
        }
      }
    }
    
    console.log('🎉 Approval fields migration completed successfully!');
    
    // Verifikasi kolom yang ditambahkan
    console.log('\n🔍 Verifying added columns...');
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pengajuan' 
      AND COLUMN_NAME IN ('approved_by', 'approved_at', 'resubmitted_by', 'resubmitted_at')
      ORDER BY COLUMN_NAME
    `);
    
    console.log('📋 Added columns:');
    columns.forEach((column: any) => {
      console.log(`  - ${column.COLUMN_NAME}: ${column.DATA_TYPE} (${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) - ${column.COLUMN_COMMENT}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Jalankan migration
runApprovalFieldsMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
