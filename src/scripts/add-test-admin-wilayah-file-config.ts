import db from '../utils/db';

async function addTestData() {
  try {
    console.log('Adding test data for Admin Wilayah File Config...\n');
    
    // Check existing data
    const [existing] = await db.query(`
      SELECT COUNT(*) as count FROM admin_wilayah_file_configuration
    `);
    console.log(`Current records: ${(existing as any)[0].count}\n`);
    
    // Add test data for different job types
    const testData = [
      {
        jenis_jabatan_id: 1, // Guru
        file_type: 'surat_rekomendasi_kanwil',
        display_name: 'Surat Rekomendasi Kanwil',
        is_required: 1,
        description: 'Surat rekomendasi dari Kanwil Provinsi untuk jabatan Guru',
        is_active: 1
      },
      {
        jenis_jabatan_id: 1, // Guru
        file_type: 'surat_persetujuan_kepala_wilayah',
        display_name: 'Surat Persetujuan Kepala Wilayah',
        is_required: 1,
        description: 'Surat persetujuan dari Kepala Wilayah Kementerian Agama Provinsi',
        is_active: 1
      },
      {
        jenis_jabatan_id: 2, // Kepala Kantor
        file_type: 'surat_rekomendasi_kanwil_kepala',
        display_name: 'Surat Rekomendasi Kanwil untuk Kepala Kantor',
        is_required: 1,
        description: 'Surat rekomendasi khusus untuk jabatan Kepala Kantor',
        is_active: 1
      },
      {
        jenis_jabatan_id: 2, // Kepala Kantor
        file_type: 'surat_persetujuan_kepala_wilayah_kepala',
        display_name: 'Surat Persetujuan Kepala Wilayah untuk Kepala Kantor',
        is_required: 1,
        description: 'Surat persetujuan khusus untuk jabatan Kepala Kantor',
        is_active: 1
      }
    ];
    
    console.log('Adding test data...');
    for (const data of testData) {
      try {
        await db.query(`
          INSERT INTO admin_wilayah_file_configuration 
          (jenis_jabatan_id, file_type, display_name, is_required, description, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, { 
          replacements: [
            data.jenis_jabatan_id,
            data.file_type,
            data.display_name,
            data.is_required,
            data.description,
            data.is_active
          ]
        });
        console.log(`✅ Added: ${data.display_name} for job type ${data.jenis_jabatan_id}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Skipped (duplicate): ${data.display_name}`);
        } else {
          console.error(`❌ Failed to add: ${data.display_name}`, error.message);
        }
      }
    }
    
    // Show final data
    console.log('\nFinal data:');
    const [finalData] = await db.query(`
      SELECT 
        awfc.*,
        jtc.jenis_jabatan
      FROM admin_wilayah_file_configuration awfc
      LEFT JOIN job_type_configuration jtc ON awfc.jenis_jabatan_id = jtc.id
      ORDER BY awfc.jenis_jabatan_id, awfc.file_type
    `);
    
    console.table(finalData);
    
    console.log('\n🎉 Test data added successfully!');
    
  } catch (error) {
    console.error('❌ Failed to add test data:', error);
  } finally {
    await db.close();
  }
}

addTestData();
