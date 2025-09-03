import { QueryInterface, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

export async function up(queryInterface: QueryInterface) {
  const hashedPassword = await bcrypt.hash('adminwilayah123', 10);
  
  // Add sample admin wilayah users for NTB regions with their wilayah coverage
  await queryInterface.bulkInsert('users', [
    {
      id: 'admin-wilayah-1',
      email: 'admin.wilayah.lombok.barat@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Lombok Barat',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KABUPATEN LOMBOK BARAT',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-2',
      email: 'admin.wilayah.lombok.timur@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Lombok Timur',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KABUPATEN LOMBOK TIMUR',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-3',
      email: 'admin.wilayah.lombok.tengah@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Lombok Tengah',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KABUPATEN LOMBOK TENGAH',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-4',
      email: 'admin.wilayah.sumbawa@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Sumbawa',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KABUPATEN SUMBAWA',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-5',
      email: 'admin.wilayah.sumbawa.barat@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Sumbawa Barat',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KABUPATEN SUMBAWA BARAT',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-6',
      email: 'admin.wilayah.lombok.utara@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Lombok Utara',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KABUPATEN LOMBOK UTARA',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-7',
      email: 'admin.wilayah.mataram@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Kota Mataram',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KOTA MATARAM',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'admin-wilayah-8',
      email: 'admin.wilayah.bima@kemenag.go.id',
      password_hash: hashedPassword,
      full_name: 'Admin Wilayah Kota Bima',
      role: 'admin_wilayah',
      office_id: null,
      wilayah: 'KOTA BIMA',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
}

export async function down(queryInterface: QueryInterface) {
  // Remove admin wilayah users
  await queryInterface.bulkDelete('users', {
    role: 'admin_wilayah'
  });
}
