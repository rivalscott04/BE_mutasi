import db from '../utils/db';

async function testEndpoint() {
  try {
    console.log('Testing Admin Wilayah File Config API Endpoint...\n');
    
    // Test 1: Check if we can connect to database
    console.log('1. Testing database connection...');
    await db.authenticate();
    console.log('✅ Database connected successfully\n');
    
    // Test 2: Check what data we have
    console.log('2. Checking existing data...');
    const [data] = await db.query(`
      SELECT 
        awfc.*,
        jtc.jenis_jabatan
      FROM admin_wilayah_file_configuration awfc
      LEFT JOIN job_type_configuration jtc ON awfc.jenis_jabatan_id = jtc.id
      ORDER BY awfc.jenis_jabatan_id, awfc.file_type
    `);
    
    console.log('Current data:');
    console.table(data);
    console.log('');
    
    // Test 3: Simulate what the API should return
    console.log('3. Simulating API response...');
    const apiResponse = {
      success: true,
      data: data.map((item: any) => ({
        id: item.id,
        jenis_jabatan_id: item.jenis_jabatan_id,
        file_type: item.file_type,
        display_name: item.display_name,
        is_required: item.is_required,
        description: item.description,
        is_active: item.is_active,
        jenis_jabatan: {
          jenis_jabatan: item.jenis_jabatan
        }
      }))
    };
    
    console.log('API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('');
    
    // Test 4: Test the mapping logic from frontend
    console.log('4. Testing frontend mapping logic...');
    const names = Array.from(new Set(apiResponse.data.map((c: any) => {
      const jobType = c.jenis_jabatan_id || c.jenis_jabatan?.jenis_jabatan;
      return typeof jobType === 'string' ? jobType : String(jobType);
    }).filter(Boolean))) as string[];
    
    console.log('Extracted job type names:');
    console.log(names);
    console.log('');
    
    console.log('🎉 Endpoint test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

testEndpoint();
