import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Insert initial admin wilayah file configurations
  await queryInterface.bulkInsert('admin_wilayah_file_configuration', [
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_pernyataan_persetujuan',
      display_name: 'Surat Pernyataan Persetujuan dari Kepala Wilayah Kementerian Agama Provinsi',
      is_required: true,
      description: 'Surat pernyataan persetujuan dari kepala wilayah untuk pengajuan mutasi',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_pernyataan_tidak_tugas_belajar',
      display_name: 'Surat Pernyataan Tidak Sedang Menjalani Tugas Belajar atau Ikatan Dinas',
      is_required: true,
      description: 'Surat pernyataan tidak sedang menjalani tugas belajar atau ikatan dinas',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_pernyataan_tidak_hukuman_disiplin',
      display_name: 'Surat Pernyataan Tidak Sedang Dijatuhi Hukuman Disiplin Tingkat Sedang atau Berat',
      is_required: true,
      description: 'Surat pernyataan tidak sedang dijatuhi hukuman disiplin tingkat sedang atau berat',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_pernyataan_tidak_proses_pidana',
      display_name: 'Surat Pernyataan Tidak Sedang Menjalani Proses Pidana atau Pernah Dipidana Penjara',
      is_required: true,
      description: 'Surat pernyataan tidak sedang menjalani proses pidana atau pernah dipidana penjara',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_pernyataan_tanggung_jawab_mutlak',
      display_name: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
      is_required: true,
      description: 'Surat pernyataan tanggung jawab mutlak untuk pengajuan mutasi',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_keterangan_bebas_temuan_inspektorat',
      display_name: 'Surat Keterangan Bebas Temuan (SKBT) - Inspektorat',
      is_required: true,
      description: 'SKBT diterbitkan Inspektorat Jenderal Kemenag',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'surat_rekomendasi_kanwil_khusus',
      display_name: 'Surat Rekomendasi Khusus dari Kanwil (Khusus Penghulu)',
      is_required: true,
      description: 'Surat rekomendasi khusus dari Kanwil Provinsi untuk jabatan Penghulu',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      jenis_jabatan_id: 1, // Guru
      file_type: 'hasil_assessment',
      display_name: 'Hasil Assessment',
      is_required: true,
      description: 'Dokumen hasil uji kompetensi/assessment dari Kanwil/otoritas terkait',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove all admin wilayah file configurations
  await queryInterface.bulkDelete('admin_wilayah_file_configuration', {});
}
