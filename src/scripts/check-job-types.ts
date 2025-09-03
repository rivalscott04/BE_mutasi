import db from '../utils/db';

async function checkJobTypes() {
  try {
    console.log('Checking available job types...\n');
    
    // Check job type configuration
    const [jobTypes] = await db.query(`
      SELECT * FROM job_type_configuration ORDER BY id
    `);
    
    console.log('Available job types:');
    console.table(jobTypes);
    
    // Check admin wilayah file config
    const [fileConfigs] = await db.query(`
      SELECT 
        awfc.*,
        jtc.jenis_jabatan
      FROM admin_wilayah_file_configuration awfc
      LEFT JOIN job_type_configuration jtc ON awfc.jenis_jabatan_id = jtc.id
      ORDER BY awfc.jenis_jabatan_id, awfc.file_type
    `);
    
    console.log('\nAdmin Wilayah File Configs:');
    console.table(fileConfigs);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

checkJobTypes();
