import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function setupDatabase() {
  try {
    console.log('🗃️ Setting up complete database...');
    
    // Step 1: Create tables and indexes
    console.log('\n📋 Step 1: Creating tables and indexes...');
    const migrationPath = join(__dirname, '../../../database/migrations/complete_database_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        // Skip foreign key constraints and INSERT statements for now
        if ((statement.includes('ALTER TABLE') && statement.includes('FOREIGN KEY')) ||
            statement.startsWith('INSERT INTO')) {
          console.log(`[${i + 1}/${statements.length}] ⏭️ Skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 80)}...`);
        try {
          await db.query(statement);
        } catch (error: any) {
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate key name') ||
              error.message.includes('Duplicate entry')) {
            console.log(`⚠️ Skipping (already exists): ${statement.substring(0, 50)}...`);
            continue;
          }
          throw error;
        }
      }
    }
    
    // Step 2: Insert default data
    console.log('\n📊 Step 2: Inserting default data...');
    
    // Insert offices
    const officesQuery = `
      INSERT INTO offices (id, name, kabkota, address, phone, email) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'Kantor Kementerian Agama Kota Mataram', 'KOTA MATARAM', 'Jl. Panji Tilar No. 1, Mataram, NTB', '0370-123456', 'mataram@kemenag.go.id'),
      ('22222222-2222-2222-2222-222222222222', 'Kantor Kementerian Agama Kabupaten Lombok Timur', 'KABUPATEN LOMBOK TIMUR', 'Jl. Raya Selong, Lombok Timur, NTB', '0370-222222', 'lotim@kemenag.go.id'),
      ('33333333-3333-3333-3333-333333333333', 'Kantor Kementerian Agama Kabupaten Lombok Tengah', 'KABUPATEN LOMBOK TENGAH', 'Jl. Raya Praya, Lombok Tengah, NTB', '0370-111111', 'loteng@kemenag.go.id'),
      ('44444444-4444-4444-4444-444444444444', 'Kantor Kementerian Agama Kabupaten Sumbawa Barat', 'KABUPATEN SUMBAWA BARAT', 'Jl. Raya Taliwang, Sumbawa Barat, NTB', '0371-555555', 'ksb@kemenag.go.id'),
      ('55555555-5555-5555-5555-555555555555', 'Kantor Kementerian Agama Kabupaten Lombok Utara', 'KABUPATEN LOMBOK UTARA', 'Jl. Raya Tanjung, Lombok Utara, NTB', '0370-333333', 'klu@kemenag.go.id'),
      ('66666666-6666-6666-6666-666666666666', 'Kantor Kementerian Agama Kabupaten Dompu', 'KABUPATEN DOMPU', 'Jl. Raya Dompu, Dompu, NTB', '0374-111111', 'dompu@kemenag.go.id'),
      ('77777777-7777-7777-7777-777777777777', 'Kantor Kementerian Agama Kabupaten Bima', 'KABUPATEN BIMA', 'Jl. Raya Bima, Bima, NTB', '0374-222222', 'kabbima@kemenag.go.id'),
      ('88888888-8888-8888-8888-888888888888', 'Kantor Kementerian Agama Kota Bima', 'KOTA BIMA', 'Jl. Raya Kota Bima, Bima, NTB', '0374-333333', 'kobi@kemenag.go.id'),
      ('99999999-9999-9999-9999-999999999999', 'Kantor Kementerian Agama Kabupaten Lombok Barat', 'KABUPATEN LOMBOK BARAT', 'Jl. Raya Senggigi, Lombok Barat, NTB', '0370-654321', 'lobar@kemenag.go.id'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kantor Kementerian Agama Kabupaten Sumbawa', 'KABUPATEN SUMBAWA', 'Jl. Raya Sumbawa Besar, Sumbawa, NTB', '0371-444444', 'sumbawa@kemenag.go.id')
      ON DUPLICATE KEY UPDATE name = VALUES(name), kabkota = VALUES(kabkota), address = VALUES(address), phone = VALUES(phone), email = VALUES(email), updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.query(officesQuery);
    console.log('✅ Offices data inserted');
    
    // Insert admin user
    const adminQuery = `
      INSERT INTO users (id, email, password_hash, full_name, role, office_id) VALUES 
      ('admin-001', 'admin@kemenag.go.id', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'Admin Kanwil', 'admin', NULL)
      ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          full_name = VALUES(full_name),
          role = VALUES(role),
          office_id = VALUES(office_id),
          updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.query(adminQuery);
    console.log('✅ Admin user inserted');
    
    // Step 3: Fix table structure
    console.log('\n🔧 Step 3: Fixing table structure...');
    try {
      await db.query("ALTER TABLE pegawai ADD COLUMN office_id VARCHAR(36)");
      console.log('✅ Added office_id column to pegawai table');
    } catch (error: any) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️ office_id column already exists in pegawai table');
      } else {
        throw error;
      }
    }
    
    // Step 4: Add foreign key constraints
    console.log('\n🔗 Step 4: Adding foreign key constraints...');
    const foreignKeys = [
      { name: 'fk_users_office_id', table: 'users', column: 'office_id', refTable: 'offices', refColumn: 'id' },
      { name: 'fk_pegawai_office_id', table: 'pegawai', column: 'office_id', refTable: 'offices', refColumn: 'id' },
      { name: 'fk_letters_created_by', table: 'letters', column: 'created_by', refTable: 'users', refColumn: 'id' },
      { name: 'fk_letters_office_id', table: 'letters', column: 'office_id', refTable: 'offices', refColumn: 'id' },
      { name: 'fk_letters_recipient_employee_nip', table: 'letters', column: 'recipient_employee_nip', refTable: 'pegawai', refColumn: 'nip' },
      { name: 'fk_pengajuan_pegawai_nip', table: 'pengajuan', column: 'pegawai_nip', refTable: 'pegawai', refColumn: 'nip' },
      { name: 'fk_pengajuan_created_by', table: 'pengajuan', column: 'created_by', refTable: 'users', refColumn: 'id' },
      { name: 'fk_pengajuan_office_id', table: 'pengajuan', column: 'office_id', refTable: 'offices', refColumn: 'id' },
      { name: 'fk_pengajuan_files_pengajuan_id', table: 'pengajuan_files', column: 'pengajuan_id', refTable: 'pengajuan', refColumn: 'id' }
    ];
    
    for (const fk of foreignKeys) {
      try {
        const [constraints] = await db.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = 'newmutasi' 
          AND TABLE_NAME = '${fk.table}' 
          AND CONSTRAINT_NAME = '${fk.name}'
        `);
        
        if (constraints.length > 0) {
          console.log(`⚠️ Foreign key ${fk.name} already exists, skipping...`);
          continue;
        }
        
        const alterQuery = fk.name === 'fk_pengajuan_files_pengajuan_id' 
          ? `ALTER TABLE ${fk.table} ADD CONSTRAINT ${fk.name} FOREIGN KEY (${fk.column}) REFERENCES ${fk.refTable}(${fk.refColumn}) ON DELETE CASCADE`
          : `ALTER TABLE ${fk.table} ADD CONSTRAINT ${fk.name} FOREIGN KEY (${fk.column}) REFERENCES ${fk.refTable}(${fk.refColumn}) ON DELETE SET NULL`;
        
        await db.query(alterQuery);
        console.log(`✅ Added foreign key: ${fk.name}`);
        
      } catch (error: any) {
        if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
          console.log(`⚠️ Foreign key ${fk.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding foreign key ${fk.name}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📋 Tables created: offices, users, pegawai, letters, pengajuan, pengajuan_files, job_type_configuration');
    console.log('👥 Default data: 10 offices, 1 admin user');
    console.log('🔗 Foreign key constraints: All relationships established');
    console.log('✅ Database is ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
