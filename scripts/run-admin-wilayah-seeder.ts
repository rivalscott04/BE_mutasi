import { db } from '../src/models';
import { up } from '../src/seeders/adminWilayahFileConfigSeeder';

async function runSeeder() {
  try {
    console.log('🚀 Starting Admin Wilayah File Config seeder...');
    
    // Test database connection
    await db.authenticate();
    console.log('✅ Database connection established');
    
    // Run seeder
    await up({} as any);
    
    console.log('🎉 Seeder completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
}

runSeeder();

