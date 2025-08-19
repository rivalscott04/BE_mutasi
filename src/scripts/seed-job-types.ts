import db from '../utils/db';
import JobTypeConfiguration from '../models/JobTypeConfiguration';

async function seedJobTypes() {
  try {
    console.log('🚀 Seeding job type configurations...');
    console.log('=====================================');

    // Check if data already exists
    const existingCount = await JobTypeConfiguration.count();
    if (existingCount > 0) {
      console.log(`✅ Job type configurations already exist (${existingCount} records)`);
      return;
    }

    // Default job type configurations
    const defaultJobTypes = [
      {
        jenis_jabatan: 'Kepala Seksi',
        min_dokumen: 3,
        max_dokumen: 8,
        required_files: JSON.stringify([
          'SK Pangkat Terakhir',
          'SK Jabatan Terakhir',
          'Ijazah Terakhir',
          'Sertifikat Diklat',
          'Surat Pernyataan',
          'Foto'
        ]),
        is_active: true
      },
      {
        jenis_jabatan: 'Kepala Sub Bagian',
        min_dokumen: 3,
        max_dokumen: 8,
        required_files: JSON.stringify([
          'SK Pangkat Terakhir',
          'SK Jabatan Terakhir',
          'Ijazah Terakhir',
          'Sertifikat Diklat',
          'Surat Pernyataan',
          'Foto'
        ]),
        is_active: true
      },
      {
        jenis_jabatan: 'Kepala Urusan',
        min_dokumen: 3,
        max_dokumen: 8,
        required_files: JSON.stringify([
          'SK Pangkat Terakhir',
          'SK Jabatan Terakhir',
          'Ijazah Terakhir',
          'Sertifikat Diklat',
          'Surat Pernyataan',
          'Foto'
        ]),
        is_active: true
      },
      {
        jenis_jabatan: 'Guru',
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
      },
      {
        jenis_jabatan: 'Eselon IV',
        min_dokumen: 3,
        max_dokumen: 10,
        required_files: JSON.stringify([
          'surat_pengantar',
          'surat_permohonan_dari_yang_bersangkutan',
          'surat_keputusan_cpns',
          'surat_keputusan_pns',
          'surat_keputusan_kenaikan_pangkat_terakhir',
          'surat_keputusan_jabatan_terakhir',
          'skp_2_tahun_terakhir',
          'surat_keterangan_bebas_temuan_inspektorat',
          'surat_keterangan_anjab_abk_instansi_asal',
          'surat_keterangan_anjab_abk_instansi_penerima'
        ]),
        is_active: true
      },
      {
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
      },
      {
        jenis_jabatan: 'Pelaksana',
        min_dokumen: 3,
        max_dokumen: 7,
        required_files: JSON.stringify([
          'surat_pengantar',
          'surat_permohonan_dari_yang_bersangkutan',
          'surat_keputusan_cpns',
          'surat_keputusan_pns',
          'surat_keputusan_kenaikan_pangkat_terakhir',
          'surat_keputusan_jabatan_terakhir',
          'skp_2_tahun_terakhir'
        ]),
        is_active: true
      }
    ];

    // Insert default job types
    for (const jobType of defaultJobTypes) {
      console.log(`📝 Creating job type: ${jobType.jenis_jabatan}`);
      await JobTypeConfiguration.create(jobType);
    }

    console.log('\n🎉 Job type configurations seeded successfully!');
    console.log(`✅ Created ${defaultJobTypes.length} job type configurations`);

  } catch (error) {
    console.error('❌ Error seeding job types:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedJobTypes();
