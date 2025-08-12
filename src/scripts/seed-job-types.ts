import { db, JobTypeConfiguration } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('Database connection established.');

    // Check if data already exists
    const existingCount = await JobTypeConfiguration.count();
    if (existingCount > 0) {
      console.log('Job type configurations already exist, skipping seed.');
      process.exit(0);
    }

    // Insert default configurations
    await JobTypeConfiguration.bulkCreate([
      {
        jenis_jabatan: 'guru',
        total_dokumen: 9,
        required_files: ['sk_cpns', 'sk_pns', 'sk_pangkat', 'ijazah', 'sertifikat', 'sk_jabatan', 'skp', 'surat_pernyataan', 'foto'],
        jabatan_patterns: ['guru', 'pendidik'],
        is_active: true
      },
      {
        jenis_jabatan: 'eselon_iv',
        total_dokumen: 7,
        required_files: ['sk_cpns', 'sk_pns', 'sk_pangkat', 'ijazah', 'sk_jabatan', 'skp', 'surat_pernyataan'],
        jabatan_patterns: ['eselon iv', 'kepala', 'kabid', 'kasi'],
        is_active: true
      },
      {
        jenis_jabatan: 'fungsional',
        total_dokumen: 7,
        required_files: ['sk_cpns', 'sk_pns', 'sk_pangkat', 'ijazah', 'sk_jabatan', 'skp', 'surat_pernyataan'],
        jabatan_patterns: ['fungsional', 'analis', 'penyuluh', 'pengawas'],
        is_active: true
      },
      {
        jenis_jabatan: 'pelaksana',
        total_dokumen: 6,
        required_files: ['sk_pns', 'sk_pangkat', 'ijazah', 'sk_jabatan', 'skp', 'surat_pernyataan'],
        jabatan_patterns: ['pelaksana', 'staff', 'operator', 'admin'],
        is_active: true
      }
    ]);

    console.log('Job type configurations seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unable to seed job type configurations:', err);
    process.exit(1);
  }
})(); 