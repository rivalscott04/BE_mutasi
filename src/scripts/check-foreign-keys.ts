import db from '../utils/db';

async function checkForeignKeys() {
  try {
    console.log('🔗 Checking foreign key constraints...');
    
    const [constraints] = await db.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'newmutasi' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, CONSTRAINT_NAME
    `);
    
    console.log(`Found ${constraints.length} foreign key constraints:`);
    
    constraints.forEach((constraint: any) => {
      console.log(`- ${constraint.CONSTRAINT_NAME}: ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} → ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    // Check expected foreign keys
    const expectedFKs = [
      'fk_users_office_id',
      'fk_pegawai_office_id', 
      'fk_letters_created_by',
      'fk_letters_office_id',
      'fk_letters_recipient_employee_nip',
      'fk_pengajuan_pegawai_nip',
      'fk_pengajuan_created_by',
      'fk_pengajuan_office_id',
      'fk_pengajuan_files_pengajuan_id'
    ];
    
    console.log('\n📋 Checking expected foreign keys:');
    expectedFKs.forEach(expectedFK => {
      const exists = constraints.some((fk: any) => fk.CONSTRAINT_NAME === expectedFK);
      if (exists) {
        console.log(`✅ ${expectedFK}`);
      } else {
        console.log(`❌ ${expectedFK} - MISSING`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkForeignKeys();
