import db from '../utils/db';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking pengajuan_files table structure...');
    
    const [results] = await db.query(`
      DESCRIBE pengajuan_files
    `);
    
    console.log('📋 Table structure:');
    console.table(results);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await db.close();
    console.log('🔌 Database connection closed');
  }
}

// Jalankan check
checkTableStructure().catch(console.error);
