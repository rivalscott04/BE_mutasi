import db from '../utils/db';

async function updateAdminWilayahWilayah() {
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('🔧 Updating admin wilayah users with wilayah...');
    
    // Update admin wilayah users with their wilayah
    const updates = [
      { email: 'admin.mataram@kemenag.go.id', wilayah: 'KOTA MATARAM' },
      { email: 'admin.wilayah.lombok.barat@kemenag.go.id', wilayah: 'KABUPATEN LOMBOK BARAT' },
      { email: 'admin.wilayah.lombok.timur@kemenag.go.id', wilayah: 'KABUPATEN LOMBOK TIMUR' },
      { email: 'admin.wilayah.lombok.tengah@kemenag.go.id', wilayah: 'KABUPATEN LOMBOK TENGAH' },
      { email: 'admin.wilayah.lombok.utara@kemenag.go.id', wilayah: 'KABUPATEN LOMBOK UTARA' },
      { email: 'admin.wilayah.sumbawa@kemenag.go.id', wilayah: 'KABUPATEN SUMBAWA' },
      { email: 'admin.wilayah.sumbawa.barat@kemenag.go.id', wilayah: 'KABUPATEN SUMBAWA BARAT' },
      { email: 'admin.wilayah.bima@kemenag.go.id', wilayah: 'KOTA BIMA' }
    ];

    for (const update of updates) {
      const [result] = await db.query(`
        UPDATE users 
        SET wilayah = ? 
        WHERE email = ? AND role = 'admin_wilayah'
      `, [update.wilayah, update.email]);
      
      console.log(`✅ Updated ${update.email} with wilayah: ${update.wilayah}`);
    }

    console.log('\n🔍 Verifying updates...');
    
    // Check updated users
    const [userResults] = await db.query(`
      SELECT id, email, role, wilayah, office_id 
      FROM users 
      WHERE role = 'admin_wilayah' 
      ORDER BY email
    `);
    
    console.log('\n👥 Admin wilayah users after update:');
    userResults.forEach((user: any) => {
      console.log(`- ${user.email} | Role: ${user.role} | Wilayah: ${user.wilayah || 'NULL'} | Office: ${user.office_id || 'NULL'}`);
    });

    await db.close();
    console.log('\n🎉 Update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await db.close();
    process.exit(1);
  }
}

updateAdminWilayahWilayah();
