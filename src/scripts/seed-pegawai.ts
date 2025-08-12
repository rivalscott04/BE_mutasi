import { db, Pegawai, Office } from '../models';

(async () => {
  try {
    await db.authenticate();
    console.log('Database connection established.');

    // Check if pegawai already exists
    const existingCount = await Pegawai.count();
    if (existingCount > 0) {
      console.log(`Pegawai data already exists (${existingCount} records), skipping seed.`);
      process.exit(0);
    }

    // Get first office for reference
    const office = await Office.findOne();
    if (!office) {
      console.error('No office found. Please seed offices first.');
      process.exit(1);
    }

    // Sample pegawai data
    const samplePegawai = [
      {
        nip: '198501012010011001',
        nama: 'Ahmad Supriadi',
        jabatan: 'Guru PAI',
        pangkat: 'Penata Muda Tk.I',
        golongan: 'III/b',
        unit_kerja: 'SMA Negeri 1 Mataram',
        induk_unit: 'KOTA MATARAM',
        kantor_id: office.id,
        aktif: true
      },
      {
        nip: '198502022010011002',
        nama: 'Siti Nurhaliza',
        jabatan: 'Guru Bahasa Indonesia',
        pangkat: 'Penata Muda',
        golongan: 'III/a',
        unit_kerja: 'SMA Negeri 2 Mataram',
        induk_unit: 'KOTA MATARAM',
        kantor_id: office.id,
        aktif: true
      },
      {
        nip: '198503032010011003',
        nama: 'Budi Santoso',
        jabatan: 'Kepala Seksi Pendidikan Madrasah',
        pangkat: 'Penata Tk.I',
        golongan: 'III/d',
        unit_kerja: 'Kantor Kemenag Kota Mataram',
        induk_unit: 'KOTA MATARAM',
        kantor_id: office.id,
        aktif: true
      },
      {
        nip: '198504042010011004',
        nama: 'Dewi Sartika',
        jabatan: 'Analis Kepegawaian',
        pangkat: 'Penata',
        golongan: 'III/c',
        unit_kerja: 'Kantor Kemenag Kabupaten Lombok Barat',
        induk_unit: 'KABUPATEN LOMBOK BARAT',
        kantor_id: office.id,
        aktif: true
      },
      {
        nip: '198505052010011005',
        nama: 'Rudi Hartono',
        jabatan: 'Penyuluh Agama',
        pangkat: 'Penata Muda Tk.I',
        golongan: 'III/b',
        unit_kerja: 'Kantor Kemenag Kabupaten Lombok Tengah',
        induk_unit: 'KABUPATEN LOMBOK TENGAH',
        kantor_id: office.id,
        aktif: true
      }
    ];

    // Insert sample data
    await Pegawai.bulkCreate(samplePegawai);

    console.log(`✅ Successfully seeded ${samplePegawai.length} pegawai records.`);
    console.log('Sample NIPs for testing:');
    samplePegawai.forEach(p => {
      console.log(`- ${p.nip} (${p.nama})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Unable to seed pegawai:', err);
    process.exit(1);
  }
})(); 