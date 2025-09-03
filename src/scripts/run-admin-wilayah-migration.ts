import { execSync } from 'child_process';
import path from 'path';

console.log('🚀 Starting Admin Wilayah Migration...\n');

try {
  // Run migrations in sequence
  console.log('📋 Running migration: Add workflow fields...');
  execSync('npx ts-node src/migrations/005_add_workflow_fields.ts', { stdio: 'inherit' });
  console.log('✅ Workflow fields migration completed\n');

  console.log('📋 Running migration: Create admin wilayah file config table...');
  execSync('npx ts-node src/migrations/006_create_admin_wilayah_file_config.ts', { stdio: 'inherit' });
  console.log('✅ Admin wilayah file config table migration completed\n');

  console.log('📋 Running migration: Add admin_wilayah role...');
  execSync('npx ts-node src/migrations/007_add_admin_wilayah_role.ts', { stdio: 'inherit' });
  console.log('✅ Admin wilayah role migration completed\n');

  console.log('📋 Running migration: Add wilayah field to users...');
  execSync('npx ts-node src/migrations/008_add_wilayah_to_users.ts', { stdio: 'inherit' });
  console.log('✅ Wilayah field migration completed\n');

  console.log('🌱 Running seeder: Admin wilayah file config...');
  execSync('npx ts-node src/seeders/004_admin_wilayah_file_config_seeder.ts', { stdio: 'inherit' });
  console.log('✅ Admin wilayah file config seeder completed\n');

  console.log('🌱 Running seeder: Admin wilayah users...');
  execSync('npx ts-node src/seeders/005_admin_wilayah_users_seeder.ts', { stdio: 'inherit' });
  console.log('✅ Admin wilayah users seeder completed\n');

  console.log('🎉 All Admin Wilayah migrations completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Test admin wilayah access control');
  console.log('3. Verify wilayah-based filtering');
  console.log('\n🔑 Sample Admin Wilayah Login (NTB Regions):');
  console.log('Email: admin.wilayah.lombok.barat@kemenag.go.id');
  console.log('Password: adminwilayah123');
  console.log('\n📍 Available NTB Admin Wilayah with Coverage:');
  console.log('- Lombok Barat → KABUPATEN LOMBOK BARAT');
  console.log('- Lombok Timur → KABUPATEN LOMBOK TIMUR');
  console.log('- Lombok Tengah → KABUPATEN LOMBOK TENGAH');
  console.log('- Lombok Utara → KABUPATEN LOMBOK UTARA');
  console.log('- Sumbawa → KABUPATEN SUMBAWA');
  console.log('- Sumbawa Barat → KABUPATEN SUMBAWA BARAT');
  console.log('- Kota Mataram → KOTA MATARAM');
  console.log('- Kota Bima → KOTA BIMA');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

