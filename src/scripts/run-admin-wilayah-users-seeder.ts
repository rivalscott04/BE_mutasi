import db from '../utils/db';
import bcrypt from 'bcryptjs';

async function runAdminWilayahUsersSeeder() {
  try {
    console.log('🌱 Starting Admin Wilayah Users Seeder...\n');
    
    await db.authenticate();
    console.log('✅ Database connected\n');

    const hashedPassword = await bcrypt.hash('adminwilayah123', 10);
    console.log('🔐 Password hashed\n');
    
    // Add sample admin wilayah users for NTB regions
    const adminWilayahUsers = [
      {
        id: 'admin-wilayah-1',
        email: 'admin.wilayah.lombok.barat@kemenag.go.id',
        password_hash: hashedPassword,
        full_name: 'Admin Wilayah Lombok Barat',
        role: 'admin_wilayah',
        office_id: null, // Admin wilayah tidak terikat ke kantor tertentu
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
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    console.log('📝 Inserting admin wilayah users...');
    await db.query(`
      INSERT INTO users (id, email, password_hash, full_name, role, office_id, is_active, created_at, updated_at) 
      VALUES ${adminWilayahUsers.map((_, index) => `($${index * 9 + 1}, $${index * 9 + 2}, $${index * 9 + 3}, $${index * 9 + 4}, $${index * 9 + 5}, $${index * 9 + 6}, $${index * 9 + 7}, $${index * 9 + 8}, $${index * 9 + 9})`).join(', ')}
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        password_hash = VALUES(password_hash),
        full_name = VALUES(full_name),
        role = VALUES(role),
        is_active = VALUES(is_active),
        updated_at = VALUES(updated_at)
    `, {
      bind: adminWilayahUsers.flatMap(user => [
        user.id, user.email, user.password_hash, user.full_name, 
        user.role, user.office_id, user.is_active, user.created_at, user.updated_at
      ])
    });

    console.log('✅ Admin wilayah users inserted successfully!\n');
    
    console.log('🔑 Created Admin Wilayah Users:');
    adminWilayahUsers.forEach(user => {
      console.log(`- ${user.full_name}: ${user.email}`);
    });
    console.log(`\n🔐 Password for all users: adminwilayah123`);
    
    await db.close();
    console.log('\n🎉 Seeder completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    await db.close();
    process.exit(1);
  }
}

runAdminWilayahUsersSeeder();
