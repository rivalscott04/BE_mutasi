export const up = async (db: any): Promise<void> => {
  // Add foreign keys for pengajuan tables (after pengajuan tables are created)
  try {
    await db.query(`
      ALTER TABLE \`pengajuan\` 
      ADD CONSTRAINT \`fk_pengajuan_pegawai_nip\` 
      FOREIGN KEY (\`pegawai_nip\`) REFERENCES \`pegawai\`(\`nip\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK pengajuan.pegawai_nip added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK pengajuan.pegawai_nip already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`pengajuan\` 
      ADD CONSTRAINT \`fk_pengajuan_created_by\` 
      FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK pengajuan.created_by added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK pengajuan.created_by already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`pengajuan\` 
      ADD CONSTRAINT \`fk_pengajuan_office_id\` 
      FOREIGN KEY (\`office_id\`) REFERENCES \`offices\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK pengajuan.office_id added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK pengajuan.office_id already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`pengajuan_files\` 
      ADD CONSTRAINT \`fk_pengajuan_files_pengajuan_id\` 
      FOREIGN KEY (\`pengajuan_id\`) REFERENCES \`pengajuan\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log('✅ FK pengajuan_files.pengajuan_id added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK pengajuan_files.pengajuan_id already exists or error:', error.message);
    }
  }
};

export const down = async (db: any): Promise<void> => {
  await db.query('ALTER TABLE `pengajuan_files` DROP FOREIGN KEY `fk_pengajuan_files_pengajuan_id`');
  await db.query('ALTER TABLE `pengajuan` DROP FOREIGN KEY `fk_pengajuan_office_id`');
  await db.query('ALTER TABLE `pengajuan` DROP FOREIGN KEY `fk_pengajuan_created_by`');
  await db.query('ALTER TABLE `pengajuan` DROP FOREIGN KEY `fk_pengajuan_pegawai_nip`');
};
