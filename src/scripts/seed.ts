import { readdirSync } from 'fs';
import { join } from 'path';
import db from '../utils/db';

async function seed() {
  try {
    console.log('🌱 Running seeders...');
    console.log('==================');

    // Create seeders table to track executed seeders
    await db.query(`
      CREATE TABLE IF NOT EXISTS seeders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get seeder files
    const seedersDir = join(__dirname, '../seeders');
    const seederFiles = readdirSync(seedersDir)
      .filter(file => file.endsWith('.ts'))
      .sort();

    console.log(`📋 Found ${seederFiles.length} seeder files`);

    // Get executed seeders
    const [executedSeeders] = await db.query('SELECT filename FROM seeders');
    const executedFilenames = (executedSeeders as any[]).map(s => s.filename);

    let executedCount = 0;
    for (const filename of seederFiles) {
      if (executedFilenames.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      executedCount++;
      console.log(`\n🌱 Running seeder: ${filename}`);

      try {
        const seederPath = join(seedersDir, filename);
        const fileUrl = `file:///${seederPath.replace(/\\/g, '/')}`;
        const seeder = await import(fileUrl);

        await seeder.seed(db);
        await db.query('INSERT INTO seeders (filename) VALUES (?)', [filename]);
        console.log(`✅ Seeder ${filename} completed`);

      } catch (error) {
        console.error(`❌ Seeder ${filename} failed:`, error);
        throw error;
      }
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Executed ${executedCount} new seeders`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
