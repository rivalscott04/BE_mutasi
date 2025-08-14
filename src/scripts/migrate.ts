import { readdirSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function migrate() {
  try {
    console.log('🚀 Running migrations...');
    console.log('======================');

    // Create migrations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get migration files
    const migrationsDir = join(__dirname, '../migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files`);

    // Get executed migrations
    const [executedMigrations] = await db.query('SELECT filename FROM migrations');
    const executedFilenames = (executedMigrations as any[]).map(m => m.filename);

    let pendingCount = 0;
    for (const filename of migrationFiles) {
      if (executedFilenames.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      pendingCount++;
      console.log(`\n🔄 Running migration: ${filename}`);

      try {
        const migrationPath = join(migrationsDir, filename);
        const fileUrl = `file:///${migrationPath.replace(/\\/g, '/')}`;
        const migration = await import(fileUrl);

        await migration.up(db);
        await db.query('INSERT INTO migrations (filename) VALUES (?)', [filename]);
        console.log(`✅ Migration ${filename} completed`);

      } catch (error) {
        console.error(`❌ Migration ${filename} failed:`, error);
        throw error;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Executed ${pendingCount} new migrations`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
