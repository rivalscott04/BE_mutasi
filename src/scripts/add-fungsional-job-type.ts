import db from '../utils/db';
import JobTypeConfiguration from '../models/JobTypeConfiguration';

async function addFungsionalJobType() {
  try {
    console.log('🚀 Adding Fungsional job type configuration...');
    console.log('=====================================');

    // Check if Fungsional already exists
    const existing = await JobTypeConfiguration.findOne({
      where: { jenis_jabatan: 'Fungsional' }
    });

    if (existing) {
      console.log('✅ Fungsional job type configuration already exists');
      console.log(`   - ID: ${existing.id}`);
      console.log(`   - Max Dokumen: ${existing.max_dokumen}`);
      console.log(`   - Active: ${existing.is_active ? 'Yes' : 'No'}`);
      return;
    }

    // Create Fungsional job type configuration
    const fungsionalConfig = {
      jenis_jabatan: 'Fungsional',
      min_dokumen: 3,
      max_dokumen: 8,
      required_files: JSON.stringify([
        'surat_pengantar',
        'surat_permohonan_dari_yang_bersangkutan',
        'surat_keputusan_cpns',
        'surat_keputusan_pns',
        'surat_keputusan_kenaikan_pangkat_terakhir',
        'surat_keputusan_jabatan_terakhir',
        'skp_2_tahun_terakhir',
        'surat_keterangan_bebas_temuan_inspektorat'
      ]),
      is_active: true
    };

    const newConfig = await JobTypeConfiguration.create(fungsionalConfig);
    console.log('✅ Fungsional job type configuration created successfully!');
    console.log(`   - ID: ${newConfig.id}`);
    console.log(`   - Jenis Jabatan: ${newConfig.jenis_jabatan}`);
    console.log(`   - Max Dokumen: ${newConfig.max_dokumen}`);
    console.log(`   - Active: ${newConfig.is_active ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Error adding Fungsional job type:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

addFungsionalJobType();
