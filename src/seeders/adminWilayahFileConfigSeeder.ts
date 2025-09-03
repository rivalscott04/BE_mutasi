import { QueryInterface } from 'sequelize';
import { db } from '../models';

export async function up(queryInterface: QueryInterface): Promise<void> {
  try {
    // Get existing job types
    const jobTypes = await db.query(
      'SELECT id, jenis_jabatan FROM job_type_configuration WHERE is_active = true LIMIT 3',
      { type: 'SELECT' }
    );

    if (jobTypes[0] && jobTypes[0].length > 0) {
      const sampleConfigs = [
        {
          jenis_jabatan_id: jobTypes[0][0].id,
          file_type: 'surat_rekomendasi_kanwil',
          display_name: 'Surat Rekomendasi Kanwil',
          is_required: true,
          description: 'Surat rekomendasi dari Kanwil Provinsi untuk pengajuan mutasi',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          jenis_jabatan_id: jobTypes[0][0].id,
          file_type: 'surat_persetujuan_kepala_wilayah',
          display_name: 'Surat Persetujuan Kepala Wilayah',
          is_required: true,
          description: 'Surat persetujuan dari Kepala Wilayah Kementerian Agama Provinsi',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          jenis_jabatan_id: jobTypes[0][0].id,
          file_type: 'surat_keterangan_kanwil',
          display_name: 'Surat Keterangan dari Kanwil',
          is_required: false,
          description: 'Surat keterangan resmi dari Kanwil Provinsi',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      // Insert sample configs
      await queryInterface.bulkInsert('admin_wilayah_file_configuration', sampleConfigs);
      
      console.log('✅ Admin Wilayah File Config seeder completed');
    } else {
      console.log('⚠️ No job types found, skipping Admin Wilayah File Config seeder');
    }
  } catch (error) {
    console.error('❌ Error in Admin Wilayah File Config seeder:', error);
    throw error;
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  try {
    await queryInterface.bulkDelete('admin_wilayah_file_configuration', {});
    console.log('✅ Admin Wilayah File Config seeder reverted');
  } catch (error) {
    console.error('❌ Error reverting Admin Wilayah File Config seeder:', error);
    throw error;
  }
}
