import { db } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connection established');

    // Drop tables in reverse dependency order
    console.log('🗑️ Dropping all tables...');
    
    await db.query('DROP TABLE IF EXISTS pengajuan_files');
    console.log('✅ Dropped pengajuan_files');
    
    await db.query('DROP TABLE IF EXISTS pengajuan');
    console.log('✅ Dropped pengajuan');
    
    await db.query('DROP TABLE IF EXISTS letters');
    console.log('✅ Dropped letters');
    
    await db.query('DROP TABLE IF EXISTS pegawai');
    console.log('✅ Dropped pegawai');
    
    await db.query('DROP TABLE IF EXISTS users');
    console.log('✅ Dropped users');
    
    await db.query('DROP TABLE IF EXISTS job_type_configuration');
    console.log('✅ Dropped job_type_configuration');
    
    await db.query('DROP TABLE IF EXISTS offices');
    console.log('✅ Dropped offices');

    console.log('🎉 All tables dropped successfully!');
    process.exit(0);
  } catch (err) {
    console.error('💥 Error dropping tables:', err);
    process.exit(1);
  }
})();
