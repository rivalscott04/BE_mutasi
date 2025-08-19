import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'newmutasi',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function runMissingTablesMigration() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Execute CREATE TABLE statements directly
    console.log('\n📝 Creating tables...');

    // 1. Create letter_files table
    console.log('Creating letter_files table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`letter_files\` (
        \`id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`letter_id\` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        \`file_name\` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
        \`file_path\` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
        \`file_size\` int(11) NOT NULL,
        \`mime_type\` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
        \`file_hash\` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
        \`created_at\` datetime DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✅ letter_files table created');

    // 2. Create pengajuan table
    console.log('Creating pengajuan table...');
    await connection.execute(`
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
    console.log('✅ pengajuan table created');

    // 3. Create pengajuan_files table
    console.log('Creating pengajuan_files table...');
    await connection.execute(`
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
    console.log('✅ pengajuan_files table created');

    // 4. Create job_type_configuration table
    console.log('Creating job_type_configuration table...');
    await connection.execute(`
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
    console.log('✅ job_type_configuration table created');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS `idx_letter_files_letter_id` ON `letter_files`(`letter_id`)',
      'CREATE INDEX IF NOT EXISTS `idx_letter_files_created_at` ON `letter_files`(`created_at`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_pegawai_nip` ON `pengajuan`(`pegawai_nip`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_created_by` ON `pengajuan`(`created_by`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_office_id` ON `pengajuan`(`office_id`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_status` ON `pengajuan`(`status`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_jenis_jabatan` ON `pengajuan`(`jenis_jabatan`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_created_at` ON `pengajuan`(`created_at`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_files_pengajuan_id` ON `pengajuan_files`(`pengajuan_id`)',
      'CREATE INDEX IF NOT EXISTS `idx_pengajuan_files_type` ON `pengajuan_files`(`file_type`)',
      'CREATE INDEX IF NOT EXISTS `idx_job_type_config_jenis` ON `job_type_configuration`(`jenis_jabatan`)',
      'CREATE INDEX IF NOT EXISTS `idx_job_type_config_active` ON `job_type_configuration`(`is_active`)'
    ];

    for (const indexSQL of indexes) {
      try {
        await connection.execute(indexSQL);
        console.log(`✅ Index created: ${indexSQL.split('`')[1]}`);
      } catch (error: any) {
        console.log(`⚠️  Index warning: ${error.message}`);
      }
    }

    // Add foreign key constraints
    console.log('\n🔗 Adding foreign key constraints...');
    const foreignKeys = [
      'ALTER TABLE `letter_files` ADD CONSTRAINT `fk_letter_files_letter_id` FOREIGN KEY (`letter_id`) REFERENCES `letters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
      'ALTER TABLE `pengajuan` ADD CONSTRAINT `fk_pengajuan_pegawai_nip` FOREIGN KEY (`pegawai_nip`) REFERENCES `pegawai`(`nip`) ON DELETE SET NULL ON UPDATE CASCADE',
      'ALTER TABLE `pengajuan` ADD CONSTRAINT `fk_pengajuan_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
      'ALTER TABLE `pengajuan` ADD CONSTRAINT `fk_pengajuan_office_id` FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
      'ALTER TABLE `pengajuan_files` ADD CONSTRAINT `fk_pengajuan_files_pengajuan_id` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    ];

    for (const fkSQL of foreignKeys) {
      try {
        await connection.execute(fkSQL);
        console.log(`✅ Foreign key added: ${fkSQL.split('`')[1]}`);
      } catch (error: any) {
        console.log(`⚠️  Foreign key warning: ${error.message}`);
      }
    }

    // Insert default data
    console.log('\n📝 Inserting default data...');
    try {
      await connection.execute(`
        INSERT INTO \`job_type_configuration\` (\`jenis_jabatan\`, \`min_dokumen\`, \`max_dokumen\`, \`required_files\`) VALUES 
        ('Kepala Seksi', 3, 8, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Sertifikat Diklat', 'Surat Pernyataan', 'Foto')),
        ('Kepala Sub Bagian', 3, 8, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Sertifikat Diklat', 'Surat Pernyataan', 'Foto')),
        ('Kepala Urusan', 3, 8, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Sertifikat Diklat', 'Surat Pernyataan', 'Foto')),
        ('Staff', 2, 6, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Surat Pernyataan', 'Foto')),
        ('Pelaksana', 2, 6, JSON_ARRAY('SK Pangkat Terakhir', 'SK Jabatan Terakhir', 'Ijazah Terakhir', 'Surat Pernyataan', 'Foto'))
        ON DUPLICATE KEY UPDATE 
            \`min_dokumen\` = VALUES(\`min_dokumen\`),
            \`max_dokumen\` = VALUES(\`max_dokumen\`),
            \`required_files\` = VALUES(\`required_files\`),
            \`updated_at\` = CURRENT_TIMESTAMP
      `);
      console.log('✅ Default job type configuration data inserted');
    } catch (error: any) {
      console.log(`⚠️  Data insertion warning: ${error.message}`);
    }

    console.log('\n🎉 Missing tables migration completed successfully!');
    console.log('📋 Tables added:');
    console.log('   - letter_files');
    console.log('   - pengajuan');
    console.log('   - pengajuan_files');
    console.log('   - job_type_configuration');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMissingTablesMigration();
