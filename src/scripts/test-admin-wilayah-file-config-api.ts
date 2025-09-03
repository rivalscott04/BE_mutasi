import db from '../utils/db';

async function testAPI() {
  try {
    console.log('Testing Admin Wilayah File Config API...\n');
    
    // Test 1: Check if we can connect to database
    console.log('1. Testing database connection...');
    await db.authenticate();
    console.log('✅ Database connected successfully\n');
    
    // Test 2: Check if table has data
    console.log('2. Checking table data...');
    const [results] = await db.query(`
      SELECT COUNT(*) as count FROM admin_wilayah_file_configuration
    `);
    console.log(`📊 Table has ${(results as any)[0].count} records\n`);
    
    // Test 3: Check job type configuration
    console.log('3. Checking job type configuration...');
    const [jobTypes] = await db.query(`
      SELECT id, jenis_jabatan FROM job_type_configuration LIMIT 5
    `);
    console.log('Available job types:');
    console.table(jobTypes);
    console.log('');
    
    // Test 4: Try to insert a test record
    console.log('4. Testing insert...');
    await db.query(`
      INSERT INTO admin_wilayah_file_configuration 
      (jenis_jabatan_id, file_type, display_name, is_required, description, is_active, created_at, updated_at)
      VALUES (1, 'test_surat_kanwil', 'Test Surat Kanwil', 1, 'Test description', 1, NOW(), NOW())
    `);
    console.log('✅ Test record inserted successfully\n');
    
    // Test 5: Check the inserted record
    console.log('5. Checking inserted record...');
    const [checkResult] = await db.query(`
      SELECT * FROM admin_wilayah_file_configuration WHERE file_type = 'test_surat_kanwil'
    `);
    console.log('Inserted record:');
    console.table(checkResult);
    console.log('');
    
    // Test 6: Clean up test record
    console.log('6. Cleaning up test record...');
    await db.query(`
      DELETE FROM admin_wilayah_file_configuration WHERE file_type = 'test_surat_kanwil'
    `);
    console.log('✅ Test record cleaned up\n');
    
    console.log('🎉 All tests passed! The API should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

testAPI();
