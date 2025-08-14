import { readdirSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

interface Migration {
  filename: string;
  up: (queryInterface: any) => Promise<void>;
  down: (queryInterface: any) => Promise<void>;
}

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    console.log('=====================================');

    // Get migration files
    const migrationsDir = join(__dirname, '../migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    // Create migrations table to track what's been run
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already executed migrations
    const [executedMigrations] = await db.query('SELECT filename FROM migrations');
    const executedFilenames = (executedMigrations as any[]).map(m => m.filename);

    console.log(`\n📊 Already executed: ${executedFilenames.length} migrations`);

    // Run pending migrations
    let pendingCount = 0;
    for (const filename of migrationFiles) {
      if (executedFilenames.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      pendingCount++;
      console.log(`\n🔄 Running migration: ${filename}`);

      try {
        // Import the migration with file:// protocol for Windows
        const migrationPath = join(migrationsDir, filename);
        const fileUrl = `file:///${migrationPath.replace(/\\/g, '/')}`;
        const migration = await import(fileUrl);

        // Create simple QueryInterface mock
        const queryInterface = {
          createTable: async (tableName: string, attributes: any, options?: any) => {
            const columns = Object.entries(attributes).map(([name, attr]: [string, any]) => {
              let definition = `\`${name}\` `;
              
              // Handle data types
              if (attr.type.key === 'CHAR') {
                definition += `CHAR(${attr.type._length || 36})`;
              } else if (attr.type.key === 'STRING') {
                definition += `VARCHAR(${attr.type._length || 255})`;
              } else if (attr.type.key === 'TEXT') {
                definition += 'TEXT';
              } else if (attr.type.key === 'INTEGER') {
                definition += 'INT';
              } else if (attr.type.key === 'BOOLEAN') {
                definition += 'TINYINT(1)';
              } else if (attr.type.key === 'DATE') {
                definition += 'DATETIME';
              } else if (attr.type.key === 'ENUM') {
                const values = attr.type.values.map((v: string) => `'${v}'`).join(',');
                definition += `ENUM(${values})`;
              } else if (attr.type.key === 'JSON') {
                definition += 'JSON';
              } else {
                definition += 'VARCHAR(255)';
              }

              // Handle constraints
              if (attr.primaryKey) definition += ' PRIMARY KEY';
              if (attr.autoIncrement) definition += ' AUTO_INCREMENT';
              if (attr.allowNull === false) definition += ' NOT NULL';
              if (attr.unique) definition += ' UNIQUE';
              if (attr.defaultValue !== undefined) {
                if (typeof attr.defaultValue === 'string') {
                  definition += ` DEFAULT '${attr.defaultValue}'`;
                } else if (typeof attr.defaultValue === 'boolean') {
                  definition += ` DEFAULT ${attr.defaultValue ? 1 : 0}`;
                } else if (attr.defaultValue.toString() === 'NOW') {
                  definition += ` DEFAULT CURRENT_TIMESTAMP`;
                } else {
                  definition += ` DEFAULT ${attr.defaultValue}`;
                }
              }

              return definition;
            }).join(',\n  ');

            const sql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n  ${columns}\n)`;
            await db.query(sql);
            console.log(`  ✅ Table '${tableName}' created`);
          },

          addIndex: async (tableName: string, columns: string[], options: any) => {
            const columnList = Array.isArray(columns) ? columns.join(',') : columns;
            const indexName = options.name || `idx_${tableName}_${columnList.replace(/,/g, '_')}`;
            const sql = `CREATE INDEX IF NOT EXISTS \`${indexName}\` ON \`${tableName}\`(\`${columnList.replace(/,/g, '`,`')}\`)`;
            await db.query(sql);
            console.log(`  ✅ Index '${indexName}' created`);
          },

          bulkInsert: async (tableName: string, records: any[], options: any = {}) => {
            if (records.length === 0) return;
            
            const columns = Object.keys(records[0]);
            const values = records.map(record => {
              return `(${columns.map(col => {
                const val = record[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                if (typeof val === 'boolean') return val ? '1' : '0';
                return val;
              }).join(',')})`;
            }).join(',\n  ');

            const sql = `INSERT ${options.ignoreDuplicates ? 'IGNORE' : ''} INTO \`${tableName}\` (\`${columns.join('`,`')}\`) VALUES\n  ${values}`;
            await db.query(sql);
            console.log(`  ✅ Inserted ${records.length} records into '${tableName}'`);
          },

          dropTable: async (tableName: string) => {
            await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`  ✅ Table '${tableName}' dropped`);
          },

          bulkDelete: async (tableName: string, where: any) => {
            await db.query(`DELETE FROM \`${tableName}\``);
            console.log(`  ✅ Data deleted from '${tableName}'`);
          }
        };

        // Run the migration
        await migration.up(queryInterface);

        // Mark as executed
        await db.query('INSERT INTO migrations (filename) VALUES (?)', [filename]);
        console.log(`✅ Migration ${filename} completed successfully`);

      } catch (error) {
        console.error(`❌ Migration ${filename} failed:`, error);
        throw error;
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Executed ${pendingCount} new migrations`);
    console.log(`✅ Database is up to date!`);

    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const tables = ['offices', 'users', 'pegawai', 'letters', 'pengajuan', 'pengajuan_files', 'job_type_configuration'];
    
    for (const table of tables) {
      try {
        const [result] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = (result as any)[0].count;
        console.log(`✅ Table '${table}': ${count} records`);
      } catch (error) {
        console.log(`❌ Table '${table}': Not found or error`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
