export const seed = async (db: any): Promise<void> => {
  await db.query(`
    INSERT IGNORE INTO \`job_type_configuration\` (\`jenis_jabatan\`, \`min_dokumen\`, \`max_dokumen\`, \`required_files\`, \`is_active\`, \`created_at\`, \`updated_at\`) VALUES 
    ('Kepala Seksi', 3, 8, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Sertifikat Diklat', 'Surat Pernyataan', 'Foto'), 1, NOW(), NOW()),
    ('Kepala Sub Bagian', 3, 8, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Sertifikat Diklat', 'Surat Pernyataan', 'Foto'), 1, NOW(), NOW()),
    ('Kepala Urusan', 3, 8, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Sertifikat Diklat', 'Surat Pernyataan', 'Foto'), 1, NOW(), NOW()),
    ('Staff', 2, 6, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Surat Pernyataan', 'Foto'), 1, NOW(), NOW()),
    ('Pelaksana', 2, 6, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Surat Pernyataan', 'Foto'), 1, NOW(), NOW())
  `);
  console.log('✅ Job types seeded (5 records)');
};
