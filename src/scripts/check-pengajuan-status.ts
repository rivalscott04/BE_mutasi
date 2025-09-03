import db from '../utils/db';

async function checkPengajuanStatus() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('🔍 Checking Pengajuan Status in Database...\n');

    // Check current status values in pengajuan table
    const [statusResults] = await db.query(`
      SELECT status, COUNT(*) as count
      FROM pengajuan
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 Current Status Values in Database:');
    (statusResults as any[]).forEach((status: any) => {
      console.log(`- ${status.status}: ${status.count} records`);
    });

    // Check table structure
    const [structureResults] = await db.query('DESCRIBE pengajuan');
    const statusColumn = (structureResults as any[]).find((row: any) => row.Field === 'status');
    
    if (statusColumn) {
      console.log('\n📋 Status Column Structure:');
      console.log(`Field: ${statusColumn.Field}`);
      console.log(`Type: ${statusColumn.Type}`);
      console.log(`Null: ${statusColumn.Null}`);
      console.log(`Default: ${statusColumn.Default}`);
    }

    await db.close();
    console.log('\n🎉 Check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

checkPengajuanStatus();
