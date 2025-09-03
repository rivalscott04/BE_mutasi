import db from '../utils/db';

async function updatePengajuanStatusEnum() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('🔧 Updating pengajuan status enum...');
    
    // Update status enum untuk include admin wilayah statuses
    await db.query(`
      ALTER TABLE pengajuan
      MODIFY COLUMN status ENUM('draft', 'submitted', 'approved', 'rejected', 'resubmitted', 'admin_wilayah_approved', 'admin_wilayah_rejected') NOT NULL DEFAULT 'draft'
    `);
    
    console.log('✅ Pengajuan status enum updated successfully');

    // Verify the update
    const [structureResults] = await db.query('DESCRIBE pengajuan');
    const statusColumn = (structureResults as any[]).find((row: any) => row.Field === 'status');
    
    if (statusColumn) {
      console.log('\n📋 Pengajuan table structure after update:');
      console.log(`Status column: ${statusColumn.Type}`);
    }

    await db.close();
    console.log('\n🎉 Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

updatePengajuanStatusEnum();
