import db from '../utils/db';

async function testFrontendMapping() {
  try {
    console.log('Testing Frontend Mapping Logic...\n');
    
    // Simulate the API response structure
    const [data] = await db.query(`
      SELECT 
        awfc.*,
        jtc.jenis_jabatan
      FROM admin_wilayah_file_configuration awfc
      LEFT JOIN job_type_configuration jtc ON awfc.jenis_jabatan_id = jtc.id
      ORDER BY awfc.jenis_jabatan_id, awfc.file_type
    `);
    
    // Simulate API response
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
    
    console.log('API Response Structure:');
    console.log(JSON.stringify(apiResponse, null, 2));
    console.log('');
    
    // Test the current frontend logic
    console.log('Testing Current Frontend Logic:');
    const names = Array.from(new Set(apiResponse.data.map((c: any) => {
      const jobType = c.jenis_jabatan_id || c.jenis_jabatan?.jenis_jabatan;
      return typeof jobType === 'string' ? jobType : String(jobType);
    }).filter(Boolean))) as string[];
    
    console.log('Result:', names);
    console.log('');
    
    // Test the improved frontend logic
    console.log('Testing Improved Frontend Logic:');
    const jobTypeMap = new Map();
    apiResponse.data.forEach((c: any) => {
      const jobTypeId = c.jenis_jabatan_id;
      const jobTypeName = c.jenis_jabatan?.jenis_jabatan || `Jabatan ${jobTypeId}`;
      if (jobTypeId && !jobTypeMap.has(jobTypeId)) {
        jobTypeMap.set(jobTypeId, jobTypeName);
      }
    });
    
    const improvedNames = Array.from(jobTypeMap.values());
    console.log('Result:', improvedNames);
    console.log('');
    
    // Show what should be displayed in dropdown
    console.log('Dropdown Options:');
    improvedNames.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    console.log('\n🎉 Frontend mapping test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
  }
}

testFrontendMapping();
