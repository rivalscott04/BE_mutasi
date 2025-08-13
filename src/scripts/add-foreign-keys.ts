import db from '../utils/db';

async function addForeignKeys() {
  try {
    console.log('🔗 Adding foreign key constraints...');
    
    const foreignKeys = [
      {
        name: 'fk_users_office_id',
        table: 'users',
        column: 'office_id',
        refTable: 'offices',
        refColumn: 'id'
      },
      {
        name: 'fk_pegawai_office_id',
        table: 'pegawai',
        column: 'office_id',
        refTable: 'offices',
        refColumn: 'id'
      },
      {
        name: 'fk_letters_created_by',
        table: 'letters',
        column: 'created_by',
        refTable: 'users',
        refColumn: 'id'
      },
      {
        name: 'fk_letters_office_id',
        table: 'letters',
        column: 'office_id',
        refTable: 'offices',
        refColumn: 'id'
      },
      {
        name: 'fk_letters_recipient_employee_nip',
        table: 'letters',
        column: 'recipient_employee_nip',
        refTable: 'pegawai',
        refColumn: 'nip'
      },
      {
        name: 'fk_pengajuan_pegawai_nip',
        table: 'pengajuan',
        column: 'pegawai_nip',
        refTable: 'pegawai',
        refColumn: 'nip'
      },
      {
        name: 'fk_pengajuan_created_by',
        table: 'pengajuan',
        column: 'created_by',
        refTable: 'users',
        refColumn: 'id'
      },
      {
        name: 'fk_pengajuan_office_id',
        table: 'pengajuan',
        column: 'office_id',
        refTable: 'offices',
        refColumn: 'id'
      },
      {
        name: 'fk_pengajuan_files_pengajuan_id',
        table: 'pengajuan_files',
        column: 'pengajuan_id',
        refTable: 'pengajuan',
        refColumn: 'id'
      }
    ];
    
    for (const fk of foreignKeys) {
      try {
        // Check if foreign key already exists
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
        
        // Add foreign key
        const alterQuery = `
          ALTER TABLE ${fk.table} 
          ADD CONSTRAINT ${fk.name} 
          FOREIGN KEY (${fk.column}) 
          REFERENCES ${fk.refTable}(${fk.refColumn}) 
          ON DELETE SET NULL
        `;
        
        // Special case for pengajuan_files (CASCADE)
        if (fk.name === 'fk_pengajuan_files_pengajuan_id') {
          const alterQueryCascade = `
            ALTER TABLE ${fk.table} 
            ADD CONSTRAINT ${fk.name} 
            FOREIGN KEY (${fk.column}) 
            REFERENCES ${fk.refTable}(${fk.refColumn}) 
            ON DELETE CASCADE
          `;
          await db.query(alterQueryCascade);
        } else {
          await db.query(alterQuery);
        }
        
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
    
    console.log('🎉 Foreign key constraints added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Adding foreign keys failed:', error);
    process.exit(1);
  }
}

addForeignKeys();
