const { db } = require('../src/models');

async function cleanupDuplicateSKBT() {
  try {
    console.log('🧹 Starting cleanup of duplicate SKBT entries...');
    
    // 1. Hapus entri dengan file_type 'skbt' (yang generic)
    const deleteResult = await db.query(
      "DELETE FROM admin_wilayah_file_configuration WHERE file_type = 'skbt'",
      { type: 'DELETE' }
    );
    console.log(`✅ Deleted ${deleteResult[1]} duplicate 'skbt' entries`);
    
    // 2. Update deskripsi untuk SKBT Inspektorat
    const updateSKBT = await db.query(
      "UPDATE admin_wilayah_file_configuration SET description = 'SKBT diterbitkan Inspektorat Jenderal Kemenag' WHERE file_type = 'surat_keterangan_bebas_temuan_inspektorat'",
      { type: 'UPDATE' }
    );
    console.log(`✅ Updated ${updateSKBT[1]} SKBT Inspektorat entries`);
    
    // 3. Update narasi untuk Surat Rekomendasi Khusus dari Kanwil
    const updateRekomendasi = await db.query(
      "UPDATE admin_wilayah_file_configuration SET display_name = 'Surat Rekomendasi Khusus dari Kanwil (Khusus Penghulu)', description = 'Surat rekomendasi khusus dari Kanwil Provinsi untuk jabatan Penghulu' WHERE file_type = 'surat_rekomendasi_kanwil_khusus'",
      { type: 'UPDATE' }
    );
    console.log(`✅ Updated ${updateRekomendasi[1]} Rekomendasi Khusus entries`);
    
    // 4. Tampilkan hasil untuk verifikasi
    const [results] = await db.query(`
      SELECT 
        id,
        jenis_jabatan_id,
        file_type,
        display_name,
        is_required,
        description,
        is_active
      FROM admin_wilayah_file_configuration 
      WHERE file_type LIKE '%skbt%' OR file_type LIKE '%rekomendasi%'
      ORDER BY file_type
    `);
    
    console.log('\n📋 Current SKBT and Rekomendasi entries:');
    console.table(results);
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Jalankan cleanup jika script dipanggil langsung
if (require.main === module) {
  cleanupDuplicateSKBT()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicateSKBT };
