export const up = async (db: any): Promise<void> => {
  // Add foreign keys for base tables only
  try {
    await db.query(`
      ALTER TABLE \`users\` 
      ADD CONSTRAINT \`fk_users_office_id\` 
      FOREIGN KEY (\`office_id\`) REFERENCES \`offices\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK users.office_id added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK users.office_id already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`pegawai\` 
      ADD CONSTRAINT \`fk_pegawai_kantor_id\` 
      FOREIGN KEY (\`kantor_id\`) REFERENCES \`offices\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK pegawai.kantor_id added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK pegawai.kantor_id already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`letters\` 
      ADD CONSTRAINT \`fk_letters_office_id\` 
      FOREIGN KEY (\`office_id\`) REFERENCES \`offices\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK letters.office_id added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK letters.office_id already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`letters\` 
      ADD CONSTRAINT \`fk_letters_created_by\` 
      FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK letters.created_by added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK letters.created_by already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`letters\` 
      ADD CONSTRAINT \`fk_letters_recipient_employee_nip\` 
      FOREIGN KEY (\`recipient_employee_nip\`) REFERENCES \`pegawai\`(\`nip\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK letters.recipient_employee_nip added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK letters.recipient_employee_nip already exists or error:', error.message);
    }
  }

  try {
    await db.query(`
      ALTER TABLE \`letters\` 
      ADD CONSTRAINT \`fk_letters_signing_official_nip\` 
      FOREIGN KEY (\`signing_official_nip\`) REFERENCES \`pegawai\`(\`nip\`) ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ FK letters.signing_official_nip added');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      console.log('⚠️ FK letters.signing_official_nip already exists or error:', error.message);
    }
  }
};

export const down = async (db: any): Promise<void> => {
  await db.query('ALTER TABLE `letters` DROP FOREIGN KEY `fk_letters_signing_official_nip`');
  await db.query('ALTER TABLE `letters` DROP FOREIGN KEY `fk_letters_recipient_employee_nip`');
  await db.query('ALTER TABLE `letters` DROP FOREIGN KEY `fk_letters_created_by`');
  await db.query('ALTER TABLE `letters` DROP FOREIGN KEY `fk_letters_office_id`');
  await db.query('ALTER TABLE `pegawai` DROP FOREIGN KEY `fk_pegawai_kantor_id`');
  await db.query('ALTER TABLE `users` DROP FOREIGN KEY `fk_users_office_id`');
};
