import db from '../utils/db';

async function checkTable() {
  try {
    console.log('Checking admin_wilayah_file_configuration table...');
    
    // Check if table exists
    const [results] = await db.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admin_wilayah_file_configuration'
    `);
    
    if (Array.isArray(results) && results.length > 0) {
      console.log('✅ Table admin_wilayah_file_configuration exists');
      
      // Show table structure
      const [columns] = await db.query(`
        DESCRIBE admin_wilayah_file_configuration
      `);
      
      console.log('\nTable structure:');
      console.table(columns);
      
      // Show all data
      const [data] = await db.query(`
        SELECT * FROM admin_wilayah_file_configuration
      `);
      
      console.log('\nAll data:');
      console.table(data);
      
      // Show data with job type names
      const [dataWithJobTypes] = await db.query(`
        SELECT 
          awfc.*,
          jtc.jenis_jabatan
        FROM admin_wilayah_file_configuration awfc
        LEFT JOIN job_type_configuration jtc ON awfc.jenis_jabatan_id = jtc.id
        ORDER BY awfc.jenis_jabatan_id, awfc.file_type
      `);
      
      console.log('\nData with job type names:');
      console.table(dataWithJobTypes);
      
    } else {
      console.log('❌ Table admin_wilayah_file_configuration does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

checkTable();
