export const up = async (db: any): Promise<void> => {
  // 1. Create pengajuan table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`pengajuan\` (
      \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      \`pegawai_nip\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`jenis_jabatan\` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
      \`total_dokumen\` int NOT NULL DEFAULT '0',
      \`status\` enum('draft','submitted','reviewed','approved','rejected') COLLATE utf8mb4_general_ci DEFAULT 'draft',
      \`catatan\` text COLLATE utf8mb4_general_ci,
      \`created_by\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`office_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table pengajuan created');

  // 2. Create pengajuan_files table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`pengajuan_files\` (
      \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      \`pengajuan_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      \`file_type\` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
      \`file_name\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
      \`file_path\` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
      \`file_size\` int DEFAULT NULL,
      \`mime_type\` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table pengajuan_files created');

  // 3. Create job_type_configuration table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`job_type_configuration\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`jenis_jabatan\` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
      \`min_dokumen\` int NOT NULL DEFAULT '1',
      \`max_dokumen\` int NOT NULL DEFAULT '10',
      \`required_files\` json NOT NULL,
      \`is_active\` tinyint(1) NOT NULL DEFAULT '1',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`jenis_jabatan\` (\`jenis_jabatan\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table job_type_configuration created');
};

export const down = async (db: any): Promise<void> => {
  await db.query('DROP TABLE IF EXISTS `job_type_configuration`');
  await db.query('DROP TABLE IF EXISTS `pengajuan_files`');
  await db.query('DROP TABLE IF EXISTS `pengajuan`');
};