export const up = async (db: any): Promise<void> => {
  // 1. Create offices table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`offices\` (
      \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`kabkota\` varchar(100) NOT NULL,
      \`address\` text NOT NULL,
      \`phone\` varchar(20) DEFAULT NULL,
      \`fax\` varchar(20) DEFAULT NULL,
      \`email\` varchar(255) DEFAULT NULL,
      \`website\` varchar(255) DEFAULT NULL,
      \`kode_kabko\` varchar(10) DEFAULT NULL,
      \`created_at\` datetime DEFAULT NULL,
      \`updated_at\` datetime DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table offices created');

  // 2. Create users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      \`email\` varchar(255) NOT NULL,
      \`password_hash\` varchar(255) NOT NULL,
      \`full_name\` varchar(255) NOT NULL,
      \`role\` enum('admin','operator','user') NOT NULL,
      \`office_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`is_active\` tinyint(1) DEFAULT '1',
      \`created_at\` datetime DEFAULT NULL,
      \`updated_at\` datetime DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table users created');

  // 3. Create pegawai table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`pegawai\` (
      \`nip\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
      \`nama\` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
      \`golongan\` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`tmt_pensiun\` datetime DEFAULT NULL,
      \`unit_kerja\` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`induk_unit\` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`jabatan\` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
      \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`kantor_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`jenis_pegawai\` enum('pegawai','pejabat') COLLATE utf8mb4_general_ci DEFAULT 'pegawai',
      \`aktif\` tinyint(1) DEFAULT '1',
      \`dibuat_pada\` datetime DEFAULT NULL,
      \`diubah_pada\` datetime DEFAULT NULL,
      PRIMARY KEY (\`nip\`),
      UNIQUE KEY \`id\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table pegawai created');

  // 4. Create letters table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`letters\` (
      \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      \`office_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`created_by\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      \`template_id\` varchar(50) DEFAULT NULL,
      \`template_name\` varchar(255) DEFAULT NULL,
      \`letter_number\` varchar(100) DEFAULT NULL,
      \`subject\` varchar(255) DEFAULT NULL,
      \`recipient_employee_nip\` varchar(20) DEFAULT NULL,
      \`signing_official_nip\` varchar(20) DEFAULT NULL,
      \`form_data\` json DEFAULT NULL,
      \`status\` varchar(20) DEFAULT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  console.log('✅ Table letters created');
};

export const down = async (db: any): Promise<void> => {
  await db.query('DROP TABLE IF EXISTS `letters`');
  await db.query('DROP TABLE IF EXISTS `pegawai`');
  await db.query('DROP TABLE IF EXISTS `users`');
  await db.query('DROP TABLE IF EXISTS `offices`');
};